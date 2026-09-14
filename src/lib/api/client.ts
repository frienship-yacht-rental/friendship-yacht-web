import type { z } from "zod";

import { ApiError, ApiNetworkError, ApiValidationError } from "./errors";

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export type QueryValue = string | number | boolean | null | undefined;

export interface ApiRequestOptions<TSchema extends z.ZodType> {
  /** Schema the response is parsed with. Unvalidated data never escapes here. */
  schema: TSchema;
  method?: HttpMethod;
  body?: unknown;
  searchParams?: Record<string, QueryValue | QueryValue[]>;
  headers?: Record<string, string>;
  signal?: AbortSignal;
  /** Defaults to 10s. A hung upstream must not hold a request open. */
  timeoutMs?: number;
  /** Next.js data cache controls. Ignored in the browser. */
  next?: { revalidate?: number | false; tags?: string[] };
  cache?: RequestCache;
}

export interface ApiClientConfig {
  baseUrl: string;
  /** Merged into every request; used for auth and correlation headers. */
  defaultHeaders?: () =>
    Record<string, string> | Promise<Record<string, string>>;
}

const DEFAULT_TIMEOUT_MS = 10_000;

function buildUrl(
  baseUrl: string,
  path: string,
  searchParams: ApiRequestOptions<z.ZodType>["searchParams"],
): string {
  // Trailing/leading slash normalisation so callers can write either form.
  const url = new URL(
    path.replace(/^\//, ""),
    baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`,
  );

  for (const [key, value] of Object.entries(searchParams ?? {})) {
    const values = Array.isArray(value) ? value : [value];
    for (const item of values) {
      if (item === undefined || item === null || item === "") continue;
      url.searchParams.append(key, String(item));
    }
  }

  return url.toString();
}

async function parseErrorBody(
  response: Response,
): Promise<{ message?: string; code?: string; details?: unknown }> {
  try {
    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.includes("application/json")) {
      const text = await response.text();
      return text ? { message: text.slice(0, 500) } : {};
    }
    const body: unknown = await response.json();
    if (typeof body === "object" && body !== null) {
      const record = body as Record<string, unknown>;
      return {
        message:
          typeof record["message"] === "string" ? record["message"] : undefined,
        code: typeof record["code"] === "string" ? record["code"] : undefined,
        details: record["details"] ?? record["errors"],
      };
    }
    return {};
  } catch {
    // A malformed error body must not mask the original status.
    return {};
  }
}

/**
 * Creates a typed HTTP client for a single API origin.
 *
 * Every response is validated against a Zod schema, so a backend contract
 * change surfaces as a loud `ApiValidationError` at the boundary rather than as
 * `undefined` somewhere deep in a component tree.
 */
export function createApiClient(config: ApiClientConfig) {
  async function request<TSchema extends z.ZodType>(
    path: string,
    options: ApiRequestOptions<TSchema>,
  ): Promise<z.infer<TSchema>> {
    const {
      schema,
      method = "GET",
      body,
      searchParams,
      headers,
      signal,
      timeoutMs = DEFAULT_TIMEOUT_MS,
      next,
      cache,
    } = options;

    const url = buildUrl(config.baseUrl, path, searchParams);
    const defaultHeaders = (await config.defaultHeaders?.()) ?? {};

    // Combine the caller's signal with a timeout so neither is lost.
    const timeoutSignal = AbortSignal.timeout(timeoutMs);
    const combinedSignal = signal
      ? AbortSignal.any([signal, timeoutSignal])
      : timeoutSignal;

    const requestInit: RequestInit & {
      next?: { revalidate?: number | false; tags?: string[] };
    } = {
      method,
      signal: combinedSignal,
      headers: {
        Accept: "application/json",
        ...(body === undefined ? {} : { "Content-Type": "application/json" }),
        ...defaultHeaders,
        ...headers,
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      ...(cache ? { cache } : {}),
      ...(next ? { next } : {}),
    };

    let response: Response;
    try {
      response = await fetch(url, requestInit);
    } catch (cause) {
      throw new ApiNetworkError(url, cause);
    }

    if (!response.ok) {
      const parsed = await parseErrorBody(response);
      throw new ApiError(
        parsed.message ?? `${method} ${url} failed with ${response.status}`,
        {
          status: response.status,
          url,
          code: parsed.code,
          details: parsed.details,
        },
      );
    }

    // 204 No Content — let the schema decide whether that is acceptable.
    const payload: unknown =
      response.status === 204 ? undefined : await response.json();

    const result = schema.safeParse(payload);
    if (!result.success) {
      throw new ApiValidationError(url, result.error.issues);
    }

    return result.data as z.infer<TSchema>;
  }

  return {
    request,
    get: <TSchema extends z.ZodType>(
      path: string,
      options: Omit<ApiRequestOptions<TSchema>, "method" | "body">,
    ) => request(path, { ...options, method: "GET" }),
    post: <TSchema extends z.ZodType>(
      path: string,
      options: Omit<ApiRequestOptions<TSchema>, "method">,
    ) => request(path, { ...options, method: "POST" }),
    put: <TSchema extends z.ZodType>(
      path: string,
      options: Omit<ApiRequestOptions<TSchema>, "method">,
    ) => request(path, { ...options, method: "PUT" }),
    patch: <TSchema extends z.ZodType>(
      path: string,
      options: Omit<ApiRequestOptions<TSchema>, "method">,
    ) => request(path, { ...options, method: "PATCH" }),
    delete: <TSchema extends z.ZodType>(
      path: string,
      options: Omit<ApiRequestOptions<TSchema>, "method" | "body">,
    ) => request(path, { ...options, method: "DELETE" }),
  };
}

export type ApiClient = ReturnType<typeof createApiClient>;

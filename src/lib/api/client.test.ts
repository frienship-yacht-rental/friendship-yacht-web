import { beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";

import { createApiClient } from "./client";
import { ApiError, ApiNetworkError, ApiValidationError } from "./errors";

const schema = z.object({ id: z.string(), name: z.string() });

const api = createApiClient({
  baseUrl: "https://api.example.com/v1",
  defaultHeaders: () => ({ Authorization: "Bearer test-token" }),
});

function jsonResponse(body: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "content-type": "application/json" },
    ...init,
  });
}

// Typed so `spy.mock.calls[n]` keeps its tuple shape under
// `noUncheckedIndexedAccess`.
function mockFetch(response: Response) {
  const spy = vi.fn(
    (_input: RequestInfo | URL, _init?: RequestInit): Promise<Response> =>
      Promise.resolve(response),
  );
  vi.stubGlobal("fetch", spy);
  return spy;
}

describe("createApiClient", () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns data parsed through the schema", async () => {
    mockFetch(jsonResponse({ id: "1", name: "Aurora", extra: "ignored" }));

    const result = await api.get("/yachts/1", { schema });

    expect(result).toEqual({ id: "1", name: "Aurora" });
  });

  it("resolves paths against the base URL without dropping the path prefix", async () => {
    const spy = mockFetch(jsonResponse({ id: "1", name: "Aurora" }));

    await api.get("/yachts/1", { schema });

    expect(spy).toHaveBeenCalledWith(
      "https://api.example.com/v1/yachts/1",
      expect.anything(),
    );
  });

  it("serialises search params and omits empty values", async () => {
    const spy = mockFetch(jsonResponse({ id: "1", name: "Aurora" }));

    await api.get("/yachts", {
      schema,
      searchParams: {
        limit: 10,
        cursor: undefined,
        q: "",
        archived: false,
        tag: ["sail", "classic"],
      },
    });

    const calledUrl = new URL(String(spy.mock.calls[0]?.[0]));
    expect(calledUrl.searchParams.get("limit")).toBe("10");
    expect(calledUrl.searchParams.get("archived")).toBe("false");
    expect(calledUrl.searchParams.getAll("tag")).toEqual(["sail", "classic"]);
    expect(calledUrl.searchParams.has("cursor")).toBe(false);
    expect(calledUrl.searchParams.has("q")).toBe(false);
  });

  it("applies default headers and JSON body on writes", async () => {
    const spy = mockFetch(jsonResponse({ id: "1", name: "Aurora" }));

    await api.post("/yachts", { schema, body: { name: "Aurora" } });

    const init = spy.mock.calls[0]?.[1] as RequestInit;
    const headers = init.headers as Record<string, string>;
    expect(init.method).toBe("POST");
    expect(init.body).toBe(JSON.stringify({ name: "Aurora" }));
    expect(headers["Content-Type"]).toBe("application/json");
    expect(headers["Authorization"]).toBe("Bearer test-token");
  });

  it("throws ApiError carrying the status and server message", async () => {
    mockFetch(
      jsonResponse(
        { message: "Yacht not found", code: "NOT_FOUND" },
        { status: 404 },
      ),
    );

    const error = await api.get("/yachts/nope", { schema }).catch((e) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect(error.status).toBe(404);
    expect(error.code).toBe("NOT_FOUND");
    expect(error.message).toBe("Yacht not found");
    expect(error.isNotFound).toBe(true);
    expect(error.isRetryable).toBe(false);
  });

  it("marks 5xx responses as retryable", async () => {
    mockFetch(jsonResponse({ message: "boom" }, { status: 503 }));

    const error = await api.get("/yachts", { schema }).catch((e) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect(error.isRetryable).toBe(true);
  });

  it("throws ApiValidationError when the payload breaks the contract", async () => {
    mockFetch(jsonResponse({ id: 1, name: null }));

    const error = await api.get("/yachts/1", { schema }).catch((e) => e);

    expect(error).toBeInstanceOf(ApiValidationError);
    expect(error.issues).toBeDefined();
  });

  it("wraps transport failures in ApiNetworkError", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.reject(new TypeError("Failed to fetch"))),
    );

    const error = await api.get("/yachts", { schema }).catch((e) => e);

    expect(error).toBeInstanceOf(ApiNetworkError);
    expect(error.url).toContain("/yachts");
  });
});

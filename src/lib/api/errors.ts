/**
 * Error thrown when the API returns a non-2xx response.
 *
 * Carries the status so callers can branch (404 -> notFound(), 401 -> sign in)
 * without string-matching a message.
 */
export class ApiError extends Error {
  readonly status: number;
  readonly url: string;
  readonly code: string | undefined;
  readonly details: unknown;

  constructor(
    message: string,
    options: {
      status: number;
      url: string;
      code?: string | undefined;
      details?: unknown;
      cause?: unknown;
    },
  ) {
    super(message, { cause: options.cause });
    this.name = "ApiError";
    this.status = options.status;
    this.url = options.url;
    this.code = options.code;
    this.details = options.details;
  }

  get isNotFound(): boolean {
    return this.status === 404;
  }

  get isUnauthorized(): boolean {
    return this.status === 401 || this.status === 403;
  }

  /** 5xx and network failures are worth retrying; 4xx are not. */
  get isRetryable(): boolean {
    return this.status >= 500 || this.status === 0;
  }
}

/**
 * Thrown when the API responds successfully but the payload does not match the
 * schema the app expects. This is a contract violation, not a user error — it
 * should page someone, so it is deliberately distinct from `ApiError`.
 */
export class ApiValidationError extends Error {
  readonly url: string;
  readonly issues: unknown;

  constructor(url: string, issues: unknown) {
    super(`API response did not match the expected schema for ${url}`);
    this.name = "ApiValidationError";
    this.url = url;
    this.issues = issues;
  }
}

/** Network failure, DNS error, or timeout — no HTTP response was received. */
export class ApiNetworkError extends Error {
  readonly url: string;

  constructor(url: string, cause: unknown) {
    super(`Request to ${url} failed`, { cause });
    this.name = "ApiNetworkError";
    this.url = url;
  }
}

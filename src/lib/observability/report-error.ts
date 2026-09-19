export interface ErrorContext {
  /** Where the error was caught, e.g. "error-boundary", "server-action". */
  source: string;
  /** Next.js error digest, when available — correlates with server logs. */
  digest?: string | undefined;
  [key: string]: unknown;
}

/**
 * Single seam for error reporting. Every boundary in the app calls this
 * instead of a vendor SDK, so adopting Sentry (or anything else) is a change
 * to this file only. Safe to call on the server and in the browser.
 */
export function reportError(error: unknown, context: ErrorContext): void {
  // Replace the body with the reporter's capture call; keep the signature.
  console.error(`[${context.source}]`, error, context);
}

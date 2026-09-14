import { describe, expect, it } from "vitest";

import { ApiError } from "@/lib/api/errors";

import { getQueryClient } from "./client";

type RetryFn = (failureCount: number, error: Error) => boolean;

function apiError(status: number) {
  return new ApiError("boom", { status, url: "https://api.test.local/x" });
}

function getRetry(): RetryFn {
  const retry = getQueryClient().getDefaultOptions().queries?.retry;
  if (typeof retry !== "function") {
    throw new Error("Expected the default retry option to be a function");
  }
  return retry as RetryFn;
}

describe("getQueryClient", () => {
  it("reuses a single client in the browser so the cache survives re-renders", () => {
    expect(getQueryClient()).toBe(getQueryClient());
  });

  it("does not refetch immediately after SSR hydration", () => {
    expect(getQueryClient().getDefaultOptions().queries?.staleTime).toBe(
      60_000,
    );
  });

  it("does not retry client errors", () => {
    const retry = getRetry();
    expect(retry(0, apiError(404))).toBe(false);
    expect(retry(0, apiError(401))).toBe(false);
  });

  it("retries server errors up to twice", () => {
    const retry = getRetry();
    expect(retry(0, apiError(503))).toBe(true);
    expect(retry(1, apiError(503))).toBe(true);
    expect(retry(2, apiError(503))).toBe(false);
  });

  it("retries unknown errors, which may be transient", () => {
    const retry = getRetry();
    expect(retry(0, new Error("network glitch"))).toBe(true);
  });
});

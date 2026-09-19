"use client";

import { useQuery } from "@tanstack/react-query";

import { getBrowserApi } from "@/lib/api/browser";

import { yachtListSchema } from "./schema";

export const yachtQueryKeys = {
  all: ["yachts"] as const,
  list: (params: { limit?: number; offset?: number }) =>
    [...yachtQueryKeys.all, "list", params] as const,
};

/**
 * Client-side read for genuinely interactive cases (load-more, filters that
 * change without navigation). Prefer `getYachts` in a Server Component when
 * the data does not depend on client state.
 */
export function useYachts(params: { limit?: number; offset?: number } = {}) {
  return useQuery({
    queryKey: yachtQueryKeys.list(params),
    queryFn: () =>
      getBrowserApi().get("/yachts", {
        schema: yachtListSchema,
        searchParams: params,
      }),
  });
}

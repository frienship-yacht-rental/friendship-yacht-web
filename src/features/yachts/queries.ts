import "server-only";

import { serverApi } from "@/lib/api/server";

import { yachtListSchema, yachtSchema } from "./schema";

/** Cache tags, so a webhook can revalidate exactly what changed. */
export const yachtCacheTags = {
  all: "yachts",
  detail: (slug: string) => `yacht:${slug}`,
} as const;

export async function getYachts(params?: { limit?: number; offset?: number }) {
  return serverApi.get("/yachts", {
    schema: yachtListSchema,
    searchParams: { limit: params?.limit, offset: params?.offset },
    next: { revalidate: 300, tags: [yachtCacheTags.all] },
  });
}

export async function getYachtBySlug(slug: string) {
  return serverApi.get(`/yachts/${slug}`, {
    schema: yachtSchema,
    next: {
      revalidate: 300,
      tags: [yachtCacheTags.all, yachtCacheTags.detail(slug)],
    },
  });
}

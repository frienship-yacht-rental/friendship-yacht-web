import { timingSafeEqual } from "node:crypto";

import { revalidateTag } from "next/cache";
import { z } from "zod";

import { env } from "@/env";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  tags: z.array(z.string().min(1).max(256)).min(1).max(50),
});

function secretMatches(provided: string | null): boolean {
  if (!env.REVALIDATE_SECRET || !provided) return false;
  const expected = Buffer.from(env.REVALIDATE_SECRET);
  const actual = Buffer.from(provided);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

/**
 * On-demand revalidation webhook. The API (or a CMS) calls this when data
 * changes so cached pages refresh immediately instead of waiting for
 * `revalidate` to expire.
 *
 * Example:
 *   POST /api/revalidate
 *   x-revalidate-secret: <REVALIDATE_SECRET>
 *   { "tags": ["yachts"] }
 */
export async function POST(request: Request) {
  if (!secretMatches(request.headers.get("x-revalidate-secret"))) {
    return Response.json({ message: "Unauthorized" }, { status: 401 });
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json(
      {
        message: "Expected { tags: string[] }",
        issues: z.flattenError(parsed.error),
      },
      { status: 422 },
    );
  }

  // "max" = stale-while-revalidate: visitors keep getting the cached page
  // while the next request refreshes it in the background.
  for (const tag of parsed.data.tags) revalidateTag(tag, "max");

  return Response.json({
    revalidated: parsed.data.tags,
    at: new Date().toISOString(),
  });
}

import { env } from "@/env";

import { type ApiClient, createApiClient } from "./client";

let client: ApiClient | undefined;

/**
 * API client for Client Components, used through TanStack Query.
 *
 * Created lazily so the missing-configuration error is thrown at the call site
 * rather than at module load, where it would break unrelated imports.
 *
 * Prefer fetching in a Server Component. Reach for this only when the data
 * genuinely depends on client state — search-as-you-type, infinite scroll,
 * polling.
 */
export function getBrowserApi(): ApiClient {
  if (!client) {
    if (!env.NEXT_PUBLIC_API_URL) {
      throw new Error(
        "NEXT_PUBLIC_API_URL is not set. It is required for client-side API calls.",
      );
    }
    client = createApiClient({ baseUrl: env.NEXT_PUBLIC_API_URL });
  }
  return client;
}

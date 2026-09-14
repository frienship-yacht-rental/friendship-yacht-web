import "server-only";

import { env } from "@/env";

import { createApiClient } from "./client";

/**
 * API client for Server Components, Route Handlers and Server Actions.
 *
 * `server-only` makes importing this from a Client Component a build error, so
 * `API_TOKEN` cannot leak into the browser bundle by accident.
 */
export const serverApi = createApiClient({
  baseUrl: env.API_BASE_URL,
  defaultHeaders: () => ({
    ...(env.API_TOKEN ? { Authorization: `Bearer ${env.API_TOKEN}` } : {}),
  }),
});

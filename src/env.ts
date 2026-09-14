import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

/**
 * Typed, validated environment variables.
 *
 * Import `env` instead of reading `process.env` directly: server-only secrets
 * are then impossible to reference from a Client Component (t3-env throws), and
 * every value is parsed once at startup rather than trusted at the call site.
 *
 * `next.config.ts` imports this module so a misconfigured deployment fails at
 * build time instead of on the first request.
 */
export const env = createEnv({
  /**
   * Available on both the server and the client.
   */
  shared: {
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
  },

  /**
   * Server-only. Never exposed to the browser.
   */
  server: {
    /** Base URL of friendship-yacht-api, used for server-side data fetching. */
    API_BASE_URL: z.url(),

    /** Bearer token for authenticated server-to-server API calls. */
    API_TOKEN: z.string().min(1).optional(),

    /** Shared secret for on-demand revalidation webhooks. */
    REVALIDATE_SECRET: z.string().min(16).optional(),
  },

  /**
   * Exposed to the browser. Must be prefixed with `NEXT_PUBLIC_`.
   * Treat everything here as public — it ships in the client bundle.
   */
  client: {
    /** Canonical public origin, used for metadata, sitemap and robots. */
    NEXT_PUBLIC_SITE_URL: z.url(),

    /** Browser-reachable API origin for client-side queries. */
    NEXT_PUBLIC_API_URL: z.url().optional(),
  },

  /**
   * Next.js inlines `process.env.NEXT_PUBLIC_*` at build time, so client vars
   * must be destructured manually rather than read dynamically.
   */
  runtimeEnv: {
    NODE_ENV: process.env.NODE_ENV,
    API_BASE_URL: process.env.API_BASE_URL,
    API_TOKEN: process.env.API_TOKEN,
    REVALIDATE_SECRET: process.env.REVALIDATE_SECRET,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  },

  /** Escape hatch for Docker builds and CI steps that only need to compile. */
  skipValidation: Boolean(process.env.SKIP_ENV_VALIDATION),

  /** Treat `FOO=` in a .env file as unset so defaults and `.optional()` apply. */
  emptyStringAsUndefined: true,
});

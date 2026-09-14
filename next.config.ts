// Validate environment variables at build time. Importing this here means a
// misconfigured deployment fails during `next build` instead of at runtime.
import "./src/env";

import createBundleAnalyzer from "@next/bundle-analyzer";
import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

/**
 * Origins the browser is allowed to talk to. The backend API is included so
 * client-side queries (TanStack Query) are not blocked by CSP.
 */
const apiOrigin = (() => {
  const raw = process.env.NEXT_PUBLIC_API_URL;
  if (!raw) return null;
  try {
    return new URL(raw).origin;
  } catch {
    return null;
  }
})();

/**
 * Static Content Security Policy.
 *
 * `'unsafe-inline'` is required for scripts and styles because this app is
 * statically prerendered: Next.js inlines its bootstrap/flight payload and
 * Tailwind emits inline style attributes, and neither carries a nonce in a
 * static response. The policy still constrains every external origin, which is
 * where the real risk lives.
 *
 * When this app gains authenticated, dynamically rendered routes, upgrade to a
 * nonce-based policy in `proxy.ts` (Next 16 renamed `middleware` to `proxy`):
 * https://nextjs.org/docs/app/guides/content-security-policy
 */
const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' blob: data: https:",
  "font-src 'self' data:",
  `connect-src 'self'${apiOrigin ? ` ${apiOrigin}` : ""}${isDev ? " ws: wss:" : ""}`,
  "media-src 'self' https:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "upgrade-insecure-requests",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  // 2 years, required for HSTS preload list submission.
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  },
  { key: "X-DNS-Prefetch-Control", value: "on" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
];

const nextConfig: NextConfig = {
  reactCompiler: true,
  reactStrictMode: true,

  // Compile-time checked `href` values for next/link and next/navigation.
  typedRoutes: true,

  // Do not advertise the framework.
  poweredByHeader: false,

  // Fail the production build on type errors. Set explicitly so nobody
  // silently disables it. (Next 16 removed `next lint`, so there is no
  // corresponding `eslint` option — linting runs as its own CI step.)
  typescript: { ignoreBuildErrors: false },

  images: {
    formats: ["image/avif", "image/webp"],
    // Add the CDN / DAM host here once media hosting is decided.
    remotePatterns: apiOrigin
      ? [
          {
            protocol: new URL(apiOrigin).protocol.replace(":", "") as
              "http" | "https",
            hostname: new URL(apiOrigin).hostname,
          },
        ]
      : [],
  },

  experimental: {
    // Tree-shake barrel-file imports from these packages.
    optimizePackageImports: ["lucide-react", "radix-ui"],
  },

  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
      // Note: do not add Cache-Control for /_next/static — Next.js already
      // serves hashed build output as immutable, and overriding it breaks
      // development behaviour.
    ];
  },
};

const withBundleAnalyzer = createBundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

export default withBundleAnalyzer(nextConfig);

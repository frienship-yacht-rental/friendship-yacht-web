# Friendship Yachts — Web

Marketing and product site for Friendship Yachts, built on the Next.js App
Router. Content and catalogue data come from the separate
[`friendship-yacht-api`](../friendship-yacht-api) service.

## Stack

| Concern       | Choice                                             |
| ------------- | -------------------------------------------------- |
| Framework     | Next.js 16 (App Router, Turbopack, React 19)       |
| Language      | TypeScript 5 (strict + `noUncheckedIndexedAccess`) |
| Styling       | Tailwind CSS v4 (CSS-first config)                 |
| Components    | shadcn/ui on Radix primitives                      |
| Data (server) | Server Components → typed API client               |
| Data (client) | TanStack Query v5                                  |
| Validation    | Zod v4 (env, API responses, forms)                 |
| Unit tests    | Vitest 5 + React Testing Library                   |
| E2E tests     | Playwright                                         |
| Lint / format | ESLint 9 (flat config) + Prettier 3                |

## Requirements

- Node.js `>=20.9` — the repo pins 24 in `.nvmrc`
- pnpm `>=11` (see `packageManager` in `package.json`)

## Getting started

```bash
pnpm install
cp .env.example .env.local   # then fill in the values
pnpm dev
```

The app runs at http://localhost:3000.

Environment variables are validated by `src/env.ts` on startup, so a missing or
malformed value fails fast with a readable message instead of surfacing as
`undefined` at request time.

## Scripts

| Script               | Purpose                                         |
| -------------------- | ----------------------------------------------- |
| `pnpm dev`           | Dev server (Turbopack)                          |
| `pnpm build`         | Production build                                |
| `pnpm start`         | Serve the production build                      |
| `pnpm typecheck`     | `tsc --noEmit`                                  |
| `pnpm lint`          | ESLint, zero warnings tolerated                 |
| `pnpm format`        | Write Prettier formatting                       |
| `pnpm test`          | Unit tests, single run                          |
| `pnpm test:watch`    | Unit tests in watch mode                        |
| `pnpm test:coverage` | Unit tests with coverage thresholds             |
| `pnpm test:e2e`      | Playwright against a production build           |
| `pnpm analyze`       | Build with the bundle analyzer                  |
| `pnpm validate`      | Every hook check in one go — run before pushing |

## Project structure

```
src/
├── app/                  # Routes. File conventions only, no business logic.
│   ├── layout.tsx        # Root layout, fonts, metadata, providers
│   ├── page.tsx          # /
│   ├── yachts/           # /yachts: ISR catalogue with graceful fallback
│   ├── contact/          # /contact: enquiry form (Server Action)
│   ├── api/health/       # Web-tier liveness probe
│   ├── api/revalidate/   # On-demand cache invalidation webhook
│   ├── error.tsx         # Route-level error boundary
│   ├── global-error.tsx  # Root-layout error boundary
│   ├── not-found.tsx     # 404
│   ├── sitemap.ts        # Generated sitemap.xml
│   └── robots.ts         # Generated robots.txt
├── components/
│   ├── ui/               # shadcn/ui. Vendored: regenerate, do not hand-edit.
│   └── providers.tsx     # Client provider boundary
├── features/             # Vertical slices. See features/yachts/README.md.
│   ├── yachts/           # Read reference: schema, queries, hooks, components
│   └── inquiries/        # Write reference: schema, actions, form component
├── lib/
│   ├── api/              # Typed HTTP client (core / server / browser)
│   ├── actions/          # ActionResult + runAction for Server Actions
│   ├── observability/    # reportError, the single error-reporting seam
│   ├── query/            # TanStack Query configuration
│   └── site-config.ts    # Brand and SEO constants
├── test/                 # Vitest setup, render helpers, server-only stub
└── env.ts                # Validated environment variables
e2e/                      # Playwright specs
docs/adr/                 # Architecture decision records
```

Features never import from each other. Anything shared moves up into
`components/` or `lib/`.

The layering rules, how to add a feature, and how to reuse this repository
as a boilerplate are in [AGENTS.md](AGENTS.md). Decisions and their
trade-offs are in [docs/adr/](docs/adr/).

## Architecture notes

### Data access

`src/lib/api/` is split by execution context on purpose:

- `client.ts` — the isomorphic core. Every response is parsed with a Zod schema,
  so a backend contract change fails loudly at the boundary
  (`ApiValidationError`) rather than becoming `undefined` deep in a component
  tree.
- `server.ts` — carries `API_TOKEN` and is marked `server-only`. Importing it
  from a Client Component is a build error, so the token cannot reach the
  browser bundle.
- `browser.ts` — used by TanStack Query for genuinely client-driven data such as
  search-as-you-type, infinite scroll or polling.

Default to fetching in Server Components. Reach for TanStack Query only when the
data depends on client state.

Errors are typed: `ApiError` (HTTP status, with `isNotFound` and `isRetryable`),
`ApiValidationError` (contract violation) and `ApiNetworkError` (transport). The
query client's retry policy uses these, so it will not retry a 404.

### Writes

Server Actions never throw. They return an `ActionResult` (success with
data, or error with a stable `code`, a user-safe `message` and optional
`fieldErrors`) produced by `runAction` in `src/lib/actions/`. Forms consume
it with `useActionState`: field errors render inline, anything else becomes
a toast. See ADR-0006 and `features/inquiries` for the reference.

### Observability

Every boundary (error pages, Server Actions, degraded catalogue renders)
reports through `reportError` in `src/lib/observability/`. It currently
logs; adopting Sentry or similar is a change to that one file.

### Caching

Reads set `next: { revalidate, tags }` and catalogue routes export
`revalidate` explicitly. `POST /api/revalidate` (secured by
`REVALIDATE_SECRET`) calls `revalidateTag(tag, "max")` for the tags it is
given, so the API can refresh pages the moment data changes instead of
waiting for the window to expire. Cache tags live next to the queries that
set them.

If the API is unreachable, catalogue pages render a fallback instead of
failing and heal on the next revalidation (ADR-0007).

**Not yet enabled: Cache Components.** Next 16's `cacheComponents` flag makes
data dynamic by default with explicit `use cache` opt-in, and turns on Partial
Prerendering. It is the direction the framework is heading and is cheapest to
adopt now, while the route tree is small — but it changes caching semantics
everywhere, so it deserves a deliberate team decision rather than being a
default someone inherits. See
`node_modules/next/dist/docs/01-app/02-guides/migrating-to-cache-components.md`.

### Security

Security headers are applied to every route in `next.config.ts`: CSP, HSTS
(preload-ready), `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`,
`Permissions-Policy` and `Cross-Origin-Opener-Policy`. `poweredByHeader` is off.
The Playwright suite asserts these are actually present, so a regression fails
the E2E run rather than shipping quietly.

The CSP allows `'unsafe-inline'` for scripts and styles because the site is
statically prerendered and Next inlines its bootstrap payload without a nonce.
Every external origin is still constrained, which is where the real risk lives.
When authenticated, dynamically rendered routes arrive, move to a nonce-based
policy in `proxy.ts` (Next 16 renamed `middleware` to `proxy`).

`src/env.ts` is the only place `process.env` may be read, and ESLint enforces
that.

## Testing

| Layer | Tool         | Scope                                             |
| ----- | ------------ | ------------------------------------------------- |
| Unit  | Vitest + RTL | Pure logic, schemas, synchronous components       |
| E2E   | Playwright   | Async Server Components, navigation, headers, SEO |

Vitest cannot render async Server Components. That is a known React limitation
rather than a configuration gap, so anything async belongs in `e2e/`. Three
Playwright cases exercise the real API and skip themselves when it is not
running on port 8000; start it to turn them on.

Playwright runs against a production build, not `next dev`: prerendering,
minification and real response headers are exactly what E2E tests exist to
catch.

Coverage thresholds sit at 60% as a floor to ratchet upward. Server-only modules
are excluded because `import "server-only"` throws outside a Server Component,
so Vitest cannot import them at all.

## Quality gates

Enforced locally by husky:

- **pre-commit** — `lint-staged` formats and lints staged files
- **commit-msg** — Conventional Commits, via commitlint
- **pre-push** — `typecheck` plus unit tests (`--no-verify` to skip on a WIP
  branch)

No hosted CI is configured, so the pre-push hook is the last automated gate.
Run `pnpm validate` before opening a PR, and `pnpm test:e2e` for changes that
touch routing, headers, metadata or async data — nothing runs Playwright
automatically.

## Deferred

Deliberately not set up yet. Each is a self-contained addition:

- Internationalisation (`next-intl`) — worth doing before the route tree grows
- Observability (Sentry, OpenTelemetry via `instrumentation.ts`, Web Vitals)
- Authentication and a Data Access Layer
- Container / self-host config (`output: "standalone"` plus a Dockerfile)

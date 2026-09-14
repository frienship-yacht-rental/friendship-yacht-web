<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Project conventions

Read `README.md` for the architecture rationale. This file is the short version:
the rules that are easy to violate by accident.

## Next.js 16 specifics that differ from older training data

- `middleware.ts` is now **`proxy.ts`**.
- Turbopack is the default for both `next dev` and `next build`.
- `next lint` was removed. Linting runs as its own step (`pnpm lint`), and
  `NextConfig` has **no `eslint` key** — adding one is a type error.
- `typedRoutes` is stable and enabled, so `href` values are checked at compile
  time. A non-literal `href` may need `as Route`.
- `experimental.ppr`, `experimental.dynamicIO` and `experimental.useCache` are
  replaced by the single `cacheComponents` flag. It is currently **off**; do not
  add `use cache` directives until it is deliberately enabled.

## Rules

- **Server Components by default.** Add `"use client"` at the smallest possible
  boundary — a leaf that needs interactivity, never a whole page.
- **Never read `process.env` in `src/`.** Import `env` from `@/env`. ESLint
  blocks the alternative. Add new variables to the schema in `src/env.ts` _and_
  to `.env.example`.
- **Every API response gets a Zod schema.** Fetch through `@/lib/api/server`
  (server) or `@/lib/api/browser` (client). Do not call bare `fetch` against the
  backend.
- **Do not hand-edit `src/components/ui/`.** Those files are vendored from the
  shadcn registry and are overwritten by the next `shadcn add`. Wrap them or
  compose around them instead.
- **Features are isolated.** `src/features/<name>/` never imports from another
  feature. Shared code moves to `src/components/` or `src/lib/`.
- **Anything importing `server-only` must be unreachable from a `"use client"`
  module.** The build enforces this; if it fails, the fix is to move the call,
  not to drop the import.

## Before you say you are done

```bash
pnpm validate     # typecheck + lint + format check + unit tests
```

For changes that touch routing, headers, metadata or async data, also run:

```bash
pnpm test:e2e
```

Async Server Components cannot be unit tested — Vitest cannot render them. Cover
them with a Playwright spec in `e2e/` instead.

## Commits

Conventional Commits, enforced by commitlint on `commit-msg`.
Example: `feat(yachts): add fleet listing page`.

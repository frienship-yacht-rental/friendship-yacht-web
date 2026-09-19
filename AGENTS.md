<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Engineering standards — friendship-yacht-web

This file is the contract for anyone — human or agent — changing this
repository. `README.md` explains how to run it; this explains how to change it
without degrading it. Decisions with a "why" live in `docs/adr/`.

The codebase doubles as a boilerplate: `src/features/*`, `src/lib/site-config.ts`
and the routes under `src/app/` are domain; everything else is reusable. See
"Reusing as a boilerplate" at the end.

## Next.js 16 specifics that differ from older training data

- `middleware.ts` is now **`proxy.ts`**.
- Turbopack is the default for `next dev` and `next build`.
- `next lint` was removed; `NextConfig` has **no `eslint` key**.
- `typedRoutes` is on: `href` values are checked at compile time. Use the
  object form `{ pathname, query }` for query strings; a non-literal string
  may need `as Route`.
- `revalidateTag(tag)` is deprecated; use `revalidateTag(tag, "max")`.
- `cacheComponents` is **off** (ADR-0002). Do not add `use cache`.
- `params` and `searchParams` are Promises. `await` them.
- `LayoutProps<"/">` and `PageProps<"/path">` are generated globals; run
  `next typegen` (the `typecheck` script does) before `tsc` on a fresh clone.

## Architecture

Three layers with one-way dependencies:

```
src/app/         routes — file conventions only, no business logic
   ↓
src/features/    vertical slices — schema, queries, actions, hooks, components
   ↓
src/lib/         infrastructure — api client, actions helper, query client,
                 observability, site config
src/components/  shared UI — vendored shadcn/ui under ui/, providers
```

`app` may import `features` and `components`; `features` may import `lib`
and `components`; `lib` imports nothing above it. Features never import
each other — shared code moves up.

Each feature under `src/features/<name>/` has a fixed layout:

| File          | Owns                                                                  | Runs on                 |
| ------------- | --------------------------------------------------------------------- | ----------------------- |
| `schema.ts`   | Zod contract with the API + inferred types                            | both                    |
| `queries.ts`  | Reads via `serverApi`; sets `revalidate` and cache tags               | server (`server-only`)  |
| `actions.ts`  | Writes as Server Actions via `runAction`                              | server (`"use server"`) |
| `hooks.ts`    | TanStack Query hooks via `getBrowserApi` for client-driven reads      | client                  |
| `components/` | Feature UI; Server Components unless interactivity requires otherwise | both                    |

`features/yachts` is the read reference; `features/inquiries` is the write
reference. Copy them.

## Rules

1. **Server Components by default.** `"use client"` goes on the smallest
   leaf that needs state, effects or event handlers — never a page.
2. **Never read `process.env` in `src/`.** Import `env` from `@/env`. ESLint
   blocks the alternative. A new variable goes in the schema _and_ in
   `.env.example`.
3. **Every API response has a Zod schema** in the feature's `schema.ts`,
   named after its counterpart in `friendship-yacht-api/src/modules/`. Fetch
   only through `@/lib/api/server` (server) or `@/lib/api/browser` (client);
   never bare `fetch` against the backend.
4. **Server Actions return `ActionResult`, never throw** (ADR-0006). Define
   them as one-line `"use server"` exports that call `runAction`. Forms use
   `useActionState` and branch on `status`.
5. **Errors go through `reportError`** from `@/lib/observability`. No
   `console.error` in boundaries or actions; that seam is where a vendor SDK
   will plug in.
6. **Catalogue reads degrade, transactional reads do not** (ADR-0007). Catch
   `ApiError | ApiNetworkError` only where a fallback is acceptable, and
   still report it.
7. **Cache tags live next to the queries that set them** and are the only
   thing `/api/revalidate` needs to know.
8. **Do not hand-edit `src/components/ui/`.** Vendored from the shadcn
   registry; `shadcn add` overwrites it. Compose around it. Only add a
   component when something uses it.
9. **Route files are thin.** `page.tsx` composes feature components and sets
   metadata. If a page grows logic, it belongs in a feature.
10. **Accessibility is a rule, not a review comment.** Real headings, labels
    bound to controls, `aria-invalid` on failing fields, and no colour as the
    only signal. `jsx-a11y` runs on every commit.

## UI conventions (shadcn/ui, Radix base)

The project-local skill in `.agents/skills/shadcn/` is authoritative; the
short version:

- Semantic tokens only (`bg-background`, `text-muted-foreground`). No raw
  colours, no `dark:` overrides.
- `gap-*` for spacing, never `space-y-*`. `size-*` when width = height.
- `asChild` for custom triggers (radix base). `<Button asChild><Link/></Button>`.
- Forms: `FieldGroup` + `Field` + `FieldLabel` + `FieldError`; `data-invalid`
  on `Field`, `aria-invalid` on the control.
- Empty and error states use `Empty`; loading uses `Skeleton`; pending
  buttons compose `Spinner` with `data-icon="inline-start"`.
- Toasts via `toast()` from `sonner`.
- `EmptyTitle` renders a `div`; nest an `<h1>` inside when the state is the
  page's main heading.

## Testing

| Layer | Tool         | Scope                                                                                 |
| ----- | ------------ | ------------------------------------------------------------------------------------- |
| Unit  | Vitest + RTL | Schemas, `lib/`, synchronous components, forms with a mocked action                   |
| E2E   | Playwright   | Async Server Components, navigation, headers, SEO routes, integration with a live API |

Vitest cannot render async Server Components; those are covered in `e2e/`.
`server-only` is aliased to a stub in Vitest so server modules are testable.
Tests that need the real API probe `localhost:8000/health` and skip when it
is down — they are integration tests, not a hard dependency.

Coverage floor is 60% across the board. Raise it when the real number has
been comfortably above it for a while; never lower it to make a change pass.

## Before you say you are done

```bash
pnpm validate          # typecheck + lint + format:check + unit tests
pnpm test:e2e          # for routing, headers, metadata or async data changes
```

For changes that cross into the API, start `friendship-yacht-api` and run
`pnpm test:e2e -g "live API"` so the integration cases execute instead of
skipping.

## Commits

Conventional Commits, enforced by commitlint. Scope by feature or concern:
`feat(yachts): add detail page`, `fix(inquiries): trim phone before
validation`. One logical change per commit.

## Reusing as a boilerplate

To start a new site from this repository:

1. Delete `src/features/yachts` and `src/features/inquiries`, and the routes
   `src/app/yachts`, `src/app/contact`. Reset `src/app/page.tsx` and
   `src/app/sitemap.ts`.
2. Rewrite `src/lib/site-config.ts` (name, description, URL, social handle)
   and `package.json` `name`.
3. Rewrite `.env.example` defaults. Keep the schema in `src/env.ts` — add to
   it, do not start over.
4. Keep `docs/adr/0001`–`0007`; they describe the structure, not the domain.
   Supersede any that no longer hold. Add `0008+` for your own decisions.
5. Keep `src/lib/`, `src/components/providers.tsx`, `src/test/`, `e2e/home.spec.ts`
   and every config file at the root.

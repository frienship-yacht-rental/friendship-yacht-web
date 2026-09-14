# Feature module template

Each feature owns a folder under `src/features/<feature>/` and follows the same
internal layout:

| File          | Responsibility                                                         |
| ------------- | ---------------------------------------------------------------------- |
| `schema.ts`   | Zod schemas + inferred types. The contract with the API.               |
| `queries.ts`  | Server-side reads via `serverApi`. `server-only`. Sets cache tags.     |
| `actions.ts`  | Server Actions for writes. Re-validate input; never trust the client.  |
| `hooks.ts`    | TanStack Query hooks for genuinely client-driven data.                 |
| `components/` | Feature UI. Server Components unless interactivity requires otherwise. |

Rules that keep this from rotting:

- Features never import from each other. Shared code moves to `src/components/`
  or `src/lib/`.
- `schema.ts` is the only place API shapes are described.
- Anything importing `server-only` must never be reachable from a
  `"use client"` module — the build will tell you.

@AGENTS.md

# Claude Code notes

`AGENTS.md` above is the engineering contract and applies in full. This file
adds what is specific to working here with Claude Code.

## Orientation

- The Next.js version here is newer than most training data. Before writing
  framework code, read the matching guide under
  `node_modules/next/dist/docs/01-app/` — it is the source of truth, not
  memory. `03-api-reference/05-config/01-next-config-js/` for config keys,
  `02-guides/` for patterns.
- Read `docs/adr/` before proposing a structural change. If the change
  contradicts an accepted ADR, write a superseding ADR in the same commit
  rather than editing the old one.
- The sibling repository `../friendship-yacht-api` is the data source. A
  change to any `schema.ts` here has a counterpart in
  `friendship-yacht-api/src/modules/<name>/schema.ts`; make both or say
  explicitly that the API side is left out.

## Skills

- `.agents/skills/shadcn/` is installed project-locally. Load its `SKILL.md`
  before adding, composing or reviewing UI, and run
  `pnpm dlx shadcn@latest info --json` for project context (`base: radix`,
  `rsc: true`, Tailwind v4, `lucide`). Run `shadcn docs <component>` and read
  the result before using a component for the first time — the registry API
  moves faster than any model's memory.
- Add a shadcn component only when a feature uses it. The pruned set is
  deliberate.

## Verification

Run the full gate, not a subset, before reporting completion:

```bash
pnpm validate
```

Then, depending on what changed:

| Changed                                      | Also run                                          |
| -------------------------------------------- | ------------------------------------------------- |
| Anything under `src/app/`, headers, metadata | `pnpm test:e2e --project=chromium`                |
| A feature that talks to the API              | start the API, then `pnpm test:e2e -g "live API"` |
| `next.config.ts`                             | `pnpm build` and read the route table             |

Report what was run and what the output was. If a check was skipped, say so.
A green unit suite is not evidence that an async Server Component works.

## Conventions the hooks enforce

- Commits are Conventional Commits; commitlint rejects anything else.
- `git push --no-verify` bypasses typecheck and tests. Do not use it without
  the user asking for it by name.
- `prettier --write` runs on staged files at commit; do not hand-format.
- `.github/`, `.vscode/` and `.agents/` are gitignored by the owner's
  choice. Do not add them back.

## When adding a dependency

- Client bundle cost matters: check that a runtime dependency is tree-shaken
  or add it to `optimizePackageImports` in `next.config.ts`.
- Prefer a dependency the API repo already uses when both need the same
  thing (zod, vitest, prettier, eslint-config-prettier), and keep the major
  version aligned.
- Anything imported by a `"use client"` module ships to the browser. Keep
  `server-only` on modules that must never.

## Review checklist

Before opening or approving a change, confirm:

- [ ] No `"use client"` above the smallest interactive leaf
- [ ] New env vars are in `src/env.ts` **and** `.env.example`
- [ ] New API reads have a Zod schema and go through `serverApi` / `getBrowserApi`
- [ ] New Server Actions use `runAction` and return `ActionResult`
- [ ] Error paths call `reportError`, not `console.error`
- [ ] Forms follow the shadcn rules (`Field`, `data-invalid`, `aria-invalid`)
- [ ] New routes appear in `sitemap.ts` if public
- [ ] A Vitest spec covers logic; a Playwright spec covers anything async
- [ ] Coverage did not drop below the floor

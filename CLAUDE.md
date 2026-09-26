# CLAUDE.md — working in Strata

Read `BRIEF.md` end to end before changing anything. It is the spec. Anuj owns design decisions; you pair on engineering and push back when he's wrong.

## Current phase

**v0.2** — Phases 1–2 done plus the docs site and registry (shadcn-level). Next: Phase 4 (governance) and Phase 5 (MCP, audit, agent eval). Stop after each phase for Anuj's review. Component rules: `packages/react/CONVENTIONS.md`.

## Commands

```sh
pnpm i                 # install (Node 22, pnpm 10)
pnpm dev               # Brand Generator on :5173
pnpm typecheck         # tsc across the workspace
pnpm test              # Vitest
pnpm test:themes       # fuzz the contrast solver; writes packages/theme-engine/reports
pnpm tokens            # build tenant tokens into packages/tokens
pnpm build             # build everything
pnpm screenshots       # Playwright: tenant × scheme + axe → docs/screenshots/phase-1
                       # offline/CI: STRATA_LOCAL_FONTS=<node_modules with @fontsource/*> serves fonts locally
```

## Conventions

- **Tokens only.** Style with `var(--strata-*)` — semantic or component tokens, never primitives (ADR-005). Contract: `packages/theme-engine/src/types.ts`.
- **Logical properties only**: `margin-inline-start`, `inset-inline-end`, `text-align: start` (ADR-009).
- **No invented metrics.** Every number shown anywhere comes from a script; write the command next to it.
- **Design trade-off → stop and ask Anuj** with 2–3 options and a recommendation. His answer becomes an ADR (`docs/adr/000-template.md`) that records who decided.
- **Update `docs/log.md` every session**: Changed / Decided / Next, with who decided each item.
- **After UI work**, run `pnpm screenshots` (every tenant × scheme) and show the results before moving on.
- TypeScript strict; no `any` in public APIs. Change `types.ts` deliberately — it is the API.
- Conventional commits. Add a changeset for any change to a published package.

## Who owns what

| Path | Owns |
|---|---|
| `packages/theme-engine/` | colour maths, ramps, semantic roles, contrast solver, exporters (`src/export/*`) |
| `packages/tokens/` | build script: runs the engine's exporters over `tenants/*/brand.json` |
| `apps/generator/` | Brand Generator UI + preview screen (`src/preview/`) |
| `tenants/<name>/` | `brand.json` (= `BrandInput`) + `content.json` (= `TenantContent`) |
| `docs/adr/`, `docs/log.md` | decisions and the session log |
| `scripts/`, `.github/workflows/` | screenshots, CI |

Phase 2+ adds `packages/react`, `packages/meta`, `apps/storybook`, `apps/reference`, `packages/mcp`, `packages/audit` — see BRIEF §4.

## Don't

- No raw colours (hex, rgb, hsl, oklch) in component or app CSS. Exception: token *definition* files (e.g. the generator's `chrome.css`, which defines the tool's own monochrome UI tokens).
- No tenant ids (`vela`, `harbor`, `qamar`) in component code. Tenants differ by tokens + copy only.
- No new dependencies without saying why (in the log or PR). `theme-engine` stays zero runtime dependencies.
- Don't rebuild accessibility primitives in `packages/react` — use React Aria Components (ADR-002). (The Phase 1 generator app predates it and hand-rolls its tabs.)
- Don't hand-edit generated files (`packages/tokens` output, Figma JSON, reports).
- Don't round contrast ratios up. 4.49 fails.
- Don't start the next phase without Anuj's review.

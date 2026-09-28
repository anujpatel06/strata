# CLAUDE.md — Strata

Strata is a multi-brand design system. It has 53 React Aria components, its own icon set (`@strata/icons`) and a Next.js docs site, all themed by an engine that turns six brand inputs into a light and dark theme passing WCAG 2.2 AA. It's Anuj Patel's portfolio project for Lead/Staff Product Designer and UX Design Engineer interviews, so **craft, accessibility and honest claims matter more than speed**.

- Spec: `BRIEF.md`. Read the relevant section before planning any phase.
- Component rules: `packages/react/CONVENTIONS.md`. Read it before touching `packages/react` or `apps/docs/examples`.
- How the system changes: `GOVERNANCE.md`. Read §5 before changing or removing anything on a beta or stable component.
- History: `docs/log.md` has what changed, who decided, and what's next. Decisions are in `docs/adr/`, proposals in `docs/rfcs/`.

Anuj owns design decisions. You pair on engineering and push back when he's wrong.

## Status

- **Done:** Phase 0–5, and Phase 5a built (waiting for Anuj's review).
  - The theme engine and contrast solver, 53 components, 7 blocks, `@strata/icons`, the docs site (Home, Docs, Components, Blocks, Themes, Colors, Icons, ⌘K) and the npm build. No shadcn anywhere users look (ADR-011 revision).
  - Governance (Phase 4): `GOVERNANCE.md`, RFCs in `docs/rfcs/`, deprecation records in `meta.json`, `packages/codemods`. First deprecation: `Button variant="danger"` → `tone="danger"` (RFC-001, ADR-021).
  - Agents (Phase 5): `packages/audit` (`pnpm drift`), `packages/mcp`, `AGENTS.md`, `evals/` (results in `evals/results.md`; iteration 1 is invalid and kept on record).
  - Mobile reach (Phase 5a): `packages/sdui`, native token files from `pnpm tokens`, tenant Haat (hi-IN). No native components.
- **Next:** Phase 6, publish (BRIEF §13).
- **Waiting on Anuj:** deploy the docs to Vercel; review Haat's Hindi copy; ADR-024, 025 and 026; the clipping found in the Arabic and Latin type pairs.
- **Known gaps:** listed at the end of the latest entry in `docs/log.md`.

## Run it

Node ≥ 22, pnpm 10 (`corepack enable`).

```sh
pnpm install
pnpm docs                  # docs site → http://localhost:3000 (use localhost, not 127.0.0.1: Next 16 dev blocks hydration there)
pnpm dev                   # Phase 1 Brand Generator (Vite) → :5173
pnpm --filter @strata/playground dev   # component playground: /?c=button&tenant=qamar&scheme=dark&dir=rtl
pnpm typecheck && pnpm test            # all packages
pnpm test:themes           # contrast fuzz, 1,000 brands → packages/theme-engine/reports
pnpm check:meta            # every component's meta.json vs its files
pnpm registry              # internal only: registry JSON → packages/react/registry (not published; ADR-011 revision)
pnpm tokens                # tenant token files → packages/tokens/dist
pnpm --filter @strata/react build      # npm build → packages/react/dist
```

Use `/verify` before saying work is done, and `/screenshots` after any UI change.

## Repo map

| Path | What |
|---|---|
| `packages/theme-engine` | OKLCH ramps, 48 semantic roles, contrast solver, exporters (CSS, DTCG 2025.10, Figma, shadcn). Zero runtime deps. |
| `packages/react` | Components: `src/ui/<name>.tsx` + `.module.css` (flat; sibling imports only), `meta/<name>.meta.json`, `test/`. `src/index.ts` is generated (`pnpm --filter @strata/react gen:index`). |
| `packages/tokens` | Builds token files for every `tenants/*/brand.json`. |
| `packages/audit` | Drift auditor: ten rules, a fix on every finding, `--fix` for the safe ones. `pnpm drift <path>`. |
| `packages/mcp` | Read-only MCP server over stdio. Reads `meta.json`, tenants, blocks and examples at request time. |
| `packages/sdui` | Server-driven UI: schemas generated from `meta.json` (`pnpm --filter @strata/sdui generate`), validator, web renderer. The schema has its own version. |
| `evals/` | Agent eval: prompts, harness, runs and results. `run.mjs` calls a paid model once per run. |
| `packages/codemods` | One jscodeshift transform per breaking change, with fixture tests. `npx @strata/codemods <transform> <path>`. |
| `packages/icons` | `@strata/icons`: our own icon set (ADR-014). Style spec in `src/create-icon.tsx`; `pnpm --filter @strata/icons sheet` renders the review sheet. |
| `apps/docs` | Next.js 16 site. Examples in `examples/<component>/`; blocks in `blocks/<name>/`; pages in `app/`; MDX in `content/docs/`. |
| `apps/generator` | Phase 1 Brand Generator (Vite; single-file build for hosted demos). |
| `apps/playground` | Renders `apps/docs/examples/<c>/*` per tenant, scheme, dir and density for visual QA. |
| `tenants/<id>` | `brand.json` (6 inputs) + `content.json` (copy). Vela (en-IN), Harbor (en-GB), Qamar (ar-AE, RTL), Care (en-IN, editorial, ADR-015), Haat (hi-IN, Devanagari, ADR-024), house (the site, Geist). |
| `scripts/` | `screenshots.mjs`, `shoot.mjs` (one URL → PNG), `axe-sweep.mjs` (every docs route, light + dark), `check-override-weight.mjs`, `check-script-clipping.mjs` (glyph clipping per type pair). |

## Conventions (non-negotiable)

- **Tokens only:** `var(--strata-*)` semantic roles. No raw colours, sizes, radii or weights in component or page CSS. No tenant ids in component code. A brand is data, not code.
- **Logical properties only.** RTL must work. For right-to-left regions, pass `locale` to `ThemeScope` (React Aria reads direction from the locale, not from `dir`).
- **React Aria for behaviour:** never hand-roll focus, overlays, collections or keyboard handling.
- **Overlays portal to `<body>`** and copy `data-strata-*`, `dir` and `lang` from the nearest scope when they open (ADR-012). Keep that helper in every overlay file, because registry installs need self-contained files.
- **Accessibility:** WCAG 2.2 AA. Visible focus, targets ≥ 24px, status never shown by colour alone. Contrast ratios are never rounded up; 4.49 fails.
- **No invented metrics.** Every number comes from a script, with the command next to it.
- **Design trade-off:** stop and ask Anuj with 2–3 options and a recommendation. The answer becomes an ADR that records who decided (`Anuj` / `Claude recommended, Anuj accepted` / `Claude recommended, pending Anuj`).
- **Update `docs/log.md` every session** (Changed / Decided / Results / Next).
- **Stop after each phase** for Anuj's review.
- **Commits:** conventional commits. Add a changeset for changes to published packages.

## Working with subagents

The v0.2 build ran as parallel subagents, each owning an explicit set of files (see `.claude/agents/`):
- `component-builder` for groups of components
- `docs-builder` for site pages
- `a11y-reviewer` for sweeps and review

When parallelising, give each agent exact file ownership and these rules: no dependency installs, no commits, their own dev-server port, their own Next output folder (`NEXT_DIST_DIR=.next-<agent>`). The lead integrates, runs `/verify` and commits.

## Gotchas

- **Next 16:**
  - Turbopack is the default. Keep MDX plugin lists empty.
  - `next dev` rewrites `apps/docs/AGENTS.md`/`CLAUDE.md` (committed on purpose) and `next-env.d.ts` (restore it if a custom `NEXT_DIST_DIR` build changes it).
- **Docs CSS:** `apps/docs/package.json` has a `browserslist`, so Lightning CSS doesn't polyfill `:dir()` or `light-dark()` (the polyfills broke RTL and backdrops).
- **Docs CSS that restyles a Strata component doubles the class** (`.promo.promo`). A single class weighs the same as the component's own rule, so stylesheet order decides which wins, and that order changes when the import graph does. `node scripts/check-override-weight.mjs` checks it; `--fix` doubles them.
- **Docs examples use fixed dates** (`parseDate('2026-10-05')`), so statically built pages hydrate the same on any day.
- **Stopping servers:** `pgrep -f "next start"` also matches your own shell command. Kill by the PID you started instead.
- **Offline sandboxes** can't reach Google Fonts. Screenshot scripts accept `STRATA_LOCAL_FONTS=<node_modules with @fontsource/*>`. You don't need this on a normal Mac.

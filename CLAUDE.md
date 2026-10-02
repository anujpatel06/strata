# CLAUDE.md — Syntara

Syntara is a multi-brand design system. It has 54 React Aria components, its own icon set (`@syntara/icons`) and a Next.js docs site, all themed by an engine that turns six brand inputs into a light and dark theme passing WCAG 2.2 AA. It is maintained to a standard where **craft, accessibility and honest claims matter more than speed**.

- Spec: `BRIEF.md`. Read the relevant section before planning any phase.
- Component rules: `packages/react/CONVENTIONS.md`. Read it before touching `packages/react` or `apps/docs/examples`.
- How the system changes: `GOVERNANCE.md`. Read §5 before changing or removing anything on a beta or stable component.
- History: `docs/log.md` has what changed, who decided, and what's next. Decisions are in `docs/adr/`, proposals in `docs/rfcs/`.

Anuj owns design decisions. You pair on engineering and push back when he's wrong.

## Status

- **Done:** Phase 0–5, and Phase 5a built (waiting for Anuj's review).
  - The theme engine and contrast solver, 54 components, 7 blocks, `@syntara/icons`, the docs site (Home, Docs, Components, Blocks, Themes, Colors, Icons, ⌘K) and the npm build. No shadcn anywhere users look (ADR-011 revision).
  - Governance (Phase 4): `GOVERNANCE.md`, RFCs in `docs/rfcs/`, deprecation records in `meta.json`, `packages/codemods`. First deprecation: `Button variant="danger"` → `tone="danger"` (RFC-001, ADR-021).
  - Agents (Phase 5): `packages/audit` (`pnpm drift`), `packages/mcp`, `AGENTS.md`, `evals/` (results in `evals/results.md`; iteration 1 is invalid and kept on record).
  - Mobile reach (Phase 5a): `packages/sdui`, native token files from `pnpm tokens`, tenant Haat (hi-IN). No native components.
- **Next:** Phase 7 — nothing is scheduled. Phase 6 is **done** (BRIEF §13): eight packages on npm, docs live on
  **Cloudflare Pages** (https://syntara.pages.dev; previews per branch, configured in the Cloudflare dashboard,
  not in this repo), the differentiation research re-run (`docs/research/2026-10-01-differentiation.md`), the
  README GIF and `/story`. Versions: `@syntara/react`, `@syntara/sdui` and `@syntara/mcp` at **0.1.1**, the other
  five at 0.1.0. Release with `pnpm changeset publish` from `main`; publish with pnpm, never npm, or
  `workspace:*` ships literally, and `+ pkg@version` means npm staged it — check `npm view` before believing it.
- **The repo is public** (ADR-037). Done: the pre-publication audit, the scrub of job-search framing, the
  Syntara screenshots, and `private: false` — which also unblocked branch protection and GitHub auto-merge, both
  now on for `main` with the two CI jobs required. **ADR-037 asked for a cold clone on a machine without this
  pnpm store before flipping, and that was not run**: the visibility change was made on Anuj's instruction after
  a secret scan of all 101 commits (no credentials, no personal data beyond the committed author address). The
  cold clone is still worth doing, now as a check rather than a gate. Left: the 21st.dev listing, where it is
  still unknown whether a pnpm monorepo is accepted.
- **Waiting on Anuj:** review Haat's Hindi copy; the clipping found in the Arabic and Latin type pairs; and seven ADR questions — **020** (Haat's name, industry and brand inputs), **024** (the whole ADR is Proposed), **025** (the API shape of the generated native files), **026** (accepted for the docs site, review pending), **032** (whether a Hindi reader agrees that रय reads as initials), **034** and **035** (accepted by Claude, review pending).
- **Known gaps:** listed at the end of the latest entry in `docs/log.md`.
- **ADRs run to 037.** Check `ls docs/adr/` for the next free number rather than trusting this line; it has been stale before.

## Run it

Node ≥ 22, pnpm 10 (`corepack enable`).

```sh
pnpm install
pnpm docs                  # docs site → http://localhost:3000 (use localhost, not 127.0.0.1: Next 16 dev blocks hydration there)
pnpm dev                   # Phase 1 Brand Generator (Vite) → :5173
pnpm --filter @syntara/playground dev   # component playground: /?c=button&tenant=qamar&scheme=dark&dir=rtl
pnpm typecheck && pnpm test            # all packages
pnpm test:themes           # contrast fuzz, 1,000 brands → packages/theme-engine/reports
pnpm check:meta            # every component's meta.json vs its files
pnpm registry              # internal only: registry JSON → packages/react/registry (not published; ADR-011 revision)
pnpm tokens                # tenant token files → packages/tokens/dist
pnpm --filter @syntara/react build      # npm build → packages/react/dist
```

Use `/verify` before saying work is done, and `/screenshots` after any UI change.

## Repo map

| Path | What |
|---|---|
| `packages/theme-engine` | OKLCH ramps, 48 semantic roles, contrast solver, exporters (CSS, DTCG 2025.10, Figma, shadcn). Zero runtime deps. |
| `packages/react` | Components: `src/ui/<name>.tsx` + `.module.css` (flat; sibling imports only), `meta/<name>.meta.json`, `test/`. `src/index.ts` is generated (`pnpm --filter @syntara/react gen:index`). |
| `packages/tokens` | Builds token files for every `tenants/*/brand.json`. |
| `packages/audit` | Drift auditor: eleven rules, a fix on every finding, `--fix` for the safe ones. `pnpm drift <path>`. |
| `packages/mcp` | Read-only MCP server over stdio. Reads `meta.json`, tenants, blocks and examples at request time. |
| `packages/sdui` | Server-driven UI: schemas generated from `meta.json` (`pnpm --filter @syntara/sdui generate`), validator, web renderer. The schema has its own version. |
| `evals/` | Agent eval: prompts, harness, runs and results. `run.mjs` calls a paid model once per run. |
| `packages/codemods` | One jscodeshift transform per breaking change, with fixture tests. `npx @syntara/codemods <transform> <path>`. |
| `packages/icons` | `@syntara/icons`: our own icon set (ADR-014). Style spec in `src/create-icon.tsx`; `pnpm --filter @syntara/icons sheet` renders the review sheet. |
| `apps/docs` | Next.js 16 site. Examples in `examples/<component>/`; blocks in `blocks/<name>/`; pages in `app/`; MDX in `content/docs/`. |
| `apps/generator` | Phase 1 Brand Generator (Vite; single-file build for hosted demos). |
| `apps/playground` | Renders `apps/docs/examples/<c>/*` per tenant, scheme, dir and density for visual QA. |
| `tenants/<id>` | `brand.json` (6 inputs) + `content.json` (copy). Vela (en-IN), Harbor (en-GB), Qamar (ar-AE, RTL), Care (en-IN, editorial, ADR-015), Haat (hi-IN, Devanagari, ADR-024), house (the site, Geist). |
| `scripts/` | `screenshots.mjs`, `shoot.mjs` (one URL → PNG), `axe-sweep.mjs` (every docs route, light + dark), `check-override-weight.mjs`, `check-script-clipping.mjs` (glyph clipping per type pair). |

## Conventions (non-negotiable)

- **Tokens only:** `var(--syntara-*)` semantic roles. No raw colours, sizes, radii or weights in component or page CSS. No tenant ids in component code. A brand is data, not code.
- **Logical properties only.** RTL must work. For right-to-left regions, pass `locale` to `ThemeScope` (React Aria reads direction from the locale, not from `dir`).
- **React Aria for behaviour:** never hand-roll focus, overlays, collections or keyboard handling.
- **Overlays portal to `<body>`** and copy `data-syntara-*`, `dir` and `lang` from the nearest scope when they open (ADR-012). Keep that helper in every overlay file, because registry installs need self-contained files.
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
- **Docs CSS that restyles a Syntara component doubles the class** (`.promo.promo`). A single class weighs the same as the component's own rule, so stylesheet order decides which wins, and that order changes when the import graph does. `node scripts/check-override-weight.mjs` checks it; `--fix` doubles them.
- **Docs examples use fixed dates** (`parseDate('2026-10-05')`), so statically built pages hydrate the same on any day.
- **`serve` may not take the port you asked for.** `serve out -l 3000` falls back to a random port when 3000 is taken, prints the one it actually took, and exits 0. So a `200` from `curl` proves something is answering, not that it is yours — and with several agents on one machine, "something" is usually another session's build. The six `/verify` step 9 scripts compare the served build against `apps/docs/.next/BUILD_ID` first and stop on a mismatch: believe that error rather than working around it, and confirm the port with `lsof -nP -iTCP:<port> -sTCP:LISTEN`. `shoot.mjs`, `screenshots.mjs` and `check-script-clipping.mjs` take whatever URL you give them and check nothing, so a screenshot of the wrong build looks exactly like a screenshot of yours.
- **A matching build id proves whose build you measured, not that your change is in it.** Edit a file, forget to rebuild, and the id still matches while the numbers mean nothing. When a run is meant to prove a change works, prove the change shipped: `grep -rl '<something from your diff>' apps/docs/out/_next/static`.
- **Stopping servers:** `pgrep -f "next start"` also matches your own shell command. Kill by the PID you started instead.
- **Offline sandboxes** can't reach Google Fonts. Screenshot scripts accept `SYNTARA_LOCAL_FONTS=<node_modules with @fontsource/*>`. You don't need this on a normal Mac.

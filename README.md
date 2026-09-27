# Strata

A multi-brand design system that humans and AI agents build with.

53 React Aria components, its own icon set and a docs site with live previews, all themed by an engine that turns six brand inputs into a light and dark theme passing WCAG 2.2 AA.

![Strata docs home](docs/screenshots/v0.2/home.png)

| Vela · neobank | Harbor · insurer | Qamar · grocery, Arabic RTL |
|---|---|---|
| ![Vela, light](docs/screenshots/phase-1/vela-light.png) | ![Harbor, light](docs/screenshots/phase-1/harbor-light.png) | ![Qamar, light](docs/screenshots/phase-1/qamar-light.png) |

Same components, same code. A tenant differs by tokens + copy only. Screenshots: `pnpm screenshots`.

## What works today

- **53 components** (`@strata/react`) on React Aria: fields, pickers, overlays, feedback, navigation and a DataTable. Every one works in light and dark, both densities, and RTL, and each has a `meta.json` that drives its docs page.
- **Docs site** (`apps/docs`, Next.js): component pages with live previews per tenant, scheme, direction and density; Blocks; Themes; Colors; ⌘K search. The site is themed by Strata itself.
- **Distribution** (ADR-011): install `@strata/react` and `@strata/tokens` from npm (published in Phase 6), or copy a component's source files into your project.
- **7 blocks**: dashboard, request flow, settings, sign-in, activity table, benefits overview and portfolio. Each runs in every tenant.
- **Governance** (`GOVERNANCE.md`): an RFC flow, a deprecation policy, and one deprecation carried out end to end. Button's `variant="danger"` became `tone="danger"`, with a codemod in `@strata/codemods`.
- **`@strata/icons`**: Strata's own icon set (ADR-014).

Phase 1:

- **Brand Generator** — 6 inputs (primary, accent, neutral temperature, shape, type pair, density) → full theme, live preview, export. Runs in the browser.
- **OKLCH theme engine + contrast solver** — 12-step ramps, brand hex kept exact, every failing pair fixed and explained in plain English. Zero runtime dependencies.
- **Five tenants** — Vela, Harbor, Qamar (Arabic, right to left), Care and the house theme the site uses. A tenant is one `brand.json` + one `content.json`.
- **Exports** — CSS variables, DTCG 2025.10 JSON, Figma-variables JSON (Brand / Scheme / Density collections).

## Numbers

Every number comes from a script. Run the command to reproduce it.

<!-- numbers:start -->
| Metric | Value | Reproduce |
|---|---|---|
| Themes fuzzed (random brands × light/dark) | 1,000 | `pnpm test:themes` |
| Contrast checks passed | 118,000 / 118,000 (100%), 118 per brand | `pnpm test:themes` |
| Chart palettes passed | 2,000 / 2,000 | `pnpm test:themes` |
| Solver adjustments per brand | median 4, max 7 | `pnpm test:themes` |
| Components / blocks | 53 / 7 | `pnpm check:meta`; blocks listed in `apps/docs/blocks/blocks.json` |
| Component maturity | 18 alpha · 35 beta · 0 stable | `pnpm check:meta` |
| Tests passing | 435 components · 219 engine · 245 icons · 8 codemods | `pnpm test` |
| Docs routes swept with axe (light + dark) | 105 × 2, 0 violations | `node scripts/axe-sweep.mjs` (with the built docs site running) |
| Tenants rendering from one codebase | 5 (one Arabic RTL), including the house theme | `pnpm tokens` |
| Deprecations shipped with a codemod | 1 | `GOVERNANCE.md` §5; `pnpm --filter @strata/codemods test` |

Measured 2026-09-27. Known failures on that date, both older than the governance work: the production docs build logs a hydration error on 20 component pages, and `pnpm registry` (internal only) fails on 7 blocks.
<!-- numbers:end -->

## Quick start

Node 22 and pnpm 10 (`corepack enable`).

```sh
pnpm i
pnpm docs           # docs site → http://localhost:3000 (components, blocks, themes)
pnpm dev            # Brand Generator → http://localhost:5173
pnpm test           # unit tests
pnpm test:themes    # fuzz random brand colours × light/dark, write a pass-rate report
pnpm tokens         # build every tenant's tokens into packages/tokens
pnpm screenshots    # Playwright: every tenant × scheme + axe report
```

## Repo map

```
packages/theme-engine/   brand inputs → theme: OKLCH ramps, contrast solver, exporters
packages/react/          components on React Aria, one meta.json each
packages/icons/          Strata's own icon set
packages/tokens/         built tokens for every tenant: CSS, DTCG, Figma
packages/codemods/       one codemod per breaking change
apps/docs/               docs site (Next.js): components, blocks, themes, governance
apps/generator/          Brand Generator (Vite + React)
apps/playground/         every example per tenant, scheme, direction and density
tenants/<name>/          brand.json + content.json — a brand is data, not code
docs/adr/                decisions, each with who made the call
docs/rfcs/               proposals, written before the change is built
docs/log.md              session log: changed / decided / next
GOVERNANCE.md            who decides, how a change gets in, deprecation policy
```

Coming: `packages/mcp`, `packages/audit`, `AGENTS.md`, `evals/` (Phase 5) · server-driven UI schema, native tokens, Hindi tenant (Phase 5a) · npm release and `/story` (Phase 6).

## Roadmap

- [x] **0 · Plan** — scaffold, ADR drafts
- [x] **1 · Tokens + engine + generator v0** — tiers, tenants, contrast solver + fuzz
- [x] **2 · Components** — components on React Aria, meta, accessibility, RTL, density
- [x] **3 · Docs site and blocks** — the docs site and its blocks stand in for the reference product and Storybook the brief planned
- [ ] **4 · Governance** — GOVERNANCE, RFC flow, Changesets, one real deprecation + codemod *(built, waiting for Anuj's review)*
- [ ] **5 · MCP + audit + eval** — MCP server, drift auditor, CI gate, per-model agent eval
- [ ] **5a · Mobile reach** — server-driven UI schema, native token export, Hindi tenant
- [ ] **6 · Publish** — npm, docs site, `/story` page

## Principles

1. **Tokens are the API.** Components use semantic/component tokens, never primitives.
2. **A brand is data, not code.** New tenant = one JSON file. Zero component changes.
3. **Accessible by construction.** A theme that fails WCAG 2.2 AA can't be generated or exported.
4. **Logical properties only.** RTL is free, not a retrofit.
5. **Design ↔ code parity.** Every Figma property maps 1:1 to a React prop.
6. **One source of truth for humans and agents.** Docs, MCP and Figma read one `meta.json`.
7. **Make the right thing the easy thing.** Every finding suggests the exact fix.

## Built by

Designed by **Anuj Patel**. Engineering paired with Claude (AI); every decision is recorded in [`docs/adr`](docs/adr) with who made it.

## License

[MIT](LICENSE)

# Strata — Build Brief

> **How to use:** create an empty repo, save this file as `BRIEF.md`, open Claude Code and say:
> *"Read BRIEF.md end to end. Do Phase 0 only, then stop for my review."*
> "Strata", the tenant names and the package scope are working names — rename freely.

---

## 0. Who you're pairing with

I'm Anuj Patel — Senior Product Designer, 7 years, founding designer at a white-label B2B2C platform (one product, many client brands). I'm moving into **Lead / Staff Product Designer** and **UX Design Engineer** roles at large product companies. This repo is a portfolio project that must survive a lead-level design-systems interview, where people will open the code, the Figma file and the docs.

I own design decisions. You pair with me on engineering and push back when I'm wrong. Optimise for: **visual craft, correctness, honest claims, and a small finished scope over a big half-done one.**

---

## 1. What we're building

**Strata — a multi-brand design system that humans and AI agents build with.**

1. **Brand Generator** — produces a complete, accessible theme for a new brand from ≤6 inputs.
2. **One React library** — renders every brand from one codebase, in light/dark, comfortable/compact, LTR/RTL.
3. **MCP server** — AI coding agents read components, tokens and usage rules from the same source humans do.
4. **Drift auditor** — scores any codebase for on-system usage and suggests the fix.

**Proof:** three fictional tenants in three industries run the *same* reference product. A tenant differs by **tokens + copy only** — never by forked components. That rule is the whole point.

| Tenant | Industry | Personality | Locale |
|---|---|---|---|
| **Vela** | Neobank | Sharp, cool, precise | English |
| **Harbor** | Insurer | Soft, warm, calm | English |
| **Qamar** | Grocery & loyalty | Round, vivid, playful | Arabic (RTL) |

### Reference product — one flow, three tenants

- **Overview** — KPI stat tiles with deltas, alert banner, activity DataTable (50 rows, sort, select, density toggle), empty / loading / error states.
- **Request flow** — 3 steps: details → upload → review & submit. Inline validation, error summary, success state.
  Vela = dispute a transaction · Harbor = file a claim · Qamar = return an order. Same components and pattern, different content.
- **Settings** — preferences, switches, selects, a danger-zone confirmation dialog.

Content comes from `tenants/<name>/content.json`. Realistic copy and data — no lorem ipsum.

---

## 2. Non-goals

- Not a 60-component library. ~20 components, done properly.
- No backend, auth or real data. Mock JSON only.
- Don't rebuild accessibility primitives (focus traps, roving tabindex, etc.) — use a headless library; decide which in ADR-002.
- No native iOS or Android components. The mobile story is a server-driven UI schema plus native token files (§10a, ADR-019).
- No healthcare framing. This must read as domain-agnostic.
- **No invented metrics.** Every number shown anywhere must be reproducible from a script in this repo, with the command written next to it.

---

## 3. Principles — cite them in ADRs

1. **Tokens are the API.** Components reference semantic/component tokens only, never primitives.
2. **A brand is data, not code.** New tenant = one JSON file. Zero component changes.
3. **Accessible by construction.** A theme that fails WCAG 2.2 AA cannot be generated or exported.
4. **Logical properties only** (`margin-inline-start`, not `margin-left`). RTL is free, not a retrofit.
5. **Design ↔ code parity.** Every Figma component property maps 1:1 to a React prop. The parity table is generated.
6. **One source of truth for humans and agents.** Docs, MCP responses and Figma descriptions all come from one `meta.json` per component.
7. **Make the right thing the easy thing.** Every lint/audit finding suggests the exact token or component to use.

---

## 4. Architecture

pnpm workspaces monorepo:

```
strata/
  packages/
    tokens/        DTCG 2025.10 JSON → CSS vars, TS types, Figma-variables JSON
    theme-engine/  brand inputs → full semantic token set (OKLCH) + contrast solver
    react/         components (React + TS strict, headless primitives)
    meta/          <component>.meta.json — props schema, variants, states, do/don't, a11y notes, examples
    mcp/           MCP server (TypeScript, official @modelcontextprotocol/sdk)
    audit/         drift auditor CLI + HTML report
    codemods/      jscodeshift codemods for breaking changes
  apps/
    docs/          docs site + Brand Generator + /story case-study page
    reference/     the reference product, switchable by tenant
    storybook/     toolbars: tenant / scheme / density / direction; a11y addon
  tenants/         vela/ harbor/ qamar/  (brand.json + content.json)
  evals/           agent eval prompts, runner, results
  docs/adr/        ADR-001 … ADR-00n
  docs/log.md      one line per session: changed / decided / next
  .changeset/
  AGENTS.md  CONTRIBUTING.md  GOVERNANCE.md  README.md
```

### Token tiers

1. **Primitive** — 12-step OKLCH colour ramps, 4pt space scale, radius, type scale, motion, elevation.
2. **Semantic** — `color.surface.*`, `color.text.*`, `color.border.*`, `color.action.primary.{bg,fg,hover,pressed}`, `color.focus.ring`, `color.feedback.{success,warning,danger,info}.{bg,fg,border}`, `space.{inset,stack,inline}.*`, `radius.{control,container}`, `font.{body,heading,mono}`.
3. **Component** — only where a semantic token can't express it: `button.*`, `input.*`, `table.row.height.{comfortable,compact}`.

**Modes:** brand × scheme (light/dark) × density (comfortable/compact). Direction is handled by logical CSS, not tokens.

**Format:** W3C DTCG Format Module 2025.10 — `$value`, `$type`, `$description`, `{alias}` references, Strata metadata under `$extensions` (e.g. `com.strata.deprecated`, `com.strata.since`). Build tool (Style Dictionary v4+ vs Terrazzo) decided in ADR-001.

---

## 5. Theme engine + Brand Generator — the hero

**Inputs (≤6):** primary colour · optional accent · neutral temperature (cool / neutral / warm) · shape (sharp 2px / soft 8px / round 16px) · type pair (curated list of ~6 Google Fonts pairs, at least one with Arabic support, e.g. IBM Plex Sans Arabic or Noto Sans Arabic) · default density.

**Algorithm**

1. Generate 12-step ramps in OKLCH for primary, accent and neutral — hold hue, vary L and C.
2. Map ramp steps to semantic roles for light and dark.
3. **Contrast solver:** check every pair listed in `contrast-pairs.json` — text on each surface (4.5:1), large text (3:1), fg on action bg (4.5:1), focus ring and input borders against adjacent surfaces (3:1 non-text). If a pair fails, move along the ramp until it passes.
4. **Explain every adjustment in plain English**, e.g. *"#FFD400 is too light for white labels → button text switched to ink; hover darkened to L 0.62."*
5. Export DTCG JSON, CSS variables, Figma-variables JSON and a contrast report.
6. **Brand fidelity (ADR-018):** for each brand input, report the colour distance between what the brand asked for and what the solver shipped, per scheme. It appears in the contrast report, and as a distribution in the fuzz report.

**UI:** inputs on the left; live preview of all three reference screens on the right (tabs); contrast report with every adjustment; export buttons; generation time in ms. Fully client-side. Paste any hex → everything re-skins in under a second.

**Acceptance**

- `pnpm test:themes` — fuzz 1,000 random primary colours × light/dark. Report the pass rate honestly; if it's below 100%, document the failing cases and why.
- Adding a 4th tenant from zero to a rendered reference app needs only `tenants/<name>/brand.json` + `content.json`. Prove it with a test.

---

## 6. Components (~20)

- **Foundations:** Text, Heading, Icon (Tabler or Lucide — pick one), Stack, Inline
- **Actions:** Button (primary / secondary / ghost / critical; sm / md / lg; loading; icon slots), IconButton, Link
- **Inputs:** TextField (label, hint, error, prefix/suffix), Select, Checkbox, RadioGroup, Switch, FileUpload (drag-drop, progress, error)
- **Feedback:** Alert, Toast, Badge, Skeleton, EmptyState, Steps
- **Containers:** Card, Dialog, Tabs, Tooltip
- **Data:** DataTable (sort, selection, density, sticky header, empty/loading/error, RTL), StatTile (value + delta)

**Every component must have:** all relevant states (default, hover, focus-visible, active, disabled, loading, error) · full keyboard support · visible focus in every tenant · RTL · both densities · dark mode · Storybook stories per state · a `meta.json` · zero axe violations · visual snapshots per tenant × scheme · a maturity label (alpha / beta / stable).

---

## 7. Governance — the lead layer

Treat these as product, not paperwork. They're what separates a lead from someone who built a component library.

- **GOVERNANCE.md** — who decides what; contribution flow: *Issue → RFC (template) → design review → build → docs → release*; review SLA; a decision tree for requests: **extend an existing component vs. new variant vs. new component vs. local override**.
- **Versioning** — semver via Changesets, generated changelog.
- **Deprecation policy** — deprecate in a minor, remove in the next major, a codemod ships with every breaking change.
  **Do it once for real:** rename `Button variant="danger"` → `tone="critical"` (or a token rename), mark it deprecated in `$extensions` and meta, ship the codemod, run it on `apps/reference`, record it in the changelog. Keep the diff — it's an interview story.
- **ADRs (≥8)**, each ≤1 page: Context / Decision / Alternatives / Consequences. Suggested:
  - 001 Token build tool
  - 002 Headless primitives — build vs. buy (Radix vs. React Aria)
  - 003 Styling approach (CSS Modules vs. vanilla-extract vs. plain CSS vars)
  - 004 Docs framework
  - 005 Token tiers and naming
  - 006 OKLCH + contrast solver
  - 007 `meta.json` as the single source for docs, MCP and Figma
  - 008 Agent trust levels
  - 009 RTL via logical properties
- **Agent trust levels (AGENTS.md)** — mapped to the friction spectrum from my AI Trust Patterns framework:
  - **Ambient** — agents may auto-fix token drift in consumer code (raw value → matching token).
  - **Soft gate** — agents may open PRs for docs, meta and stories; a human approves.
  - **Hard gate** — new components, token-tier changes and breaking changes need an RFC and human design review. Agents cannot merge.

---

## 8. MCP server

Compact JSON responses, no prose padding.

| Tool | Returns |
|---|---|
| `list_components()` | name, maturity, one-line purpose |
| `get_component(name)` | props schema, variants, states, do/don't, a11y notes, minimal example |
| `get_tokens(category?, tenant?, mode?)` | resolved tokens |
| `find_token(value)` | nearest semantic token for a raw value + reason, e.g. `#1f56e0 → color.action.primary.bg (ΔE 0.8)` |
| `get_pattern(name)` | page-level patterns: multi-step form, overview dashboard, settings with danger zone |
| `audit_snippet(code)` | drift findings + suggested fixes |

Expose `AGENTS.md` as a resource. Runnable via `npx`. Setup docs for Claude Code, Cursor and VS Code.
**Acceptance:** unit tests per tool; a recorded run where Claude Code builds a new screen using only the MCP.

---

## 9. Drift auditor

`strata audit <path> [--format json|html]`

**Checks:** raw colours (hex / rgb / hsl / oklch) in TSX/CSS · off-scale spacing, radius and font sizes · font-family literals · native elements where a Strata component exists (`<button>`, `<input>`, `<select>`, `<table>`) · physical CSS properties → logical · missing accessible names (basic).

**Score:** 0–100, severity-weighted; formula documented in the README. Every finding carries a suggested fix (reuse `find_token`). HTML report is styled with Strata itself.
**Autofix (ADR-018):** `strata audit --fix` applies a fix only where there's one safe answer (exact token match, physical → logical property). Everything else stays a suggestion. The MCP `audit_snippet` tool runs the same engine. Raw-colour linting alone overlaps with `@shadcn/lint`; the native-element, logical-property and accessible-name checks are what set this apart.
**CI gate:** `apps/reference` must score ≥95. Publish a badge.

---

## 10. Agent eval — the headline number

- 25 prompts in `evals/prompts/` spanning real screens (e.g. "Build a transactions page with filters and CSV export", "Add a two-factor settings section").
- Run each with Claude Code headless (`claude -p`) in a fresh worktree, twice:
  **A** — Strata installed, no MCP, no AGENTS.md
  **B** — Strata MCP (`--mcp-config`) + AGENTS.md
  Same model, same prompts. Use `--strict-mcp-config` in both runs so no user-level MCP servers leak in.
- Score each output: `strata audit` score · axe violations (render via Playwright) · renders without error.
- Output `evals/results.md` + a chart for `/story`: median audit score A vs B, % of runs fully on-system, a11y violations per screen.
- **Report whatever the numbers are.** If B doesn't beat A, that's a finding: improve meta/AGENTS.md, re-run, and show the delta across iterations. Cap at 25 × 2 runs per iteration.

**Widened by ADR-018** (the run cap above rises; the new cap is set in the Phase 5 plan):

- **Per model:** scores are reported for each model, never pooled. The harness, prompts and run command are public.
- **Tagged prompts:** every prompt is tagged accessibility, RTL or multi-brand where it applies, and each tag gets its own score. Multi-brand prompts run the same task across tenants and check for hard-coded brand values.
- **Variance:** each condition runs more than once; report the spread, and show failures as well as passes.
- **Context ablation:** none / AGENTS.md only / llms.txt / MCP, on the same prompts.

---

## 10a. Mobile reach — schema, native tokens, Hindi tenant

Added 2026-09-27 (ADR-019, ADR-020). Research: `docs/research/2026-09-27-differentiation.md`.

- **Server-driven UI schema:** a JSON Schema per component, generated from `meta.json`. Rules for versioning, unknown components and props, and required accessible names. One web renderer demo in the docs draws a screen from JSON across tenants.
- **Native token export:** Compose and SwiftUI token files per tenant, light and dark. Contrast is re-checked on the converted values.
- **Hindi tenant (hi-IN):** a Devanagari type pair and per-script type tokens (line height, minimum size, truncation). Tokens and copy only; no component forks.

**Acceptance:** a test that validates every docs example's props against the generated schema · contrast checks on native token output with the command beside the result · a clipping check on Hindi strings · the Hindi tenant passes the same axe sweep and screenshots as the others.

---

## 11. Docs site + `/story` case-study page

**Docs:** Getting started · Foundations (live token values per tenant) · Components (props tables generated from meta, live examples, do/don't) · Patterns · Brand Generator · Governance · Changelog · ADRs · For agents (MCP setup) · Figma ↔ code parity table.

**`/story` — output first, in this order:**

1. **Opening scene** — leave a placeholder; I'll write it. (A concrete moment: a new client signs on Thursday and their branded app has to be in pilot on Monday.)
2. **Brand Generator embedded live** — the hero.
3. **Three tenants side by side** — screenshots auto-generated by Playwright.
4. **Numbers** — theme pass rate, time to new tenant, agent eval A vs B, reference app audit score, component count. Each with its command.
5. **Five decisions that mattered** — tension → call → consequence, linked to ADRs.
6. **How I'd roll this out in a 40-designer / 300-engineer org** — audit → foundations → top-10 components → adoption program → what I'd measure, quarter by quarter.
7. **What this project doesn't prove** — and where my shipped work does.

Max ~600 words of prose on the page. Everything else is interactive or visual.

---

## 12. Quality bars

- **Visual:** 4pt grid, one type scale, 1.5 body line-height, no browser defaults leaking, realistic data density. Screens must look like shipped enterprise software, not Dribbble shots. Visual craft is the first thing reviewers judge.
- **Accessibility:** WCAG 2.2 AA · zero axe violations in Storybook and the reference app · full keyboard path through the request flow · focus visible in every tenant · `prefers-reduced-motion` respected.
- **Performance:** docs Lighthouse ≥95 for performance and accessibility · tree-shakeable package · gzip size per component listed in docs.
- **Code:** TS strict, no `any` in public APIs · Vitest for theme-engine, audit and mcp · Playwright visual snapshots (tenant × scheme × density) for key screens.
- **CI (GitHub Actions):** lint · typecheck · test · audit gate · visual tests · build · Changesets release.

---

## 13. Phases — stop after each for my review

| Phase | Scope | Ships |
|---|---|---|
| **0 · Plan** (½ day) | Read the brief. Propose scaffolding. Draft ADRs for open decisions with your recommendation. Flag anything here you disagree with. Scaffolding only — no feature code. | Plan + ADR drafts |
| **1 · Tokens + engine + generator v0** (week 1) | Primitive + semantic tiers, 3 tenants, contrast solver + fuzz test, generator UI previewing one screen. | **Public URL — v0.1 I can already show** |
| **2 · Components** (week 2) | ~20 components, meta files, a11y, RTL, density, Storybook, visual tests. | Deployed Storybook |
| **3 · Reference product** (weeks 2–3) | 3 screens × 3 tenants, content files, Qamar in Arabic RTL. | Deployed reference app |
| **4 · Governance** (week 3) | GOVERNANCE, CONTRIBUTING, ≥8 ADRs, Changesets, the real deprecation + codemod. | Changelog entry + codemod diff |
| **5 · MCP + audit + eval** (weeks 3–4) | MCP server, auditor, CI gate, eval runs and results. | `evals/results.md` + chart |
| **5a · Mobile reach** (after 5) | §10a: server-driven UI schema + renderer demo, native token export, Hindi tenant. | Schema docs page + token files + 5th tenant screenshots |
| **6 · Publish** (week 4) | npm publish (scoped), deploy docs (Vercel or Cloudflare Pages), README with a 30-sec GIF, `/story` page. Re-run the differentiation research first. | Everything live |

---

## 14. Working agreement

- Plan before code each phase; list the files you'll touch.
- Small commits, conventional messages, one PR per phase.
- When a choice has a design trade-off, **stop and ask me** with 2–3 options and your recommendation. My answer becomes an ADR.
- After any UI work, take Playwright screenshots of every tenant × scheme and show me before moving on.
- Never invent metrics. Every number comes from a script; write the command next to it.
- Update `docs/log.md` every session (changed / decided / next). It becomes my interview timeline.
- In every ADR and log entry, record **who made the call**: "Anuj decided" vs. "Claude recommended, Anuj accepted". Interviewers will ask what I did versus the agent — the record has to answer that.

---

## 15. Definition of done

- [ ] Brand Generator live: anyone pastes a hex and sees 3 screens re-skin with an accessible theme in <1s.
- [ ] `@<scope>/strata-tokens`, `strata-react`, `strata-mcp` published; `npx` MCP works in Claude Code and Cursor.
- [ ] 3 tenants × 3 screens × light/dark × comfortable/compact, one tenant in Arabic RTL.
- [ ] Theme fuzz result, audit score and eval A vs B — all reproducible from scripts.
- [ ] ≥8 ADRs, GOVERNANCE.md, one real deprecation shipped with a codemod.
- [ ] Figma library matches code (see Anuj's track) with a generated parity table.
- [ ] `/story` under ~600 words of prose.

---

## Anuj's track — Figma (not for the agent)

Runs in parallel with Phases 1–3. Interviewers for product-design roles will open the Figma file.

- Import the Figma-variables JSON from `packages/tokens` (variables-import plugin or Tokens Studio).
- **Split modes across collections** — Brand (3 modes), Scheme (2), Density (2) — so no collection needs more than 3 modes. This fits plan mode limits and mirrors the code's token architecture. Confirm your plan's limit first.
- Build the same ~20 components with property names identical to `meta.json`.
- Component descriptions = the one-liners from `meta.json`.
- Record a 60-sec clip: switch the Brand mode in Figma → frame re-skins; then the same switch in code.

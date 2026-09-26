# Strata — build log

One entry per session, newest first. Three headings: **Changed / Decided / Next**.
Every decision names who made the call: **Anuj**, **Claude recommended, Anuj accepted**, or **Claude** (pending Anuj's review).
Numbers only with the command that produced them. Design trade-offs get an ADR in `docs/adr/`.

---

## 2026-09-26 — Phase 0 + Phase 1 started

**Changed**
- pnpm monorepo scaffold: `packages/theme-engine`, `packages/tokens`, `apps/generator`, `tenants/{vela,harbor,qamar}`.
- Phase 1 in progress: OKLCH ramps, contrast solver, exporters (CSS, DTCG, Figma), tenant brand + content files, Brand Generator v0 with one preview screen.
- ADR template + ADR-001…010 drafted.
- README, CLAUDE.md, CONTRIBUTING, CI workflow, Changesets config, `pnpm screenshots` (Playwright + axe).

**Decided**
- Repo built in the cloud, then saved to `~/projects/strata` — **Anuj**.
- Headless primitives: React Aria Components (ADR-002) — **Anuj**.
- Styling: CSS Modules + CSS custom properties (ADR-003) — **Anuj**.
- TypeScript pinned to 5.9, not 7.0, for tooling compatibility — **Claude**.
- Tenants Vela / Harbor / Qamar and their fictional product names — **Claude**, from the brief.
- Feedback palette retuned (success L 0.53, info L 0.55) and given preferred labels (warning = ink, others = white) so the solver log only shows brand-driven changes — **Claude** (ADR-006).
- Secondary button labels start at primary.12 in light mode (step 11 failed on the pressed fill for 82% of brands) — **Claude**.
- Mid-tone fills where neither label passes: deepen the fill and keep white labels if ΔL ≤ 0.12 — **Claude**.
- Figma export: one brand-moded "Brand" collection (ramps + resolved roles) with Semantic Light/Dark files identical across tenants; the build fails if they ever differ — **Claude recommended**, pending Anuj (ADR-010).
- Preview screen in the generator renders as an embedded region with headings shifted down a level (no nested `<main>`, one h1) — **Claude**.
- Awaiting Anuj: ADR-001, 004, 005, 006, 009, 010 (Claude recommended). ADR-007 and 008 are for Phases 2 and 5.

**Results**
- Theme fuzz: 1,000 brands, 78,000 / 78,000 checks pass; median 0.42 ms per theme; adjustments per brand median 4 (was 12 before retuning) — `pnpm test:themes`.
- Tenants: Vela, Harbor, Qamar each 78/78 checks, 3 adjustments, 316 tokens — `pnpm tokens`.
- Tests: 132 passing across engine + exporters — `pnpm test`.
- axe (wcag2a/aa, 2.1 a/aa, 2.2 aa): 0 violations on 6 preview pages — `pnpm screenshots` (run here with `STRATA_LOCAL_FONTS`, since the build sandbox can't reach Google Fonts).

**Open questions for Anuj**
- Pure-red brands get white labels in light mode but ink labels in dark (ink already passes there). Match the schemes by deepening the dark fill, or keep the brand exact? (ADR-006)

**Next**
- Phase 1 review with Anuj: screenshots in `docs/screenshots/phase-1/`, fuzz report, pending ADRs.
- Then Phase 2: components.

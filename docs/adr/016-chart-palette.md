# ADR-016: Chart palette, solved per brand

- **Status:** Proposed — Claude recommended, pending Anuj
- **Date:** 2026-09-27
- **Principles:** 1, 2, 3

## Context

- Strata is adding charts. Brand colours are not a chart palette. The dataviz validator (`validate_palette.js`, dataviz skill) failed almost every tenant's `text.brand` + `accent.text`: the dark-mode lightness band, the chroma floor (Care sage 0.055, Harbor teal 0.068), CVD separation (Care light ΔE 4.3 protan) and the normal-vision floor (ΔE < 15).
- Any hex can be a brand (ADR-006), so a fixed palette can't carry the brand, and a hand-picked one per tenant can't cover generated brands.

## Decision

- **Solved, not picked** (like glass): `src/chart.ts` emits `chart: { series[4], grid, axis }` per scheme, checked on the final 8-bit hex against the validator's own thresholds and CVD model: L in the band (light 0.43–0.77, dark 0.48–0.67), C ≥ 0.10, ≥ 3:1 on `surface.raised` **and** `surface.default`, adjacent-pair ΔE ≥ 8 under protan, deutan **and** tritan (Machado 2009, severity 1), and normal-vision ΔE ≥ 15 on **every** pair (the validator checks adjacent pairs only).
- **Series 1 = the brand hue**, at the in-band lightness nearest the brand's own, with chroma lifted to ≥ 0.10. Near-grey brands (C < 0.02, e.g. the house brand `#18181b`) have no hue to keep: they take the accent's hue, else the first candidate (blue), and the theme carries a note.
- **Series 2–4** walk a fixed candidate list (blue, orange, teal, magenta, amber, violet, green, red). A candidate is skipped if it is within 35° of a chosen hue (a navy next to a sky blue reads as "the same colour") or if no tone at that hue passes the pairwise checks. Tones sit as close to L 0.60 (light) / 0.64 (dark) as the checks allow. Fixed order means identity never depends on a ranking.
- **Grid** = `border.subtle` (decorative), **axis** = `text.subtle` (text, already checked at 4.5:1). CSS aliases them with `var()`.
- **Tokens:** `--strata-chart-{1,2,3,4}`, `--strata-chart-grid`, `--strata-chart-axis`; DTCG `semantic.<scheme>.chart.{1–4,grid,axis}` (grid/axis alias the role tokens). 339 DTCG tokens (was 327).

## Alternatives considered

- **Use the brand ramps directly (snap-to-step)** — the brand hue survives, but accent + primary often collapse under CVD (Care) and near-grey brands have no step with C ≥ 0.10.
- **One fixed palette for every tenant** — always valid, but series 1 stops looking like the brand, and it can still clash with a brand whose own colour sits next to a series.
- **Max-margin tone search** (pick the tone farthest from its neighbours) — tried first; it pushed series to the band edges (navy, brown). Nearest-to-target lightness with a hard pass/fail keeps mid-tone, vivid series.

## Consequences

- **Good:** 2,000 of 2,000 fuzz palettes pass every check (`pnpm test:themes`). The real validator agrees: 0 FAIL and 0 WARN across the same 2,000 palettes, each run against `surface.raised` and `surface.default` (4,000 runs), and "ALL CHECKS PASS" for all 5 tenants × 2 schemes.
- **Bad:** margins are tight by design (lowest adjacent CVD ΔE 8.0, normal ΔE 15.0, contrast 3.0001:1), so a change to the checks' maths needs the cross-check re-run. The palette is capped at 4 series. Tritan is checked here but the validator only reports it. The house brand's series 1 is blue, not its (grey) brand colour. Series 1 can move a long way in lightness from a very light or very dark brand (Qamar gold `#f2a516` → `#c78600` in light).
- **Revisit when:** charts need more than 4 series, or scatter/map charts need all-pairs CVD separation (the validator caps those at 3 series).

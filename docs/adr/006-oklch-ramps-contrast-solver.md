# ADR-006: OKLCH ramps + contrast solver

- **Status:** Proposed — Claude recommended, pending Anuj
- **Date:** 2026-09-26
- **Principles:** 3, 7

## Context

- The generator must turn any hex into a full light + dark theme. A theme that fails WCAG 2.2 AA must not be generated or exported (Principle 3).
- HSL lightness isn't perceptual: yellow and blue at the same L differ wildly in contrast. Hand-tuned palettes can't take arbitrary input.

## Decision

- **Colour maths:** zero-dependency OKLab/OKLCH in the engine. Out-of-gamut colours are mapped into sRGB by reducing chroma (L and hue held).
- **Ramps:** 12 steps per hue; hold hue, vary L and C. The brand hex stays **exact at step 9**.
- **Contrast:** WCAG 2.x ratios — 4.5:1 text, 3:1 large text and non-text (focus ring, input borders).
- **Checked on final 8-bit hex.** No rounding up: 4.49 fails.
- **Solver order:** keep the brand exact; move labels, rings and text first.
- **Every change is logged in plain English**, e.g. "#FFD400 is too light for white labels → button text switched to ink."
- **One heuristic that is not WCAG:** in dark mode, primary buttons must reach 2.2:1 against the canvas to stay findable. Logged as `visibility`, never reported as a WCAG result.
- **The system palette passes as-is.** Feedback bases are tuned (success L 0.53, info L 0.55) with a preferred label each (warning = ink, the rest = white), and secondary labels start at step 12. So the solver log only shows changes caused by the brand: median 4 per brand, down from 12 (`pnpm test:themes`).
- **Mid-tone fills** where neither white nor ink reaches 4.5:1: deepen the fill and keep white labels if ΔL ≤ 0.12, otherwise take the smaller move.
- **Same label in both schemes** (decided 2026-09-27 — Claude recommended, **Anuj** accepted): dark mode tries the light-mode label first, moving the dark fill by up to ΔL 0.12 so it passes (deeper for white, lighter for ink). It never undoes the dark visibility lift; if no move within 0.12 works, the normal label rule applies. Logged as `choice`. Pure red: `#ec0000` with white labels in both schemes (was `#ff0000` + ink in dark). This follows Apple, IBM Carbon, GitHub Primer and Radix, which keep white labels on red in both schemes and adjust the fill; Material 3 is the exception (labels flip). That comparison is from memory and hasn't been checked against each system's current docs.

## Alternatives considered

- **APCA** — better perceptual model, especially in dark mode. Not a ratified standard; audits and procurement check WCAG 2.x. Can be reported alongside later.
- **HSL ramps** — not perceptual (see Context).
- **Fixed palettes (Radix Colors, Tailwind)** — excellent quality, but can't take an arbitrary brand hex.
- **culori / chroma.js at runtime** — solid, but the maths we need is small. culori stays a devDependency, not shipped.

## Consequences

- **Good:** any hex works; every adjustment is explained; fuzzable — `pnpm test:themes`.
- **Bad:** we own the colour-maths correctness. WCAG 2.x misjudges some dark-mode pairs; the 2.2:1 heuristic patches one case only. Keeping the brand exact can force ink labels (e.g. yellow), which some brands dislike — logged as a `choice`.
- **Resolved (Anuj, 2026-09-27):** pure-red brands used to get white labels in light and ink in dark. Dark fills now deepen so labels match. Cost: in ~11% of brands the dark button is up to ΔL 0.12 away from the exact brand hex. Brands whose labels differ across schemes: 95 → 0 (primary) and 102 → 0 (accent) of 1,000 fuzz brands, measured with the fuzz inputs from `pnpm test:themes`.
- **Revisit when:** WCAG 3 / APCA becomes what audits check.

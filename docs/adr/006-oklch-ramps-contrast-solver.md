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

## Alternatives considered

- **APCA** — better perceptual model, especially in dark mode. Not a ratified standard; audits and procurement check WCAG 2.x. Can be reported alongside later.
- **HSL ramps** — not perceptual (see Context).
- **Fixed palettes (Radix Colors, Tailwind)** — excellent quality, but can't take an arbitrary brand hex.
- **culori / chroma.js at runtime** — solid, but the maths we need is small. culori stays a devDependency, not shipped.

## Consequences

- **Good:** any hex works; every adjustment is explained; fuzzable — `pnpm test:themes`.
- **Bad:** we own the colour-maths correctness. WCAG 2.x misjudges some dark-mode pairs; the 2.2:1 heuristic patches one case only. Keeping the brand exact can force ink labels (e.g. yellow), which some brands dislike — logged as a `choice`.
- **Open (Anuj):** a pure-red brand gets white labels in light mode but ink in dark, because ink already passes there. Deepen the dark fill so both schemes match, or keep the brand exact?
- **Revisit when:** WCAG 3 / APCA becomes what audits check.

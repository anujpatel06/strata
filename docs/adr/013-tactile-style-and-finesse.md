# ADR-013: Tactile style, with finesse inspired by macOS and visionOS

- **Status:** Accepted — direction decided by **Anuj**; token design Claude recommended, Anuj accepted
- **Date:** 2026-09-27
- **Principles:** 1, 3, 7

## Context

- Anuj's review of v0.2: the components felt dated, with no interaction or micro-interactions. The bar is the level of detail and polish in Apple's design.
- Anuj: take *inspiration* from Apple, don't copy it. Strata must keep its own identity and stay multi-brand.
- Glass and motion bring real accessibility risks (text over unknown backdrops, vestibular motion), and this is an accessibility-first portfolio.

## Decision

- **Pass 1, tactile (in progress):** springs, press and hover micro-interactions, sliding selection, layered depth. Glass on floating layers only. Spec: `packages/react/CONVENTIONS.md` → "Tactile style". References: Linear, Apple, Vercel/Geist, Raycast.
- **New engine tokens:**
  - motion: `duration-slow`, `easing-out`, and a damped spring (stiffness 400, damping 28) sampled into CSS `linear()`, with its settle time as a duration;
  - elevation: `shadow-highlight`;
  - glass: `glass-bg`, `glass-blur`, `glass-opacity`.
- **Glass opacity is solved, not picked.** It's the lowest opacity at which `text.default` and `text.subtle` reach 4.5:1 on `surface.raised` over a black *and* a white backdrop. A fuzz invariant checks it.
- **Pass 2, finesse (macOS + visionOS inspiration, not imitation):**
  - continuous corners (`corner-shape: squircle` as progressive enhancement), and nested radii that line up (inner = outer − padding);
  - letter-spacing that follows text size, and finer weights;
  - hairlines on high-resolution screens;
  - layered translucent fills (still contrast-checked);
  - softer shadows, a focus halo on top of the 2px ring, and thinner icon strokes.
- **Not copied:** Apple's colours, SF fonts (licensed for Apple platforms only; the `system-ui` stack reaches them on Apple devices), icons or component shapes.

## Alternatives considered

- **Full glassmorphism everywhere:** most striking, but text contrast over arbitrary backdrops can't be guaranteed on content surfaces.
- **Glass as a seventh brand input:** strong multi-brand story, but more work. Could come later.
- **Stop pass 1 and redo it on the finesse foundations:** one clean pass, but throws away work in progress.

## Consequences

- **Good:** premium feel from tokens, so every tenant gets it. Motion respects `prefers-reduced-motion`, and the glass contrast is provable.
- **Bad:** more tokens (325 DTCG leaves, up from 316). `corner-shape` is only in recent Chromium, so other browsers get plain radii. Glass costs GPU on low-end devices.
- **Revisit when:** `corner-shape` is in all engines, or WCAG 3/APCA changes how glass contrast should be judged.

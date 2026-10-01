# ADR-038: The surface sheen is no longer painted

- **Status:** Accepted — **Anuj** (direction and the scope question); implementation by Claude.
- **Date:** 2026-10-01
- **Principles:** 1, 3, 7
- **Revises:** the **Surface recipe** in [`packages/react/CONVENTIONS.md`](../../packages/react/CONVENTIONS.md),
  added 2026-09-27 from Anuj's toast reference. The recipe stands; its first background layer does not.

## Context

- The Surface recipe lit every raised surface with `--syntara-sheen`: a 115° band of `text.default` peaking at 8%,
  painted in dark schemes only (`none` in light, where white-on-white is invisible and depth comes from the shadow).
  It shipped in **13 components**: Card, StatTile, Alert, Toast, Dialog, Sheet, Popover, Select, Combobox, Command,
  DatePicker, DataTable, EmptyState.
- On the small reference surface it came from — a toast — the band read as a soft light source. On the large dark
  cards of the docs home page, with a tile stack inside each card carrying the same band, it read as brushed metal.
  Anuj raised it on 2026-10-01 against the live home page.
- The token does a second, unrelated job: it is `none` in light and a gradient in dark, so
  `@container not style(--syntara-sheen: none)` is how **14 rules** ask "are we in a dark scheme?" without naming one.
  That is what switches on the **rim light** — a separate 1px top-left edge highlight. Turning the token off at the
  engine would have taken the rim with it, in every one of those 13 components.

## Decision

- **No component paints `--syntara-sheen`.** The band is gone from all 13.
- **The engine token is unchanged.** `packages/theme-engine` still emits the same gradient in dark and `none` in
  light. Nothing about the published theme contract moves, and the 14 style queries keep working, so **the rim light
  survives exactly as it was** — which is what Anuj chose when asked how far to go (band only, keep the rim).
- **The sheen slot stays in the layer list**, as `--_sheen: none`, wherever the recipe spells out its background
  layers. The recipe keeps its documented shape and the band is one line per file from returning.
- **The glass surfaces keep their 8-point opacity offset** (`calc(var(--syntara-glass-opacity) * 100% + 8%)`), which
  existed only to buy back the contrast the sheen cost. A more opaque face can only add margin, and removing it would
  be a second, unrequested change to seven overlays.

## Consequences

- **Contrast only improves.** The band brightened the face in dark schemes, where text is light. Every figure in the
  component comments and tests was measured *under* the band; with it gone, each is now a floor rather than a target.
  The contrast proofs still composite the old peak on purpose, so they stay conservative — they passed unchanged.
- **Four test assertions flipped** from "the sheen is painted" to "the sheen is not painted", so it cannot return by
  accident: `card.test.tsx`, `alert.test.tsx`, `toast.test.tsx`, `popover.test.tsx`.
- **Light schemes are untouched.** The token was already `none` there, so nothing about light mode changes.
- **Was not in scope, and has since gone too:** `--syntara-shadow-highlight`, the *other* effect the code also calls
  a "sheen" — the inset top-edge highlight on solid fills. It is a different token on a different kind of surface and
  was not what Anuj pointed at here. He asked for it the same day after seeing this result: [ADR-039](039-no-top-edge-highlight.md).

## Alternatives rejected

- **Set `--syntara-sheen: none` in the engine for both schemes.** One line, but it silently kills the rim light in
  all 13 components and leaves 14 style queries as dead code. Rejected: it removes more than was asked for.
- **Give the scheme signal its own token and then blank the sheen at the engine.** The cleanest architecture, but it
  changes a published CSS custom property's meaning, needs a deprecation under `GOVERNANCE.md` §5, and touches the
  engine, 14 rules and the tenant token files — a large blast radius for a change whose point was to remove a visual
  effect. Rejected for now; it stays available if the sheen is never wanted again.
- **Keep the band and drop its peak from 8% to ~3%.** Reversible by one number, and it keeps the recipe literally as
  written. Rejected by Anuj: the band was the problem, not its strength.

# ADR-014: Strata draws its own icons (@strata/icons)

- **Status:** Accepted. Direction decided by **Anuj** ("curvy and minimalistic"); drawings by Claude, reviewed by Anuj.
- **Date:** 2026-09-27
- **Principles:** 1, 7

## Context

- Tabler supplied every icon (95 distinct icons in use: `grep -rhoE "\bIcon[A-Z]\w+"` over packages/react and apps). They were well made but generic, and their 2px stroke looked heavy next to the finesse pass (ADR-013).
- Anuj asked for our own set. He rejected a neutral outline set and then a duotone set in favour of "curvy and minimalistic".

## Decision

- **A new package, `@strata/icons`.** Each icon is a React component built from one `createIcon(name, node)` helper. The style spec lives in `src/create-icon.tsx`.
- **Grid and stroke:** 24px grid with a 20px live area. The stroke is 1.5 (one device pixel at 16px) with round caps and joins, and follows the token `--strata-icon-stroke`.
- **Shapes:** curves over corners (a curved check, a rounded chevron tip, arc shoulders, a scalloped gear), the fewest strokes that stay recognisable, and 4.5 / 3.25 box radii.
- **Drop-in swap:** export names match the Tabler names we used, and a `stroke` prop alias is included.
- **Accessibility:** icons are decorative (`aria-hidden`) by default. Passing `aria-label` makes one `role="img"`. Colour is always `currentColor`.
- **Brand logos (GitHub, React) are not redrawn.** They stay as their official marks.
- **Review loop:** `pnpm --filter @strata/icons sheet` renders every icon on its grid at 16/20/24px in light and dark. Tests check that names are unique, that icons stay inside the 1.5–22.5 area, and the default labelling.

## Alternatives considered

- **Keep Tabler (or Lucide):** zero cost, but no identity, and a heavier stroke.
- **Duotone signature:** adds depth, but works against "minimal". It can return later as an opt-in layer.
- **Neutral outline:** clean, but read as "a finer Tabler".

## Consequences

- **Good:** a distinctive, consistent set that matches the tactile style; it's tokenised and tree-shakeable.
- **Bad:** we own every new icon. Adding one means drawing it to the spec and reviewing it on the sheet.

---
"@strata/react": patch
---

Icons from `@strata/icons` flip and take the theme's stroke inside Button, Link and ToggleGroup.

- Arrows and chevrons flip under right-to-left again. The rule matched Tabler's class names, which `@strata/icons` doesn't render, so only icons with `data-directional` flipped.
- Chip and Eyebrow icons fall back to a 1.5 stroke when `--strata-icon-stroke` isn't set (was 1.75), the same as every other component (ADR-014).

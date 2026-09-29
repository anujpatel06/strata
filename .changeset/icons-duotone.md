---
"@syntara/icons": minor
---

A duotone layer: every outline icon now has a `Icon<Name>Duotone` twin.

- A duotone icon is its outline twin with a tint layer painted behind it. The outline is never redrawn — a twin composes the outline's own subpaths — so the two layers cannot drift apart, and no geometry is duplicated.
- One token controls the second tone: `--syntara-icon-tint`, defaulting to `color-mix(in oklab, currentColor 16%, transparent)`. Duotone therefore still follows the text colour, works on any surface and inside a solid button with no setup, and a theme, a tenant or one component can set the token to make the tint a real colour. Nothing to configure to get the default.
- Duotone is a fill style, so the bare strokes — a check, an arrow, a chevron, `plus`, `menu-2` and the rest that enclose no area — have a twin with no tint, rendering exactly like the outline. The set stays 1:1, so a product can move its whole icon layer to duotone in one import change without a missing export.
- No existing icon changed. `Icon.node` is new on every icon (the drawing it is built from), which is what lets a twin reuse an outline instead of copying it.

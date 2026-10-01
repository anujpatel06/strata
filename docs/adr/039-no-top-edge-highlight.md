# ADR-039: The top-edge highlight comes off every solid fill

- **Status:** Accepted — **Anuj** (direction, scope and both schemes); implementation by Claude.
- **Date:** 2026-10-01
- **Follows:** [ADR-038](038-no-painted-sheen.md), which removed the *other* effect the code called a "sheen" and
  explicitly left this one out of scope. Anuj asked for it the same day, after seeing ADR-038's result.
- **Revises:** **Tactile style → Depth tokens** in [`packages/react/CONVENTIONS.md`](../../packages/react/CONVENTIONS.md).
- **Principles:** 1, 7

## Context

- `--syntara-shadow-highlight` is `inset 0 1px 0 rgb(255 255 255 / 0.20)` in light and `/ 0.12` in dark: a 1px white
  line along the top edge of a solid fill, the "pressable key" look from the v0.3 tactile pass (CONVENTIONS, "Tactile
  style", Anuj 2026-09-27).
- It was in **41 places across 29 files** — far wider than the buttons Anuj named: 25 sites in 19 components (Button,
  Badge, Chip, Checkbox, Switch, Radio, Slider, Progress, Steps, Kbd, Tooltip, Avatar, Chart, FileUpload, IconTile,
  Pagination, Sidebar, Tabs, ToggleGroup) and 16 more in the docs site's own blocks and page CSS.
- Unlike the sheen of ADR-038, it is **present in both schemes**, and strongest in light (20% vs 12%). Removing it in
  dark only would have left most of it where it is most visible.
- Nothing queries this token, so unlike `--syntara-sheen` it carries no second job: taking it away breaks no
  mechanism.

## Decision

- **Every solid fill loses it, in both schemes** — all 41 sites, components and docs alike. Anuj was asked and chose
  the full scope over "Button only" and over "the controls you press", and chose both schemes over dark only.
- **Components and the docs site go together.** The blocks and page CSS are examples built from the system; leaving
  them lit would have left the pages Anuj actually looks at half-changed.
- **The engine token stays**, emitted exactly as before, as ADR-038 left `--syntara-sheen`. The published theme
  contract does not move, and the two removals stay consistent with each other. It now has **no users in this repo**,
  which CONVENTIONS says plainly.
- **Depth on a solid fill is now the raised shadow alone.** Secondary, outline and ghost variants are unchanged —
  they never carried it.

## Consequences

- **This changes light mode**, which ADR-038 did not. Solid buttons, checked controls, selected toggles and solid
  badges lose their lit top edge in both schemes.
- **Contrast is unaffected either way.** The highlight was an inset shadow on the fill's top edge, never behind a
  label — CONVENTIONS forbids anything behind a label, because the solver tunes fill and label to 4.5:1 with
  sometimes zero margin. Removing it changes no text contrast.
- **Button's pressed state no longer differs by shadow.** It used to drop the highlight on press; the press now
  reads through the darker `action.primary.pressed` fill and the spring scale, which is how CONVENTIONS describes a
  press anyway. The pressed rule still restates the raised shadow, so a stuck hover state cannot lift a pressed
  button.
- **Kbd is unaffected in practice.** An earlier draft of this ADR said the keycap would be "left with only the bottom
  edge to say 'key'". That was read off a comment, not measured, and it is wrong. The cap has four shadow layers and
  keeps three: the hairline ring, the deeper bottom edge (`0 -1px 0` inset at 80% alpha) and the drop shadow. Only the
  lit top edge goes. Checked against real dev builds of f0bfc42 and 2557e70 (2026-10-01): **light mode is visually
  identical**, because the cap's face is near-white and 20% white over it painted nothing; in dark the difference is
  visible only under magnification, and the ring plus the weighted bottom edge still carry the keycap.
- 18 comments across 16 files were rewritten, because they described a highlight that is no longer drawn.

## Alternatives rejected

- **Button only (6 sites).** What Anuj literally asked for, and rejected once the shared token was shown: a flat
  button beside a still-lit badge, switch and tab pill reads as a bug, not a style.
- **Only the controls you press** (Button, Badge, Chip, Checkbox, Switch, Radio, Tabs, ToggleGroup, Pagination,
  Steps). Coherent, but it leaves Kbd, Tooltip, Avatar, Chart, Sidebar, IconTile, Slider, Progress and FileUpload
  lit, which is the same inconsistency one level down.
- **Dark only**, to mirror ADR-038. Rejected: the highlight is strongest in light, so this would have kept most of
  what Anuj wanted gone.
- **Blank the token in the engine** (`inset 0 0 0 rgb(255 255 255 / 0)`). One line instead of 41, but it leaves a
  token whose name is a lie and whose value paints nothing, and it would silently change any consumer's build.

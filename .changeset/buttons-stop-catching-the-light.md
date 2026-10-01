---
'@syntara/react': minor
---

Remove the top-edge highlight from every solid fill (ADR-039).

`--syntara-shadow-highlight` drew a 1px white line along the top edge of solid fills — the "pressable key" look from
the v0.3 tactile pass. It is gone from all 19 components that used it: Button, Badge, Chip, Checkbox, Switch, Radio,
Slider, Progress, Steps, Kbd, Tooltip, Avatar, Chart, FileUpload, IconTile, Pagination, Sidebar, Tabs, ToggleGroup.

**This changes light mode as well as dark** — the highlight was present in both, and strongest in light (20% vs 12%).
Depth on a solid fill is now the raised shadow alone. Secondary, outline and ghost variants never carried it and are
unchanged.

Text contrast is unaffected: the highlight sat on the fill's top edge, never behind a label.

The engine still emits `--syntara-shadow-highlight` unchanged, so the published theme contract does not move, but
nothing in the library uses it any more.

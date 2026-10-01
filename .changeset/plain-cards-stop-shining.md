---
'@syntara/react': minor
---

Remove the painted sheen from every surface (ADR-038).

The Surface recipe lit raised surfaces with `--syntara-sheen`, a 115° band of light in dark schemes. On large cards
it read as brushed metal, so no component paints it any more: Card, StatTile, Alert, Toast, Dialog, Sheet, Popover,
Select, Combobox, Command, DatePicker, DataTable and EmptyState.

The engine token is unchanged, so the **rim light** on card edges is untouched and nothing about the published theme
contract moves. Light schemes never painted the sheen, so they look identical. In dark schemes the face is now
slightly darker, which only raises text contrast — every ratio previously proven under the band is now a floor.

---
"@syntara/mcp": patch
---

`find_icon` and `list_icons` see the duotone layer.

- A duotone icon is composed from its outline twin rather than declared with `createIcon`, so the source parser missed all 237 of them. It now reads `duotone(` and `untinted(` lines too.
- `find_icon` returns both styles of a match, each with its group, ranked so the outline comes first: `trash` gives `IconTrash` (core) then `IconTrashDuotone` (duotone).

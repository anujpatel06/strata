---
'@syntara/react': minor
---

Add `PromptComposer` (alpha), with `ComposerButton` and `ComposerSelect`: the box where people write to an AI.

A growing text area, a toolbar of pill controls and a send button that becomes stop while `isPending`. Enter sends
and Shift+Enter breaks the line; Enter while an input method is composing (Hindi, Japanese, Chinese keyboards) only
confirms the composition. `glow` draws a two-colour edge and halo — `brand` (primary and accent) or `spectrum`
(warning to info, warm to cool) — and `surface="glass"` gives a frosted face whose text keeps 4.5:1 over any
backdrop, the same recipe as Popover. Colours swap sides and the send arrow mirrors in right-to-left pages. On narrow
composers, pills with an icon show only the icon and keep their label as visually hidden text.

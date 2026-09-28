---
"@syntara/react": minor
---

Three fixes from the agent eval.

- `Key` is now exported: `import { type Key } from '@syntara/react'`. It is React Aria's `Key` (`string | number`), the type of every selection key (Select, Combobox, Tabs, ToggleButtonGroup, Menu). You no longer need react-aria-components as a direct dependency to type selection state, and React's own `Key` (which also allows `bigint`) is no longer the only one to hand. Type-only; nothing else changes.
- ToggleButtonGroup no longer overflows a narrow container. When its segments don't fit on one row they wrap onto another row inside the track, and a label longer than the whole track wraps inside its segment. No label is cut off and the page never scrolls sideways (WCAG 1.4.10). When the segments fit, it looks exactly as before.
- StatTile no longer shows good and bad change by colour alone (WCAG 1.4.1). Bad news (`positiveIsGood` against the direction of the change) shows a filled alert mark in place of the trend arrow; good news keeps the arrow; no change has no mark. Screen readers hear "better" or "worse" after the change. New props `betterLabel` and `worseLabel` (defaults `'better'`, `'worse'`) translate those words. Tiles with bad news look different: the arrow in their pill becomes the alert mark.

---
'@syntara/theme-engine': minor
'@syntara/tokens': minor
'@syntara/react': minor
---

Line heights are measured per type pair, and no glyph's ink leaves its line box

Six of the nine type pairs now carry their own line heights, measured with `scripts/check-script-clipping.mjs`
rather than sharing a scale chosen for Latin. Both Arabic pairs were cutting fully vowelled text by up to 12px, and
four Latin pairs were cutting descenders. Across 42,768 rendered cases — every size, weight, DPR and sub-pixel
offset the script tests — nothing clips now, down from 5,209 cases.

| Pair | tight | snug | normal |
|---|---|---|---|
| `bilingual-round`, `bilingual-classic` | 1.8 | 1.8 | 1.9 |
| `friendly` | 1.35 | 1.4 | 1.5 |
| `editorial`, `calm`, `technical` | 1.3 | 1.35 | 1.5 |

`precise` and `modern` clipped nothing and are unchanged, as is `bilingual-devanagari` (already measured in ADR-020).

**What changes for you:** if your brand uses one of the six, `--syntara-line-height-*` are larger and text is taller.
Arabic is noticeably airier. The CSS, DTCG and Figma exports carry the new values; the shadcn export is unaffected,
because it emits no line heights. No colour, no contrast result and no other token changed.

`ScriptTypeTokens.name` widens from `'devanagari'` to `'devanagari' | 'arabic' | 'latin'`, and `minFontSize` and
`capsTracking` are now optional so a pair can override line height alone. This is additive for anyone reading the
type; a switch over `name` that assumed a single value will need the new cases.

`@syntara/react` also re-exports `useLocale` from `theme-scope`, so components that need the scope's locale no longer
have to reach into `react-aria-components` directly.

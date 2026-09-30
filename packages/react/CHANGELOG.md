# @syntara/react

## 0.1.0

### Minor Changes

- 9ee91af: Button gets `tone`, and `variant="danger"` is deprecated (RFC-001, ADR-021).

  - react: `<Button tone="danger">` on the `primary`, `outline` and `ghost` variants. `variant="danger"` keeps working and renders the same until 1.0.0; it warns once in development. Migrate with `npx @syntara/codemods button-variant-danger-to-tone <path>`. CSS that targets `[data-variant='danger']` keeps working until 1.0.0; change it to `[data-tone='danger']` before then.
  - theme-engine: the four `feedback.*.fg` roles are now solved against `surface.canvas` and `surface.raised` as well (118 contrast checks per brand, was 102). No token value changed: the new pairs already passed in every tenant.
  - codemods: new package, with `button-variant-danger-to-tone`.

- 35d65df: Case-study cards.

  - `Card variant="showcase"`: a quiet face (surface.raised in light, surface.sunken in dark), a larger radius and a glossy rim brightest along the top. Text on it is proven for every tenant and 1,000 fuzz brands, light and dark.
  - `CardMedia` (new): a media area on top of a card, with a brand or accent haze behind the media only (`glow`).
  - `CardFooter divider`: a hairline rail above the footer.
  - `StatTile variant="editorial"`: large regular-weight figures with a quiet label.

- 3a42138: Three fixes from the agent eval.

  - `Key` is now exported: `import { type Key } from '@syntara/react'`. It is React Aria's `Key` (`string | number`), the type of every selection key (Select, Combobox, Tabs, ToggleButtonGroup, Menu). You no longer need react-aria-components as a direct dependency to type selection state, and React's own `Key` (which also allows `bigint`) is no longer the only one to hand. Type-only; nothing else changes.
  - ToggleButtonGroup no longer overflows a narrow container. When its segments don't fit on one row they wrap onto another row inside the track, and a label longer than the whole track wraps inside its segment. No label is cut off and the page never scrolls sideways (WCAG 1.4.10). When the segments fit, it looks exactly as before.
  - StatTile no longer shows good and bad change by colour alone (WCAG 1.4.1). Bad news (`positiveIsGood` against the direction of the change) shows a filled alert mark in place of the trend arrow; good news keeps the arrow; no change has no mark. Screen readers hear "better" or "worse" after the change. New props `betterLabel` and `worseLabel` (defaults `'better'`, `'worse'`) translate those words. Tiles with bad news look different: the arrow in their pill becomes the alert mark.

- a859d16: Line heights are measured per type pair, and no glyph's ink leaves its line box

  Six of the nine type pairs now carry their own line heights, measured with `scripts/check-script-clipping.mjs`
  rather than sharing a scale chosen for Latin. Both Arabic pairs were cutting fully vowelled text by up to 12px, and
  four Latin pairs were cutting descenders. Across 42,768 rendered cases — every size, weight, DPR and sub-pixel
  offset the script tests — nothing clips now, down from 5,209 cases.

  | Pair                                   | tight | snug | normal |
  | -------------------------------------- | ----- | ---- | ------ |
  | `bilingual-round`, `bilingual-classic` | 1.8   | 1.8  | 1.9    |
  | `friendly`                             | 1.35  | 1.4  | 1.5    |
  | `editorial`, `calm`, `technical`       | 1.3   | 1.35 | 1.5    |

  `precise` and `modern` clipped nothing and are unchanged, as is `bilingual-devanagari` (already measured in ADR-020).

  **What changes for you:** if your brand uses one of the six, `--syntara-line-height-*` are larger and text is taller.
  Arabic is noticeably airier. The CSS, DTCG and Figma exports carry the new values; the shadcn export is unaffected,
  because it emits no line heights. No colour, no contrast result and no other token changed.

  `ScriptTypeTokens.name` widens from `'devanagari'` to `'devanagari' | 'arabic' | 'latin'`, and `minFontSize` and
  `capsTracking` are now optional so a pair can override line height alone. This is additive for anyone reading the
  type; a switch over `name` that assumed a single value will need the new cases.

  `@syntara/react` also re-exports `useLocale` from `theme-scope`, so components that need the scope's locale no longer
  have to reach into `react-aria-components` directly.

- e17f88a: v0.3 craft pass.

  - theme-engine: motion (spring, easing-out, slow), glass solved for text contrast, rim and glow, hairline, size-matched tracking, caps tracking, icon stroke, display sizes, rounder radii, a chart palette solver checked for colour blindness, `editorial` and `modern` type pairs, a `paper` neutral, and 98 contrast pairs per brand.
  - react: tactile motion across components; new Sidebar, IconTile, Eyebrow, Amount, Meter, Tag, PersonChip, AreaChart/LineChart, BarChart, Sparkline and chart toolkit; Card `feature`/`inset`/`rim`; Button `contrast`; Badge `status`; soft-outline fields with sm/md/lg sizes; icons from `@syntara/icons`.
  - icons: new package, 235 icons.
  - tokens: ships `dist` (`files`).

### Patch Changes

- 7f49a1c: Avatar initials keep a grapheme cluster whole where `Intl.Segmenter` is missing

  `getInitials` fell back to the first code point when the runtime has no `Intl.Segmenter`, which took half of a flag
  (`🇮🇳` → one regional indicator) and dropped a decomposed accent (`e` + U+0301 → `E`). It now approximates a cluster —
  a base character with its combining marks, skin tones and zero-width-joiner sequences, or a flag's two regional
  indicators. Where `Intl.Segmenter` exists nothing changes.

  Initials in Brahmic scripts are unchanged: still the base letter with its marks dropped (ADR-032), `रेखा यादव` → `रय`,
  now proven to hold on both the segmenter and the fallback path.

- 6971e1a: Compact figures no longer fail hydration

  `Intl.NumberFormat` with `notation: 'compact'` is not stable across ICU versions, and the runtime that prerenders a
  page is not the one that hydrates it. Measured on a Linux runner: Node produced `₹18.0K`, `$5.0K`, `£240k` where its
  own Chromium produced `₹18T`, `$5K`, `£240K`. Any page with a compact figure — `Amount compact`, or a chart, whose
  y-axis labels, data table and summary are all prerendered — threw React error #418, and React discarded the server
  HTML and re-rendered the whole page on the client.

  The build's string now stands, identically for every reader (ADR-033). Two changes make that work:

  - `suppressHydrationWarning` on the elements that carry compact output, and only those. Plain currency formatting is
    untouched — it matches across runtimes, and suppressing more than necessary would hide a real mismatch later.
  - **`Amount` renders the figure as one text node** instead of one per Intl part. Intl returns as many parts as it
    likes and the count depends on the value and the runtime (`18K` is two parts, `18.0K` is four), which made the
    difference structural rather than textual — and `suppressHydrationWarning` does not cover a change in the shape of
    the DOM. If you query inside `Amount`'s figure by child index, that index has changed; the currency and fraction
    spans still carry their own classes.

  Compact figures are now pinned to whatever ICU built the site, so they read the same in every browser, and a Linux
  build and a macOS build of the same commit can ship different strings.

- 99e44df: Icons from `@syntara/icons` flip and take the theme's stroke inside Button, Link and ToggleGroup.

  - Arrows and chevrons flip under right-to-left again. The rule matched Tabler's class names, which `@syntara/icons` doesn't render, so only icons with `data-directional` flipped.
  - Chip and Eyebrow icons fall back to a 1.5 stroke when `--syntara-icon-stroke` isn't set (was 1.75), the same as every other component (ADR-014).
  - Accordion: a closed panel in server-rendered HTML is `display: none` until React Aria mounts, so links inside it can't take focus before hydration.

- 561b13e: Avatar initials, date placeholders and PersonChip no longer break in Indic scripts

  - **Avatar** takes the base letter in Brahmic scripts instead of the whole syllable. A grapheme cluster there is a
    consonant plus its vowel signs, so one per word ran together as a word: "रेखा यादव" gave "रेया", and a lone "रे"
    reads as ₹. Now "रय"; a conjunct gives the consonant it starts with ("क्षमा शर्मा" → "कश"). Covers Devanagari,
    Bengali, Gurmukhi, Gujarati, Oriya, Tamil, Telugu, Kannada, Malayalam and Sinhala. Latin, Arabic and emoji initials
    are unchanged.
  - **DatePicker** fills in segment placeholders from `Intl.DisplayNames` for locales React Aria has no strings for. A
    Hindi field read "dd / mm / yyyy"; it now reads "दिन / माह / वर्ष". Only where React Aria fell back to English on a
    non-Latin locale — its own strings are kept where it has them, because a date input wants "dd" over "day".
  - **PersonChip** no longer shaves the top and bottom off names in scripts with marks above and below the letters. The
    ellipsis needs `overflow: hidden`, which made the name a clip box exactly as tall as its line; Hindi names lost 4px.
    The box now has room, and the chip's height is unchanged.

  `getInitials` is exported and its output changes for Brahmic-script names — if you snapshot avatar initials, those
  snapshots will need updating.

- Packaging for the first release.

  - Every package carries its own `LICENSE` (npm does not hoist a monorepo root one), `repository` with its
    `directory`, `homepage`, `bugs` and `keywords`, so npm can show a source link and the packages are findable.
  - `@syntara/react`, `@syntara/icons` and `@syntara/theme-engine` have READMEs, which are what npm renders as the
    package page.
  - `@syntara/icons` and `@syntara/theme-engine` are built packages rather than TypeScript source: ESM with
    `preserveModules` plus declarations, mapped through `publishConfig.exports`. They previously exported
    `./src/index.ts`, which Node cannot load and Next.js will not transpile without `transpilePackages`. Neither
    declared `files`, so npm had also been packing their test suites — 2 files and 14 respectively, including the
    native token snapshots; both now ship `dist` alone.
  - `@syntara/react` and `@syntara/tokens` build on `prepack`, so a tarball can no longer ship a stale `dist`.
  - `@syntara/sdui`'s peer ranges on `@syntara/react` and `@syntara/icons` are real ranges instead of `workspace:*`,
    which publishes as an exact pin and would make every later release a peer conflict.

- d8414dd: Tooltip: a tooltip no longer stays on the page after focus or hover moves straight to another tooltip's trigger. Before, each one stayed mounted at the top-left corner with `role="tooltip"`. Swapping between tooltips is still instant; the tooltip carries `data-instant` while it swaps. A tooltip whose trigger only had focus in passing (the last item of a toggle group, on Tab) no longer fades out after never appearing. A tooltip opened by keyboard focus stays open when that focus scrolls the page; a scroll you make still closes it.
- Updated dependencies [3ab8971]
- Updated dependencies
- Updated dependencies [e17f88a]
  - @syntara/icons@0.1.0

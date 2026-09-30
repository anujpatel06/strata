# @syntara/tokens

## 0.1.0

### Minor Changes

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

- 320a45c: Phase 5: the drift auditor, the MCP server and brand fidelity (ADR-018, ADR-022).

  - audit: new package. `syntara-audit <path>` finds raw colours, off-scale sizes, written-out fonts, native elements, physical properties, missing accessible names and deprecated APIs. It scores 0–100, suggests a fix for every finding, and `--fix` applies the ones with a single right answer.
  - mcp: new package. A read-only MCP server with seven tools: `list_components`, `get_component`, `get_example`, `get_tokens`, `find_token`, `get_pattern` and `audit_snippet`. It serves `AGENTS.md` and `GOVERNANCE.md` as resources.
  - theme-engine: `brandFidelity(theme)` reports how far each brand fill is from the colour the brand asked for.
  - tokens: each tenant's `contrast-report.json` includes brand fidelity.

- 3a42138: Phase 5a: a server-driven UI contract, native token files and a Hindi type pair (ADR-019, ADR-020, ADR-023, ADR-024, ADR-025).

  - sdui: new package. A JSON Schema per component, generated from `meta.json`; `validateScreen`; and `SyntaraScreen`, a reference renderer for the web. 26 node types. Inputs, overlays, tables and charts aren't on the wire yet.
  - theme-engine: `toCompose` and `toSwiftUI` exporters. A new type pair, `bilingual-devanagari` (Mukta), with line heights and tracking set by measurement. The Figma export gains `font/lineHeight`.
  - tokens: each tenant gets `android/SyntaraTokens.kt` and `ios/SyntaraTokens.swift`. The build re-checks every contrast pair on the exported values. The Swift files are type-checked against the macOS SDK; the Kotlin files have not been compiled.
  - mcp: new tool `find_icon`. `get_component` returns `imports` and `typeNotes`.

- e17f88a: v0.3 craft pass.

  - theme-engine: motion (spring, easing-out, slow), glass solved for text contrast, rim and glow, hairline, size-matched tracking, caps tracking, icon stroke, display sizes, rounder radii, a chart palette solver checked for colour blindness, `editorial` and `modern` type pairs, a `paper` neutral, and 98 contrast pairs per brand.
  - react: tactile motion across components; new Sidebar, IconTile, Eyebrow, Amount, Meter, Tag, PersonChip, AreaChart/LineChart, BarChart, Sparkline and chart toolkit; Card `feature`/`inset`/`rim`; Button `contrast`; Badge `status`; soft-outline fields with sm/md/lg sizes; icons from `@syntara/icons`.
  - icons: new package, 235 icons.
  - tokens: ships `dist` (`files`).

### Patch Changes

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

- 320a45c: `@syntara/theme-engine` is now a dev dependency. The package ships built files only and never needed the engine at run time, so installing it no longer tries to fetch the engine.

# @syntara/sdui

## 0.1.1

### Patch Changes

- 74ee912: Three statements in these packages' READMEs were false on npm from the moment 0.1.0 published.

  - `@syntara/mcp` said "The package isn't published yet. `npx @syntara/mcp` will work after Phase 6" — printed on
    the npm page that disproves it.
  - `@syntara/sdui` said native token export "isn't built yet". It ships: every tenant gets
    `android/SyntaraTokens.kt` and `ios/SyntaraTokens.swift` from `pnpm tokens`, with every contrast pair
    re-checked on the exported values. There are still no native components and the Kotlin is uncompiled, which
    the README now says instead.
  - `@syntara/react` said `styles.css` reads `var(--syntara-*)` 2,736 times. That was `grep -c`, which counts
    lines containing the pattern. It is 3,472 occurrences across 2,736 lines, 118 distinct tokens. The command is
    in the README now so the figure can be reproduced.

  npm renders the README of the published version, so these only reach readers in a release.

## 0.1.0

### Minor Changes

- 3a42138: Phase 5a: a server-driven UI contract, native token files and a Hindi type pair (ADR-019, ADR-020, ADR-023, ADR-024, ADR-025).

  - sdui: new package. A JSON Schema per component, generated from `meta.json`; `validateScreen`; and `SyntaraScreen`, a reference renderer for the web. 26 node types. Inputs, overlays, tables and charts aren't on the wire yet.
  - theme-engine: `toCompose` and `toSwiftUI` exporters. A new type pair, `bilingual-devanagari` (Mukta), with line heights and tracking set by measurement. The Figma export gains `font/lineHeight`.
  - tokens: each tenant gets `android/SyntaraTokens.kt` and `ios/SyntaraTokens.swift`. The build re-checks every contrast pair on the exported values. The Swift files are type-checked against the macOS SDK; the Kotlin files have not been compiled.
  - mcp: new tool `find_icon`. `get_component` returns `imports` and `typeNotes`.

- 3ab8971: The wire knows the duotone icons; schema version 1.0.0 → 1.1.0.

  - `icons` gains the 237 `<name>-duotone` values, so a server-driven screen can ask for a duotone icon. Additive: every screen written against 1.0.0 still validates, and the evolution guard in `scripts/build-schemas.ts` is what classified this as a minor bump.
  - `src/validator.generated.js` is regenerated with the schema. Since ADR-034 the validator is compiled at build time, so adding names to the enum alone would ship a schema that accepts a duotone icon and a validator that rejects it.
  - A renderer pinned to 1.0.0 will reject a screen that names a duotone icon. `SUPPORTED_MAJOR` is unchanged, so nothing else has to move.

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

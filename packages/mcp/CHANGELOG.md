# @syntara/mcp

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

### Patch Changes

- 3ab8971: `find_icon` and `list_icons` see the duotone layer.

  - A duotone icon is composed from its outline twin rather than declared with `createIcon`, so the source parser missed all 237 of them. It now reads `duotone(` and `untinted(` lines too.
  - `find_icon` returns both styles of a match, each with its group, ranked so the outline comes first: `trash` gives `IconTrash` (core) then `IconTrashDuotone` (duotone).

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

- Updated dependencies [9ee91af]
- Updated dependencies [820c317]
- Updated dependencies [a859d16]
- Updated dependencies
- Updated dependencies [320a45c]
- Updated dependencies [3a42138]
- Updated dependencies [e17f88a]
  - @syntara/theme-engine@0.1.0
  - @syntara/audit@0.1.0

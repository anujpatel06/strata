---
"@syntara/sdui": minor
"@syntara/theme-engine": minor
"@syntara/tokens": minor
"@syntara/mcp": minor
---

Phase 5a: a server-driven UI contract, native token files and a Hindi type pair (ADR-019, ADR-020, ADR-023, ADR-024, ADR-025).

- sdui: new package. A JSON Schema per component, generated from `meta.json`; `validateScreen`; and `SyntaraScreen`, a reference renderer for the web. 26 node types. Inputs, overlays, tables and charts aren't on the wire yet.
- theme-engine: `toCompose` and `toSwiftUI` exporters. A new type pair, `bilingual-devanagari` (Mukta), with line heights and tracking set by measurement. The Figma export gains `font/lineHeight`.
- tokens: each tenant gets `android/SyntaraTokens.kt` and `ios/SyntaraTokens.swift`. The build re-checks every contrast pair on the exported values. The Swift files are type-checked against the macOS SDK; the Kotlin files have not been compiled.
- mcp: new tool `find_icon`. `get_component` returns `imports` and `typeNotes`.

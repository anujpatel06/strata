---
"@syntara/mcp": patch
"@syntara/sdui": patch
"@syntara/react": patch
---

Three statements in these packages' READMEs were false on npm from the moment 0.1.0 published.

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

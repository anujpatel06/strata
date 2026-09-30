---
"@syntara/theme-engine": minor
"@syntara/react": minor
"@syntara/tokens": minor
"@syntara/icons": minor
"@syntara/sdui": minor
"@syntara/audit": minor
"@syntara/codemods": minor
"@syntara/mcp": minor
---

The project is now called Syntara. Every package moves from the `@strata` scope to `@syntara`, and the name changes
everywhere it was the project's own (ADR-029).

This is breaking in four ways a consumer will notice:

- **Imports.** `@strata/react` becomes `@syntara/react`, and the same for `theme-engine`, `tokens`, `icons`, `sdui`,
  `audit`, `codemods` and `mcp`.
- **Tokens.** Every custom property is renamed: `--strata-color-text-default` becomes
  `--syntara-color-text-default`. Any stylesheet of your own that reads a token has to be rewritten. There is no
  codemod for this yet.
- **DOM attributes.** The theme scope writes `data-syntara-theme`, `data-syntara-scheme` and `data-syntara-density`
  instead of `data-strata-*`. Selectors and tests that match those attributes have to be rewritten.
- **Server-driven UI.** Schema ids become `urn:syntara:sdui:v1:*`. A stored screen document written against the old
  ids will not validate.

Also renamed: the CLIs (`syntara-audit`, `syntara-mcp`, `syntara-codemods`), the MCP server name and so its tool
prefix (`syntara__get_component`), its resource URIs (`syntara://agents`, `syntara://governance`), the environment
variables the scripts read (`SYNTARA_REGISTRY_URL`, `SYNTARA_BASE_URL`, `SYNTARA_LOCAL_FONTS`) and the exported
Kotlin and Swift symbols (`SyntaraTokens`, `SyntaraColors` and the rest).

No token *value* changed, and no component behaviour changed. The GitHub repository keeps its current name, so
existing links still work.

**Released as a minor, not a major — Anuj.** The rename breaks every consumer stylesheet, but nothing was ever published under `@strata/*`, so there is no consumer to break. Declaring it major would send the first public release to 1.0.0, and GOVERNANCE.md §5.3 reserves 1.0.0 for removing deprecated APIs that have lived through a 0.x window. `Button variant="danger"` has had no such window yet.

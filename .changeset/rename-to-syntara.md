---
"@syntara/theme-engine": major
"@syntara/react": major
"@syntara/tokens": major
"@syntara/icons": major
"@syntara/sdui": major
"@syntara/audit": major
"@syntara/codemods": major
"@syntara/mcp": major
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

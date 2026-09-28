---
"@syntara/audit": minor
"@syntara/mcp": minor
"@syntara/theme-engine": minor
"@syntara/tokens": minor
---

Phase 5: the drift auditor, the MCP server and brand fidelity (ADR-018, ADR-022).

- audit: new package. `syntara-audit <path>` finds raw colours, off-scale sizes, written-out fonts, native elements, physical properties, missing accessible names and deprecated APIs. It scores 0–100, suggests a fix for every finding, and `--fix` applies the ones with a single right answer.
- mcp: new package. A read-only MCP server with seven tools: `list_components`, `get_component`, `get_example`, `get_tokens`, `find_token`, `get_pattern` and `audit_snippet`. It serves `AGENTS.md` and `GOVERNANCE.md` as resources.
- theme-engine: `brandFidelity(theme)` reports how far each brand fill is from the colour the brand asked for.
- tokens: each tenant's `contrast-report.json` includes brand fidelity.

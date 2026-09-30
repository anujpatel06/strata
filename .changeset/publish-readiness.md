---
"@syntara/react": patch
"@syntara/tokens": patch
"@syntara/icons": patch
"@syntara/theme-engine": patch
"@syntara/sdui": patch
"@syntara/audit": patch
"@syntara/mcp": patch
"@syntara/codemods": patch
---

Every published package now carries its own `LICENSE`, a `repository` entry pointing at its directory, `homepage`
and `bugs`. `@syntara/react` and `@syntara/tokens` build on `prepack`, so a tarball can no longer ship a stale
`dist`. `@syntara/react`, `@syntara/icons` and `@syntara/theme-engine` have READMEs, which are what npm shows.

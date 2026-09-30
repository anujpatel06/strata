---
"@syntara/theme-engine": patch
"@syntara/react": patch
"@syntara/tokens": patch
"@syntara/icons": patch
"@syntara/sdui": patch
"@syntara/audit": patch
"@syntara/codemods": patch
"@syntara/mcp": patch
---

Packaging for the first release: every package carries `repository` (with its `directory`) and `keywords`, so npm
can show a source link and the packages are findable. `@syntara/icons` and `@syntara/theme-engine` gain
`files: ["src"]` — without it npm packed their test suites, 2 files and 14 files respectively, including the native
token snapshots. `@syntara/react`, `@syntara/icons` and `@syntara/theme-engine` gain READMEs, which npm renders as
the package page.

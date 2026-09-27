# Iteration 1 is not a valid comparison

Kept as a record. Don't quote its numbers.

**What went wrong.** The harness linked `node_modules` into each workspace instead of copying it. Claude Code's file search doesn't follow links, so most runs couldn't find the installed packages.

**How it showed.**

| | No context | MCP + AGENTS.md |
|---|---|---|
| Runs | 50 | 50 |
| Final messages that said the packages couldn't be read | 31 | 1 |
| Screens that import from `@strata/react` | 2 | 50 |

Counted from `result.json` and `src/screens/Screen.tsx` in this folder. A run without context that can't see Strata writes plain HTML and CSS, so the baseline measured "Strata not installed", not "Strata installed, no extra context". The 0% against 70% it produced for "fully on-system" is an effect of the defect.

**What is still true in it.** The runs with the MCP server didn't depend on reading the packages to find components, so their failures are real:

- 6 of 50 imported an icon that doesn't exist (`IconAward`, `IconMinus`, `IconContactless`, `IconMailOpened`, `IconDeviceTv`, `IconId`). The server has no tool to look up icons.
- 3 of 50 imported `@internationalized/date`, which the app didn't list as a dependency. `get_component` doesn't say that date components need it.
- 1 imported a `Key` type from `@strata/react`, which doesn't export one.

Those runs couldn't check an icon name against the package either, so iteration 2 may show fewer of them.

**The fix.** `template/.npmrc` installs plain folders (`node-linker=hoisted`), and `run.mjs` copies `node_modules` into each workspace. Each result now records whether the run read the packages (`readPackages`).

**Setup.** Packages packed from `320a45c`, a fresh checkout. 100 runs on 2026-09-27, model `claude-sonnet-5`.

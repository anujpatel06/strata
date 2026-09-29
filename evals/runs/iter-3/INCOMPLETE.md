# Iteration 3 is half a run

Kept as a record, because it cost 25.43 USD of real model calls. **Don't quote it as a result.** It has no baseline, so
it cannot answer the question the eval exists to answer.

**What is here.** 50 runs: 25 prompts × 2 repeats, condition `mcp` (MCP server + AGENTS.md), model `claude-sonnet-5`,
all `exitCode` 0, none timed out. Every run wrote `src/screens/Screen.tsx`. 1,796 turns, 140.7 minutes of wall time.
Counted from `result.json` in this folder.

**What is missing.** The `none` arm never ran — iteration 2 has `mcp/` and `none/` under every prompt; this has only
`mcp/`. Every number the eval reports is a comparison between the two, so there is nothing here to report. There is no
entry in `../../results.md`, correctly.

**It is also not comparable to a later iteration.** Every run records `source.commit` `ba85fb6`, a clean checkout of the
branch as it stood before the 15 commits that were on `origin/main` at the time. Those include changes to Avatar's
initials and to the components' `meta.json`, which the MCP server reads. Re-running the `none` arm today would compare
two different versions of Syntara.

`readPackages` is true in 13 of the 50. That is not iteration 1's defect: with the MCP server a run finds components
through the server and need not read the installed packages. It is recorded here because the count is worth knowing
before anyone reads these screens as evidence about discovery.

**To finish it.** Re-run both arms from one commit, as iteration 4. Nothing in this folder needs deleting first; the
harness writes per iteration.

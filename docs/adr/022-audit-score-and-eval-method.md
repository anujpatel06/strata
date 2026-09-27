# ADR-022: How the drift score is computed, and how the agent eval stays honest

- **Status:** Accepted for the build — **Claude** (pending Anuj's review). Eval size and model: **Anuj** (2026-09-27).
- **Date:** 2026-09-27
- **Principles:** 6, 7

## Context

- Phase 5 adds a drift auditor, an MCP server and an agent eval (BRIEF §8–10), widened by ADR-018.
- The eval's numbers are the project's headline claim, so how they're produced matters more than what they are.
- The first smoke runs leaked: one run read a neighbouring workspace, and one read memory notes an earlier run had saved.

## Decision

- **Score:** `failed = 3 × errors + warnings`, `total = 3 × places looked at by error rules + places looked at by warning rules`, `score = floor(1000 × (1 − failed ÷ total)) ÷ 10`. An error breaks something for a person; a warning has left the scale but still reads correctly. The weights were set before the first real run and not changed after it.
- **The score is a ratio, so it's always shown with the finding counts.** A large codebase with a few findings scores high. "Fully on-system" means zero findings, not a high score.
- **Only fixes with one right answer are safe.** An exact token match is safe only when a single role has that value. `--fix` and the ambient trust level (ADR-008) cover safe fixes and nothing else.
- **The MCP server is read-only.** It has no tool that writes.
- **One addition to the brief's six tools:** `get_example`, because agents copy working code better than they read prop tables.
- **Eval isolation:** packed packages, workspaces outside the repo, a random folder per run, memory off, the user's own MCP servers and settings excluded, and every file a run reads recorded. A run that read outside its workspace is counted and listed, not hidden.
- **Published runs use `setup.mjs --clean`:** a fresh checkout of HEAD.
- **First published eval:** 25 prompts × 2 conditions (`none`, `mcp`) × Sonnet 5 × 2 repeats = 100 runs. Anuj chose "Standard: 200 runs" and one model; 200 assumed two models, so one model gives 100.

## Alternatives considered

- **A score that counts findings per 1,000 lines:** simple, but it punishes files that are mostly styles and rewards files with little in them.
- **Exempting deliberate native elements in the docs app** (skip link, static tables): would raise its score. Left as findings; each needs a disable comment with a reason, written by its owner.
- **Linking the workspace packages into the eval app:** faster setup, but every run could read the repo's meta files, docs and examples, which no consumer has.
- **Dropping leaked runs from the numbers:** cleaner results, but it hides how often isolation fails.

## Consequences

- **Good:** the numbers can be reproduced and their limits are written next to them.
- **Bad:** setup is slower. The auditor reads one file at a time, so it misses what arrives through props. Models don't repeat themselves, so a re-run gives different numbers.
- **Revisit when:** a second model or the `agents` and `llms` conditions are run, or the score stops telling runs apart.

# Notes on iteration 2

**How to read the numbers**

- 50 runs per condition, one model, one agent. A gap of a few points is inside what repeats of the same prompt disagree on. Repeats disagreed on "fully on-system" for 10 of 25 prompts without context and 6 of 25 with the server.
- "Fully on-system" is strict: no audit findings, no type errors, renders in every view, no brand names. One type error fails it.
- The median audit score is 100 in both conditions, so it doesn't tell them apart. The counts of findings do: 19 without context, 0 with the server.
- Both conditions used Strata. All 100 screens import from `@strata/react`.
- Runs with the server took fewer turns and cost less as the CLI reports it. 13 of those 50 never opened the installed packages.

**Where the server did worse**

- Horizontal scroll at 390px: 3 screens with the server, none without. The rate in the table also counts screens that couldn't be measured because they didn't build: 1 in each condition.
- `multi-brand` prompts: 75% fully on-system with the server, 81.2% without. 16 runs each, so that's 12 against 13.
- Type errors are level at 88%. With the server they come from guessing at types the server doesn't describe: React Aria's `Key`, a column's cell function, `IconTile`'s tint.
- Both conditions imported an icon that doesn't exist, once each. The server has no tool to look up icons.

**What happened during the run**

- The account's usage limit was reached part-way. 84 runs ended in seconds with the limit message and 3 were cut off mid-work. All 87 were thrown away and run again. `run.mjs` now stops at a limit and records nothing for the runs it cuts short.
- The first 47 runs ran 3 at a time and the rest 8 at a time. Runs are independent, but a busier machine makes each one slower.
- One run without context hit the 15-minute limit (`18-payment-schedule`, repeat 2), while 8 were running at once. It counts as a run the agent didn't finish. Another took 796 seconds and finished.
- The first report listed 5 runs as reading outside their workspace. All 5 were the recorder's mistakes: files that don't exist inside the workspace, the folder above it, and Claude Code's own store for a long tool result. `score.mjs` now tells these apart. No run read another run's files or this repo.

**Setup**

- Packages packed from `dffb1e0`, a fresh checkout. Iteration 1 used `320a45c`; it isn't comparable for other reasons (see `runs/iter-1/INVALID.md`).
- Runs on 2026-09-27 and 2026-09-28, model `claude-sonnet-5`, Claude Code 2.1.283.
- Cost as the CLI reports it, summed over the 100 runs that count: 45.71 USD without context, 28.25 USD with the server.

# Agent eval

Does giving an AI coding agent Strata's context make it build better screens? This measures it, and reports whatever the answer is (BRIEF §10, ADR-018, ADR-022).

Results: [results.md](results.md). Raw runs: `runs/`.

## Method

- **25 prompts** in `prompts/`, each a real product screen. They're written the way a product manager would ask: they name the screen and its states, and say nothing about tokens, components or accessibility rules.
- **Tags.** 15 prompts are tagged `a11y`, 8 `multi-brand` and 6 `rtl`. Each tag gets its own scores.
- **One run** is one headless Claude Code session (`claude -p`) in a fresh copy of `template/`, a small app with Strata installed.
- **Conditions.** Every run gets the same prompt, the same README and the same tools (Read, Write, Edit, Glob, Grep). Only this differs:

  | Condition | What the run gets |
  |---|---|
  | `none` | Nothing extra. Strata is installed, as for any consumer |
  | `agents` | `AGENTS.md` |
  | `llms` | `llms.txt`, generated from the same `meta.json` files as the docs |
  | `mcp` | The Strata MCP server, plus `AGENTS.md` |

- **Repeats.** Each prompt, condition and model runs more than once. The report shows how much repeats disagree.
- **Per model.** Scores are reported for each model and never pooled.

## What keeps it fair

| Risk | What the harness does |
|---|---|
| The run reads this repo's docs, examples or meta files | Strata is installed from packed tarballs, the same files npm would publish. Workspaces and packages live outside the repo. Reads of the repo are denied. |
| The run reads another run's work | Each run has its own folder with a random name. |
| One run's saved notes reach a later run | Memory is turned off, paths are never reused, and the project folder Claude Code creates is removed after the run. |
| The user's own MCP servers, skills or settings leak in | `--strict-mcp-config`, `--setting-sources project`, `--disable-slash-commands`. |
| Work in progress gets into the packages | `setup.mjs --clean` builds from a fresh checkout of HEAD. |
| A leak happens anyway | Every file a run asks for is recorded. A run that read outside its workspace and the installed packages is counted and listed in the results. |

The second and third rows were found by the first smoke runs, which read a neighbouring workspace and an earlier run's memory notes. Those runs were thrown away.

## What is scored

`score.mjs` rebuilds the app with the files the run wrote. It calls no model.

| Measure | How |
|---|---|
| Built | `Screen.tsx` exists and isn't the placeholder |
| Typecheck | `tsc --noEmit`. An invented prop shows up here |
| Audit score and findings | `packages/audit` on the run's files |
| Renders | The app builds, mounts, shows content and logs no page error, in light, dark and at 390px wide |
| Axe | WCAG A and AA violation nodes, worst view |
| Right to left | For `rtl` prompts: the same checks in Arabic |
| Other brands | For `multi-brand` prompts: the same checks in each brand the prompt lists |
| Brand names in code | `theme="vela"`, `tenant === 'qamar'` and similar |
| Fully on-system | No audit findings, no type errors, renders everywhere, no brand names |

## What it doesn't measure

- **Visual quality.** Nothing here judges whether a screen looks good or matches a design.
- **Whether the screen does the job.** A screen can pass every check and miss a requirement in the prompt.
- **Keyboard and screen-reader behaviour** beyond what axe can see.
- **Other agents or vendors.** The harness drives Claude Code only.
- **The auditor's blind spots.** It reads one file at a time; its limits are in `packages/audit/README.md`.
- **Anything a person would do.** No human baseline was run.

## Reproduce

```sh
node evals/setup.mjs --clean
node evals/run.mjs --models claude-sonnet-5 --conditions none,mcp --repeats 2 --iteration 1
node evals/score.mjs --iteration 1
node evals/report.mjs --iteration 1
```

- `run.mjs` calls a paid model once per run and prints the number of runs first. `--dry` creates the workspaces and prints the commands without calling a model.
- A run that already has a `result.json` is skipped, so an interrupted eval continues with the same command.
- Models don't answer the same way twice, so a new run gives different numbers. The runs behind the published numbers are kept in `runs/`.
- In the two smoke runs on 2026-09-27, a run took 101 and 287 seconds and the CLI reported a cost of 0.31 and 0.71 USD. Two runs are not an estimate; they're why the script prints the run count before it starts.

## Files

| Path | What |
|---|---|
| `prompts/*.md` | The prompts, with their tags, brands and locale |
| `template/` | The app every run starts from |
| `setup.mjs` | Builds, packs and installs what runs start from |
| `run.mjs` | Runs the agents |
| `score.mjs` | Scores the runs |
| `report.mjs` | Writes `results.md`, `results.json` and the chart |
| `runs/iter-<n>/<prompt>/<condition>/<model>/<repeat>/` | What the run wrote (`src/`), what happened (`result.json`) and its scores (`score.json`) |

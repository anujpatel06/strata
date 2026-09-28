---
name: next-phase
description: Plan and start the next Syntara phase from BRIEF.md §13 — plan first, ask Anuj about design trade-offs, build, verify, log, then stop for review.
disable-model-invocation: true
argument-hint: "[phase number]"
---

Phase: $ARGUMENTS (if empty, use the "Next" line in the latest `docs/log.md` entry).

1. Read the phase in `BRIEF.md` (§13 table plus its detail section), the latest `docs/log.md` entry, and the relevant ADRs.
2. Write a short plan:
   - scope
   - the files you'll create or touch
   - open decisions, each with 2–3 options and your recommendation
   - how you'll prove it's done: acceptance criteria from the brief, and which numbers come from which command
3. **Stop and ask Anuj** to confirm the decisions. Record each answer as an ADR (`docs/adr/000-template.md`), with who decided.
4. Build. If work splits cleanly, use the `component-builder` / `docs-builder` subagents in parallel, with explicit file ownership each.
5. Run `/verify`, then `/screenshots` for anything visual.
6. Update `docs/log.md` (Changed / Decided / Results / Next), the README numbers block if numbers changed, and `CLAUDE.md` Status.
7. Commit with a conventional message. Then **stop for Anuj's review**. Don't start the following phase.

---
name: verify
description: Full Strata verification — typecheck, tests, contrast fuzz, meta check, registry, docs production build, axe sweep. Run before saying work is done or committing a phase.
---

Run these from the repo root and stop at the first failure. Fix it, or report it with the exact output.

1. `pnpm --filter @strata/react gen:index` (regenerate the component barrel)
2. `pnpm typecheck`
3. `pnpm test` (engine + components; all must pass)
4. `pnpm test:themes`: all checks pass, and the median adjustments per brand have not risen without a reason
5. `pnpm check:meta` (every component passes)
6. `pnpm registry` (every item ok)
6a. `node scripts/check-override-weight.mjs` (0 selectors that weigh the same as the component they restyle)
7. `pnpm --filter @strata/docs build` (all pages generated)
8. `node scripts/check-ssr-tabs.mjs` (0 pages with a tab list missing its panel; reads the build from step 7)
9. Start the site (`cd apps/docs && npx next start -p 3000 &`, note the PID), run `node scripts/axe-sweep.mjs` and `node scripts/check-overlay-exit.mjs`, then kill that PID. Expect 0 violation nodes, no page errors, and 0 overlay failures.

Then report a short table (step, result, the number that proves it) and update the "Results" lines in the current `docs/log.md` entry with the commands that produced each number.

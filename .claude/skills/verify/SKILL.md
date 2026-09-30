---
name: verify
description: Full Syntara verification — typecheck, tests, contrast fuzz, meta check, registry, docs production build, axe sweep. Run before saying work is done or committing a phase.
---

Run these from the repo root and stop at the first failure. Fix it, or report it with the exact output.

1. `pnpm --filter @syntara/react gen:index` (regenerate the component barrel)
2. `pnpm typecheck`
3. `pnpm test` (engine + components; all must pass), then `node scripts/check-test-counts.mjs --from <that
   output>` — the README's "Tests passing" row is hand-maintained, and this is what catches it going stale
   (`--fix` writes the counts; it does not move the table's "Measured" date, which covers every row)
4. `pnpm test:themes`: all checks pass, and the median adjustments per brand have not risen without a reason
5. `pnpm check:meta` (every component passes)
6. `pnpm registry` (every item ok)
6a. `node scripts/check-override-weight.mjs` (0 selectors that weigh the same as the component they restyle)
7. `pnpm --filter @syntara/docs build` (all pages generated)
8. `node scripts/check-ssr-tabs.mjs` (0 pages with a tab list missing its panel; reads the build from step 7)
9. Serve the export (`pnpm --filter @syntara/docs start &`, note the PID — the site is a static export, so `next start` no longer works), then run `node scripts/check-hydration.mjs`, `node scripts/check-theme-links.mjs`, `node scripts/check-narrow-overflow.mjs`, `node scripts/check-csp.mjs`, `node scripts/axe-sweep.mjs` and `node scripts/check-overlay-exit.mjs`, and kill that PID. Expect 0 hydration failures, 0 link failures, 0 pages scrolling sideways at 320px, 0 pages broken by the site's own CSP, 0 violation nodes, no page errors, and 0 overlay failures.
   - If something else already holds port 3000 the new server exits with `EADDRINUSE` in the background while the old one keeps answering, so those scripts would measure *that* build and report its faults as yours. All of them check the served build id against `apps/docs/.next/BUILD_ID` first and stop if it differs — believe that error rather than working around it, and kill the process actually holding the port (`lsof -nP -iTCP:3000 -sTCP:LISTEN`), which may be an orphan whose parent you already killed.

Then report a short table (step, result, the number that proves it) and update the "Results" lines in the current `docs/log.md` entry with the commands that produced each number.

# Strata — build log

One entry per session, newest first. Three headings: **Changed / Decided / Next**.
Every decision names who made the call: **Anuj**, **Claude recommended, Anuj accepted**, or **Claude** (pending Anuj's review).
Numbers only with the command that produced them. Design trade-offs get an ADR in `docs/adr/`.

---

## 2026-09-28 (Phase 5, eval) — the agent eval ran; the first attempt was thrown out

**Changed**
- Ran the agent eval twice. Iteration 1 is invalid and kept on record (`evals/runs/iter-1/INVALID.md`). Iteration 2 is the result (`evals/results.md`).
- Harness fixes, each found by reading runs:
  - `node_modules` is copied into each workspace, not linked. File search doesn't follow links, so in iteration 1 only 2 of 50 runs without context imported from `@strata/react`, and 31 said the packages weren't installed.
  - The eval stops at the account's usage limit and records nothing for the runs it cuts short. In iteration 2 the limit produced 84 empty runs and 3 half-finished ones; all 87 were thrown away and run again.
  - The leak check no longer flags a run's own files. Its first 5 reports were all false.
  - Each result records whether the run read the installed packages, and whether the screen imports from `@strata/react`.
- CI runs the drift gate, `pnpm drift apps/docs --min-score 95`.
- Docs: the MCP page shows the eval's results with their limits.

**Decided**
- Re-run all 100 runs after the harness fault, within the 200 runs Anuj approved — **Claude**, told to Anuj at the time.
- 8 runs at a time, up from 3 — **Anuj** ("run multiple agents and do this fast").
- Keep iteration 1 in the repo with a note, not delete it — **Claude**.
- A run that times out counts as a run. It isn't re-run to improve the numbers — **Claude**.
- Don't fix the gaps the eval found before reporting it. Fixes and a third iteration are Anuj's call — **Claude**.

**Results** — iteration 2, 50 runs per condition, `claude-sonnet-5`; `node evals/score.mjs --iteration 2 && node evals/report.mjs --iteration 2`

| Measure | No context | MCP + AGENTS.md |
|---|---|---|
| Fully on-system, % of runs | 64 | 88 |
| Audit findings, all runs | 19 | 0 |
| No axe violations, % of runs | 92 | 98 |
| Passes typecheck, % of runs | 88 | 88 |
| Renders in every view, % of runs | 98 | 98 |
| No horizontal scroll at 390px, % of runs | 98 | 92 |
| Median turns | 57 | 33.5 |
| Median cost per run, USD, as the CLI reports it | 0.85 | 0.513 |

- By tag, fully on-system: `a11y` 63.3 → 93.3 (30 runs each); `rtl` 41.6 → 83.3 (12 each); `multi-brand` 81.2 → 75 (16 each).
- Repeats disagreed on "fully on-system" for 10 of 25 prompts without context and 6 of 25 with the server.
- Total cost as the CLI reports it: 73.96 USD for iteration 2's 100 runs. Iteration 1, the discarded runs and the smoke runs cost more on top; that total wasn't summed.

**Verification** (2026-09-28, after the eval)
- `pnpm typecheck`: clean, 10 packages.
- `pnpm test`: 443 components · 224 engine · 245 icons · 143 MCP server · 74 auditor · 8 codemods, all passing.
- `pnpm test:themes`: 118,000 / 118,000 checks; 2,000 / 2,000 chart palettes; adjustments per brand median 4, max 7.
- `pnpm check:meta`: 53 / 53. `pnpm registry`: 71 items, all ok.
- `pnpm drift apps/docs --min-score 95`: passes, score 98.8, 60 findings.
- `pnpm --filter @strata/docs build`: 80 pages. `node scripts/check-ssr-tabs.mjs`: 0 of 79 pages with a tab list missing its panel.
- `STRATA_BASE_URL=http://localhost:3010 node scripts/axe-sweep.mjs`: 105 routes × light/dark, 0 violation nodes, 0 page errors.

**What the eval says, and doesn't**
- With Strata installed and readable, the agent used it in every run, in both conditions. The baseline is already strong.
- The server's clearest effect is on drift (19 findings to 0) and on effort (fewer turns, lower cost).
- It made no difference to type errors and did worse on narrow screens.
- One model, one agent, 50 runs a side. No claim here holds for another model.

**Known gaps**
- The server can't look up icons. Both conditions imported an icon that doesn't exist.
- `get_component` doesn't describe React Aria types (`Key`), a DataTable column's cell function, or that date components need `@internationalized/date`.
- BRIEF §8's recorded run of Claude Code building a screen with only the MCP server isn't done. Iteration 2's 50 server runs are the closest evidence.
- The `agents` and `llms` conditions and a second model haven't been run.
- The concurrency changed part-way through iteration 2.

**Next**
- Anuj: review Phase 5. Decide whether to fix the gaps above and run a third iteration to measure the change.
- Then Phase 5a: server-driven UI schema, native token export, Hindi tenant.

---

## 2026-09-27 (showcase card) — the case-study card face on Blocks and the home showcase; the axe sweep waits for hydration

**Changed**
- `Card variant="showcase"` + `CardMedia` (glow behind media only), `StatTile variant="editorial"`, `CardFooter divider`; the /blocks index is a grid of showcase cards (`components/blocks/block-overview.tsx`).
- Home showcase (`components/showcase/cards.tsx`): every plain card, Net revenue included, is now `variant="showcase"`. The promo keeps `feature`, so it stays the one glowing card.
- `scripts/axe-sweep.mjs` waits until `<main>` is hydrated before scanning. At networkidle /blocks was still server HTML, so Meter's role fix hadn't run and closed accordion panels read as focusable: 8 false findings, 0 after hydration.
- `.claude/launch.json` runs `next dev` directly; through `pnpm docs` the preview server exited after 3s.

**Decided**
- Showcase face on the home cards — **Anuj** (asked for his case-study background on the Net revenue card). Applying it to the neighbouring plain cards too — **Claude** (pending Anuj).
- Dark showcase face stays surface.sunken (the page colour), not surface.raised: closer to the reference, and the stat tiles stay lifted instead of reading as sunk — **Claude recommended, Anuj accepted** (previewed side by side).
- Editorial stat numbers stay regular weight, not medium — **Claude recommended, Anuj accepted**.

**Results**
- `pnpm test`: react 443, engine 219, icons 245, codemods 8 passing (before the Phase 5 session's changes). `pnpm check:meta`: 53/53.
- `node scripts/axe-sweep.mjs`: 105 routes × 2 schemes, 0 violation nodes.

**Next**
- Commit on Anuj's go, only these files (another session has uncommitted Phase 5 work in the tree).

---

## 2026-09-27 (Phase 5, build) — auditor, MCP server, brand fidelity, eval harness

**Changed**
- `packages/audit` (new): the drift auditor. Ten rules, a fix on every finding, `--fix` for the safe ones, text, JSON and HTML reports, `--min-score` for CI. `pnpm drift <path>`.
- `packages/mcp` (new): a read-only MCP server over stdio with seven tools and two resources. `audit_snippet` and `find_token` run the auditor's engine.
- `packages/theme-engine`: `brandFidelity(theme)`, the distance between each brand input and the fill that carries it. In the fuzz report and in each tenant's `contrast-report.json`.
- `AGENTS.md` (root) and `.github/CODEOWNERS`.
- `evals/` (new): 25 prompts, the template app, `setup`, `run`, `score` and `report` scripts, and a README with the method and its limits.
- `packages/tokens`: `@strata/theme-engine` moved to dev dependencies. The eval's setup found that installing the packed package tried to fetch the engine from npm.
- CI runs the drift gate: `pnpm drift apps/docs --min-score 95`.
- Docs: the MCP page describes the real server.

**Decided**
- Eval size "Standard" and model Sonnet 5 — **Anuj**. With one model that is 100 runs, not 200 (ADR-022).
- Auditor and MCP server built in parallel by two subagents with separate files — **Anuj**.
- Score formula and weights, safe-fix rule, `get_example` as a seventh tool, eval isolation rules (ADR-022) — **Claude** (pending Anuj).
- Colours inside `mask-image` aren't checked: a mask is read for alpha only — **Claude** (the auditor subagent's call, accepted by the lead).
- Native elements in the docs app (a skip link, anchors, two tables) stay as findings. No exemptions were added to raise the score — **Claude**.

**Results**
- `pnpm --filter @strata/audit test`: 74 passing. `pnpm --filter @strata/mcp test`: 143 passing, including 3 against the real auditor. `pnpm --filter @strata/theme-engine test`: 224 passing.
- `pnpm drift apps/docs`: score 98.8. 60 findings (24 errors, 36 warnings) in 4,598 places looked at; 34 have a safe fix. By rule: 35 off-scale space, 23 native elements, 1 off-scale radius, 1 physical property.
- `pnpm drift packages/react/src/ui`: score 99.9. 1 finding, the `<table>` in `chart.tsx`.
- Brand fidelity over 1,000 random brands (`pnpm test:themes`), ΔE in OKLab × 100:
  - primary, light: kept exactly 89.2%, p95 3.5, largest 5.8
  - primary, dark: kept exactly 80.0%, p95 7.1, largest 29.0
  - accent, light: kept exactly 88.4%, p95 3.1, largest 5.6
  - accent, dark: kept exactly 77.5%, p95 8.0, largest 25.0
- Tenants (`pnpm tokens`): Vela, Harbor, Qamar and Care keep both brand colours exactly in both schemes. The house theme's near-black `#18181b` ships as `#4a4a4e` in dark, a distance of 20.0.
- MCP response sizes: see the MCP docs page; `pnpm --filter @strata/mcp test sizes`.
- Smoke runs of the eval, one prompt: two early runs leaked (one read a neighbouring workspace, one read an earlier run's memory notes) and were thrown away. After the fix, neither of the two runs read anything outside its workspace. They're not results and aren't kept.

**Known gaps**
- The eval itself hasn't run yet. There is no headline number.
- BRIEF §8's recorded run of Claude Code building a screen with only the MCP server isn't done.
- The Cursor and VS Code setup snippets haven't been tried in those clients.
- CODEOWNERS only blocks a merge once branch protection requires code-owner review. That's a GitHub setting for Anuj.
- The dark-scheme fidelity tail (up to 29.0) is measured, not yet examined.
- `meta.json` token lists name some tokens two ways (`icon.stroke` and `icon-stroke`). `check:meta` doesn't catch it.
- A DatePicker test timed out once under load and passed when rerun alone.

**Next**
- Commit, run `node evals/setup.mjs --clean`, then the 100 runs.

---

## 2026-09-27 (registry, icons, hydration) — `pnpm registry` passes; icons flip under RTL; component pages hydrate

**Changed**
- `packages/react/scripts/build-registry.mjs`: `buildBlockItems` rejected every `@strata/*` import, so the 7 blocks that import `@strata/icons` were skipped and the build exited 1. Components never failed because `importProblems` already exempts `@strata/icons` (ADR-014). Blocks now get the same exemption: the package is added to the item's `dependencies`. Other `@strata/*` imports are still errors.
- `packages/react/CONVENTIONS.md`: the allowed-imports line lists `@strata/icons` instead of `@tabler/icons-react`.
- Tabler selectors replaced in `button`, `link` and `toggle-group` CSS. They matched Tabler's class names, which `@strata/icons` doesn't render, so two rules were dead:
  - The RTL flip for arrows and chevrons only worked with `data-directional`. It now matches `[data-strata-icon^='arrow']` and `[data-strata-icon^='chevron']`. Not yet checked in a browser.
  - The icon stroke rule now matches `[data-strata-icon]`. ThemeScope already applied the same value, so nothing looked different.
- `button.test.tsx`: the pending test looked for `.tabler-icon-plus`, which could never be there, so it passed without testing anything. It now looks for `[data-strata-icon="plus"]`.
- Comments that described Tabler behaviour in `button.tsx`, `button.module.css`, `link.module.css` and `badge.module.css` now describe `@strata/icons`. `steps.tsx` and `checkbox.tsx` still credit Tabler for their path geometry, which is accurate.
- Icon stroke is 1.5 everywhere. CONVENTIONS "Icons match text" said 1.75 and cited Tabler; it now names the token. The 1.75 fallbacks in `chip` and `eyebrow` CSS are 1.5 (the token is always set to 1.5, so nothing looked different). Two places did render at 1.75 and now follow the token: the portfolio block's next-step icon and the file icons in docs code blocks.
- Hydration fix brought over from the `infallible-merkle-6dffef` worktree, where another session wrote it:
  - Cause: the component page (a server component) rendered `Tabs`, `TabList`, `Tab` and `TabPanel` directly. React Aria chose the default tab from a collection that was still empty, so the server HTML had no selected tab and no panel, and hydration threw React error 418.
  - Fix: the new client component `apps/docs/components/docs/install-tabs.tsx` creates the tabs; the page passes only the panel contents. No change to the Tabs component.
  - New `scripts/check-ssr-tabs.mjs` fails when a prerendered page has a tab list without a panel. It is step 8 of `/verify` and runs in CI after the build.
  - Tabs meta: one Do and one Don't about server components.
- Registry build: a `workspace:*` dependency is written as the package's own version (`@strata/icons@^0.1.0`). Also from that worktree.
- Accordion: closed panels in server-rendered HTML are `display: none` again. The panel's `display: grid` beat the browser's `[hidden]` rule, so until React Aria mounted, links inside a closed panel could take keyboard focus while invisible. Found by running axe on `/blocks` with the site's scripts blocked.

**Decided**
- Fix the hydration error in the docs page, not in Tabs — **Claude** (pending Anuj), as the other session recorded it.
- The Accordion finding is a real fault, not a false one as the showcase-card entry calls it: without the fix a keyboard user can tab into hidden links before hydration, or for good if scripts fail — **Claude** (pending Anuj). The Meter finding in the same state is false: `role="meter progressbar"` is valid ARIA that axe-core 4.13 rejects.
- Icon stroke is 1.5, as ADR-014 says, not the 1.75 in CONVENTIONS — **Anuj**.
- Treat `@strata/icons` in blocks the way components already treat it — **Claude recommended, Anuj accepted**. Not a design trade-off: it applies ADR-014 to a check that was missed when Tabler was replaced. The registry stays internal (ADR-011 revision).

**Results**
- `pnpm registry`: exit 1 with 7 errors, 64 items → exit 0, 71 items (7 blocks `ok`).
- `pnpm check:meta`: 53/53 components pass, exit 0.
- Both were run in the main checkout on `v0.3-craft` (c2305fe) with the uncommitted Phase 4 changes in place.
- `/verify` in the main checkout, after all of the above:
  - `pnpm typecheck`: clean.
  - `pnpm test`: 443 components · 219 engine · 245 icons · 8 codemods, all passing (components re-run after the Accordion fix: 443 / 443).
  - `pnpm test:themes`: 118,000 / 118,000 checks; 2,000 / 2,000 chart palettes; adjustments per brand median 4, max 7.
  - `pnpm check:meta`: 53 / 53; 18 alpha · 35 beta · 0 stable.
  - `pnpm registry`: 71 items, exit 0.
  - `NEXT_DIST_DIR=.next-verify pnpm --filter @strata/docs build`: 80 pages.
  - `NEXT_DIST_DIR=.next-verify node scripts/check-ssr-tabs.mjs`: 79 pages, 323 tab lists, 0 pages with a tab list missing its panel.
  - `STRATA_BASE_URL=http://localhost:3021 node scripts/axe-sweep.mjs` against `next start -p 3021`: 105 routes × light/dark, 0 violation nodes, 0 page errors.
- Before the hydration fix the sweep gave 40 page errors (#418 on 20 component pages × 2 schemes) and 8 violation nodes on `/blocks`. The 8 appear only when axe runs before hydration: 1 run in 18 under load, every run with the site's scripts blocked. After the Accordion fix that state gives 1, the Meter false finding.
- Screenshots (`node scripts/shoot.mjs`, playground and the built site), looked at one by one: arrows in Button and Link point left under Qamar RTL and right under Vela; the portfolio block's next-step icon and the code block file icons read clearly at the 1.5 stroke.

**Next**
- `@strata/icons` is not on npm, so a registry install that needs it would still fail. Only matters if the registry is published again.
- `Tabs` rendered straight from a server component without `defaultSelectedKey` can fail the same way in any Next.js app. Not yet reported to React Aria.
- The docs header's search button shows its icon off-centre at 390px in dark mode.
- The `infallible-merkle-6dffef` worktree can be discarded once Anuj has checked nothing else in it is wanted.

---

## 2026-09-27 (Phase 4) — governance, and the first deprecation done end to end

**Changed**
- `GOVERNANCE.md`: who decides what, how a change gets in, the four outcomes (extend, vary, add, override), versioning and deprecation, agent trust levels. It says which rules a script enforces and which nothing enforces yet. `CONTRIBUTING.md` is no longer the Phase 0 stub.
- RFC flow: `docs/rfcs/000-template.md`, RFC-001, two issue templates and a pull request template.
- Button: new `tone` (`neutral` | `danger`) on `primary`, `outline` and `ghost`. `variant="danger"` is deprecated; it renders exactly as before (`data-variant="danger"` included) and warns once in development. AlertDialog uses the new prop. New `button-tone` example.
- Deprecations are records: `Deprecation`, `PropDoc.deprecated` and `PropDoc.deprecatedValues` in the meta schema. `pnpm check:meta` checks them (every field, removal is a later major, the codemod and RFC exist). Component pages show them.
- New package `@strata/codemods` with `button-variant-danger-to-tone` and a CLI. It was run on `apps/` and `packages/react/test`: 3 usages rewritten, 3 places reported for a person to read (all three turned out to need no change).
- The settings block had a local override that made an outline button look destructive. It now uses `variant="outline" tone="danger"`, and the override's CSS is gone.
- Engine: the four `feedback.*.fg` roles are also solved on `surface.canvas` and `surface.raised`. No token value moved; tenants still need 3 adjustments each (`pnpm tokens`).
- Docs: governance and changelog pages; the decision list no longer shows raw `**` marks or clipped text.
- CI runs `pnpm check:meta`. `scripts/axe-sweep.mjs` takes `STRATA_BASE_URL`. README numbers, repo map and roadmap brought up to date.

**Decided**
- `variant="danger"` → `tone="danger"`, not `tone="critical"` as the brief said: twelve components and the tokens already say `danger` (RFC-001, ADR-021) — **Claude recommended, Anuj accepted**.
- `tone` works on primary, outline and ghost — **Claude recommended, Anuj accepted**.
- Deprecated APIs are removed at 1.0.0 only, never in a 0.x minor — **Claude recommended, Anuj accepted**.
- The exported `ButtonVariant` type keeps `'danger'` until 1.0.0, because narrowing it would break code typed with it — **Claude**.
- No `@deprecated` tag on the `variant` prop: it would strike through every use of the prop, not only the one value — **Claude**.
- A codemod stays quiet about a choice between literals when none of them is `danger` — **Claude**.

**Results** (measured 2026-09-27, before the Card and StatTile work that another session has in progress in this checkout)
- `pnpm typecheck`: clean.
- `pnpm test`: 435 components · 219 engine · 245 icons · 8 codemods, all passing.
- `pnpm test:themes`: 118,000 / 118,000 checks, 118 per brand (was 102); 2,000 / 2,000 chart palettes; adjustments per brand median 4, max 7.
- Danger label contrast on outline and ghost buttons, worst case over 5 tenants and 1,000 fuzz brands, light and dark: 6.10:1 on `surface.selected`, 6.18:1 on `feedback.danger.bg` — `pnpm --filter @strata/react exec vitest run test/button.test.tsx -t "contrast proof"`.
- `pnpm check:meta`: 53 / 53; 18 alpha · 35 beta · 0 stable.
- `pnpm --filter @strata/docs build`: 80 pages.
- `STRATA_BASE_URL=http://localhost:3010 node scripts/axe-sweep.mjs`: 105 routes × light/dark, 0 violation nodes.
- **Failing, and already failing at commit 31cde5d:**
  - `pnpm registry`: 7 errors, all blocks that import `@strata/icons`. Fixed later the same day; see the registry entry above.
  - The production docs build logs React error #418 (hydration) on 20 component pages in both schemes. The mismatch is in the Installation tabs. Confirmed by building 31cde5d in a separate worktree.
  - Both are being fixed in separate sessions.

**Phase 4 review (Anuj, 2026-09-27): accepted**
- The outline danger button keeps its red border at rest — **Anuj** ("yes to all"; Claude read that as keeping what was built).
- Review times in `GOVERNANCE.md` §3 — **Claude proposed, Anuj accepted**.
- `CLAUDE.md` Status brought up to date — **Anuj** approved the edit.

**Next**
- Phase 5 as widened by ADR-018: MCP server, drift auditor with autofix, per-model agent eval, root `AGENTS.md`.

---

## 2026-09-27 (maturity) — written criteria for alpha, beta and stable; every component re-checked

**Changed**
- Governance page: new "Maturity" section with the criteria and how each is checked. Alpha (the floor) = complete meta, a test file, keyboard tests when meta lists keys, ≥3 examples, axe 0 light + dark, renders in all five tenants. Beta = alpha + used in a block or the homepage showcase + a person decides the API is settled (then it changes only by deprecation). Stable = beta + published on npm + a dated manual accessibility review (`review.a11y`) + production use + one release without a breaking change.
- `pnpm check:meta` enforces the automatable criteria: a declared beta/stable that misses one is an error; an alpha that misses the floor is a printed note (nothing lower to move it to); stable is rejected while `@strata/react` is unpublished (`PUBLISHED_ON_NPM` in the script). New optional `review.a11y` meta field (a date, only for a real review).
- The component page badge is now a link to the criteria with a tooltip on hover and focus; /docs/components shows a legend with counts per level read from meta.
- Maturity before → after (`pnpm check:meta`): 13 alpha · 40 beta · 0 stable → 18 alpha · 35 beta · 0 stable. 15 beta → alpha (not used in a block, <3 examples, or no keyboard test); 10 alpha → beta (used in blocks, criteria met). Sidebar (being rebuilt) and Chip (new today) meet the beta checks but stay alpha.

**Decided**
- Criteria and the automated checks — **Claude recommended, Anuj accepted** the direction ("Explain + define rules").
- The manual accessibility review sits at stable, not beta: none has happened yet, and axe/keyboard tests are automated checks, not a review — **Claude** (pending Anuj).

**Next**
- Close the alpha-floor gaps `pnpm check:meta` lists: a third example for Accordion, Chart, Command, Kbd, Popover, Separator, Sheet and Spinner; tests and examples for ThemeScope; a keyboard test for FileUpload.
- Anuj: a real screen-reader review, recorded in `review.a11y`, before anything is proposed for stable.

---

## 2026-09-27 (research) — differentiation, mobile story, Hindi tenant

**Changed**
- New `docs/research/2026-09-27-differentiation.md`: four research passes (component libraries, theme generators, AI tooling, Indian consumer companies) with sources and a verification level on every claim.
- ADR-018, 019 and 020 written.
- BRIEF: §2 non-goal (no native components), §5 brand fidelity, §9 autofix, §10 widened eval, new §10a mobile reach, §13 Phase 5a.
- Docs only. No code, tokens or components changed.

**Decided**
- Position Strata on published evidence; widen Phase 5 with a per-model eval, a brand fidelity metric and auditor autofix (ADR-018) — **Claude recommended, Anuj accepted**.
- Mobile story is a server-driven UI schema plus native token export, not native components (ADR-019) — **Claude recommended, Anuj accepted**. Claude first recommended a native Compose slice and changed that after the research.
- Add a Hindi tenant with per-script type tokens (ADR-020) — **Claude recommended, Anuj accepted**.

**Results**
- None. The research contains no Strata-measured numbers, and its figures must not appear on the site as Strata metrics.

**Open for Anuj**
- Hindi tenant: name, industry and six brand inputs; who reviews the Hindi copy.
- Eval: which models to run, and the new run cap.
- Native token exporter: own code or Style Dictionary downstream (ADR-001 revisit).

**Next**
- Phase 4 (governance) is unchanged and still next. Then Phase 5 as widened, then Phase 5a.
- Follow-ups in the research file, §7: Untitled UI React in depth; live job descriptions; the legal sources at first hand.

---

## 2026-09-27 (close) — every ADR decided

**Decided**
- ADR-001, 005, 006 and 009 accepted — **Claude recommended, Anuj accepted**.
- ADR-007, 012 and 016 accepted — **Anuj delegated the call** ("do whatever is correct"). Claude accepted them because each is built and verified: check:meta 52/52, overlay tests, and the dataviz validator plus 2,000 fuzz palettes.
- ADR-008 accepted as the Phase 5 plan — **Anuj**. Enforcement arrives with the MCP server and drift auditor.
- ADR-010: Anuj is on the **Figma Starter** plan (one mode per collection), so a single-mode Figma export was added. See the ADR.

**Changed**
- A responsive sweep of all 52 component pages at 320/390px found three real overflows, now fixed:
  - the chart's hidden table widened the page at 320px (browsers ignore width: 1px on tables, so it now sits in a clipped wrapper);
  - the icon-tile sizes example didn't wrap;
  - the sidebar examples' wrappers didn't shrink.

---

## 2026-09-27 (night) — Using colour page, toast reference, surface recipe

**Changed**
- New /docs/color "Using colour": roles by job with live swatches, and a safe-pairs matrix generated from contrast-pairs.json with the worst ratio across tenants. Rules with reasons for brand colour, status, charts, glass/gradients/tints and fields. Live do/don't. How to check your own pair.
- The matrix found **focus.ring on surface.selected at 2.97:1 (Care dark)**, which was unguarded. Added it to contrast-pairs.json, and `text.brand` on `surface.selected` too (it had been passing by luck at 4.82). Now 102 checks per brand; the solver lightens Care's dark ring to #90b7ff (7.2:1).
- Engine: `--strata-sheen` (dark: a 115° band peaking at 8% text.default; light: none). text.subtle stays ≥ 6.86:1 at its brightest pixel over tenants and fuzz (test).
- Toast and Alert rebuilt to Anuj's toast reference:
  - sheen, hairline and rim; filled status icons (shape `feedback.*.fg`, knockout `feedback.*.bg`, worst 6.09:1; `solid` failed 3:1 in three places);
  - icon | title and description | one action; action weight by severity (`contrast` for danger/warning).
  - `@strata/icons` gains 6 filled status icons (243 total).
- The surface recipe is applied to card, stat-tile, data-table, empty-state, popover, menu, the select/combobox listboxes, date-picker, dialog, sheet and command. On glass, the face is +8 points more opaque so text stays ≥ 4.72:1 (test in popover).
- Docs: the site's dark scope copies every scheme-dependent variable (diffed, not a prefix list). Before this, sheen, rim, glow and glass never switched to dark in previews.

**Decided**
- Toast pattern from Anuj's reference, applied system-wide — **Anuj**.
- Sheen on glass with the +8 opacity offset — **Claude** (proof in tests).

**Results**
- `pnpm test`: react 389, engine 210, icons 243; typecheck clean; `pnpm check:meta` 52/52.
- Fuzz: 102,000 / 102,000 checks, all invariants valid — `pnpm test:themes`.

---

## 2026-09-27 (late) — charts, app shell, 235 icons, KYB web rebuild, soft fields

**Changed**
- Engine: a chart palette solver (`src/chart.ts`, ADR-016). Series 1 keeps the brand hue in the validator's band; series 2–4 are fixed-order hues. It checks band, chroma ≥ 0.1, 3:1, CVD ΔE ≥ 8 and normal-vision ΔE ≥ 15. Rim light and glow tokens. DTCG leaves: 339.
- Components:
  - AreaChart/LineChart/BarChart/Sparkline and a shared `chart` toolkit (no library; monotone-cubic; a keyboard ListBox hit layer; a table view);
  - Sidebar, IconTile, Card `feature`/`rim`/`stars`;
  - fields in the soft-outline style (ADR-017) with sm/md/lg sizes shared with Button;
  - a clearer segmented selection (and a StrictMode fix: the pill ended hidden under `next dev`);
  - CardTitle at 600;
  - x labels thinned by pixel distance.
- `@strata/icons`: 235 icons (health, commerce, media, travel and system domains added).
- Care is re-based on the KYB **web** prototype (ADR-015 revision). `benefits-overview` replaces `benefits-home`. New `portfolio` block (dark fintech, with Anuj's five references as the bar). The homepage showcase is rewritten as a bento of product moments.

**Decided**
- KYB = the web prototype — **Anuj**.
- Soft-outline fields, still AA — **Claude recommended, Anuj accepted** (ADR-017).
- The chart palette is solved per brand — **Claude recommended, pending Anuj** (ADR-016).

**Results**
- `pnpm test`: react 378, engine 209, icons 237; typecheck clean; `pnpm check:meta` 52/52.
- Fuzz: 98,000 / 98,000 contrast checks and 2,000 / 2,000 chart palettes pass — `pnpm test:themes`. The dataviz validator reports ALL CHECKS PASS for 5 tenants × 2 schemes.
- Field boundary ≥ 3.17:1 worst case (light, on sunken) over tenants and 1,000 fuzz brands — `test/text-field.test.tsx`.

**Next**
- Anuj: confirm ADR-012 and ADR-016; deploy to Vercel.
- Open questions from agents:
  - a meter pair on `action.primary.bg` (the solid KYB wallet);
  - portfolio's block-level dark surface tint;
  - a `triggerClassName` on AccordionItem;
  - PersonChipGroup trailing tags;
  - calendar day decorations.

---

## 2026-09-27 (evening) — own icons, editorial voice, Care tenant, Geist

**Changed**
- `@strata/icons` (ADR-014): 95 curvy, minimal icons drawn to one spec (24 grid, 1.5 stroke, `--strata-icon-stroke`). Tabler is replaced everywhere except the GitHub and React logos (official marks, docs only). `pnpm --filter @strata/icons sheet` renders the review sheet.
- Editorial voice (ADR-015):
  - engine: `editorial` type pair (Fraunces with italics and optical size, DM Sans, DM Mono), `paper` neutral, `--strata-font-tracking-caps`, `--strata-icon-stroke`;
  - components: Eyebrow, Amount, Meter, Tag, PersonChip/PersonChipGroup, Avatar `tint="auto"` and placeholders, and `<em>` as the brand italic in headings.
- **Care** tenant (sage/coral, paper, round, editorial; built from Anuj's KYB prototype language, with no client names) and a `benefits-home` block that rebuilds the KYB home screen.
- Engine contrast pairs added: `text.subtle` on `surface.selected`, `text.brand` on `surface.sunken`, and `feedback.*.fg` on `surface.sunken`. That makes 98 checks per brand (was 86).
- House font is now **Geist** (new `modern` pair), chosen by Anuj from a side-by-side of the free fonts that premium product sites ship. Measured with Playwright on the live sites: Linear/Raycast use Inter, Vercel uses Geist, GitHub uses Mona Sans, and 21st.dev uses General Sans; Stripe, Apple, OpenAI, Anthropic and Figma use proprietary fonts.
- Tenant cards on /docs redesigned as brand specimens. Settings, sign-in, request-flow and activity-table brought up to the dashboard's level.
- Meter: axe-core rejects React Aria's `role="meter progressbar"`, so the element gets `role="meter"` once mounted.
- `scripts/launch-browser.mjs`: the repo scripts fall back to the installed Chrome when Playwright's bundled Chromium is missing.

**Decided**
- Own icon set, "curvy and minimalistic" — **Anuj** (ADR-014).
- Editorial capability, plus Care and a KYB block as the proof — **Claude recommended, Anuj accepted** (ADR-015).
- Geist for the house brand — **Anuj**.
- Avatar auto-tints never pick danger — **Claude** (agent call).

**Results**
- `pnpm test`: engine 171, react 316, icons 97, all passing; `pnpm typecheck` clean; `pnpm check:meta` 46/46.
- Fuzz: 98,000 / 98,000 checks, all invariants valid (including glass) — `pnpm test:themes`.
- axe: 0 violations on the blocks (5 tenants × light/dark), meter and benefits-home (agent sweeps, Chrome channel).

**Next**
- Anuj: confirm ADR-012; deploy to Vercel.
- Wider-screen RTL check of benefits-home tip cards; a stethoscope/pill icon for health tenants; the Care wallet card in dark mode is `surface.inverse` (light), which is worth a look.

---

## 2026-09-27 — shadcn removed from the product; tactile restyle; finesse pass started

**Changed**
- No shadcn anywhere users look: docs site, Brand Generator and README. Install is npm or copying the source. `/r/*.json` is no longer served, `pnpm registry` writes to `packages/react/registry/` (gitignored), and the Registry docs page was deleted. The engine's shadcn exporter stays as internal code. `@strata/tokens` now ships `dist` (`files`).
- Engine tokens:
  - motion: `duration-slow`, `easing-out`, and a damped spring (stiffness 400, damping 28) sampled into `linear()`, which settles in 402ms;
  - elevation: `shadow-highlight`;
  - glass: `glass-bg`/`blur`/`opacity`, with the opacity *solved* per scheme;
  - finesse: radii retuned (sharp 6/6/10/4, soft 10/10/16/6, round pill/14/22/pill), softer layered shadows, `--strata-hairline` (0.5px on 2× screens), and `--strata-font-tracking-*` (Inter dynamic-metrics curve, 0 for Arabic pairs).
- DTCG leaves: 325 (was 316). The spring easing and tracking are CSS-only.
- Tactile restyle of all 41 components and the site, in parallel by owner group:
  - spring press, sliding `SelectionIndicator` (tabs, toggle group), drawn checkmarks;
  - glass overlays (select/combobox/date-picker listboxes, dialog, sheet, menu, popover, command, toast) and a glass site header;
  - card lift, skeleton shimmer, eight-spoke spinner.
  Spec: CONVENTIONS "Tactile style" and "Finesse".
- Fixes found along the way: the glass token pointed at a variable that doesn't exist (a new test now catches dangling `var()`s); calendar SSR/CSR heading mismatch (ICU range-dash spaces); the two-month calendar example had no fixed date; progress value order in RTL; avatar-group initials clipping.

**Decided**
- Remove shadcn from everything users see (ADR-011 revision) — **Anuj**.
- Direction "tactile modern", references Linear/Apple/Vercel/Raycast, all components at once — **Anuj**. Glass only on floating layers and sticky chrome — **Claude recommended, Anuj accepted**.
- Finesse inspired by macOS + visionOS, not copied (ADR-013) — **Anuj**.
- Glass opacity solved, not picked: the lowest opacity where `text.default`/`text.subtle` reach 4.5:1 over black *and* white backdrops — **Claude**.
- Modal underlay dims (`brightness(0.6)`) instead of an inverse tint; pagination fades instead of sliding (jsdom lacks `getAnimations`); the toggle pill may animate width — **Claude** (agent calls accepted by the lead).

**Results**
- `pnpm typecheck` clean. Tests: 162 engine + 277 component — `pnpm test`. `pnpm check:meta` 41/41.
- Fuzz: all invariants valid, including glass text ≥ 4.5:1; adjustments median 4 — `pnpm test:themes`.
- Glass opacity across the 1,000 fuzz brands: light 0.83–0.84, dark 0.80–0.81 (scratch script over `fuzzInputs()`).
- axe: 0 violation nodes across 72 routes × light/dark — `scripts/axe-sweep.mjs` (run with system Chrome because Playwright's headless shell isn't installed).

**Changed (later the same day, after Anuj's reviews)**
- Rounder radii (sharp 8/8/12/6, soft 12/12/20/8, round pill/18/28/pill); card inset 28/20, compact row 40; display sizes `4xl`/`5xl` (DTCG 327).
- Visible motion (Anuj: "there is no motion"). Pass-1 motion was too subtle to notice; his Mac doesn't have Reduce Motion on.
  - Components: hover lift, spring press to 0.96, pops on state change, halo grows, content fades up, and list rows stagger in.
  - Site: the hero builds in, CSS scroll reveal, card hover lift, and block entrances.
  - Measured frame by frame in Chrome; with reduced motion everything is visible and nothing moves.
- 21st.dev-inspired pass:
  - Button `variant="contrast"` and a taller `size="lg"`; Badge `variant="status"` (dot + words); CardContent `variant="inset"`.
  - Calm alerts on raised surfaces.
  - The dashboard rebuilt with these.
  - Homepage: a token-driven hero glow that follows the tenant, the accent "Every brand." (gated at ≥ 4.5:1 against the glow), inverse pill CTAs, a floating showcase stage, and one card radius and gap throughout.

**Results (end of day)**
- Tests: 162 engine + 280 component; typecheck clean; `pnpm check:meta` 41/41.
- axe: 0 violation nodes, 72 routes × light/dark, no page errors.

**Next**
- Anuj judges the dashboard and homepage passes. Then roll the same treatment out to the other 4 blocks, the component docs pages and the remaining components.
- Engine candidates:
  - `surface.inverseHover` (the contrast hover is measured at ≥ 14:1, not solved);
  - `feedback.success.fg` on `surface.sunken` (so money-in amounts can be green again);
  - `text.subtle` on `surface.selected`.
- Playwright's bundled Chromium isn't installed on this Mac; agents used `channel: 'chrome'`. Add that fallback to `scripts/*.mjs`.
- Open design questions: a danger hover/pressed token (the button uses an outer glow for now), halo tokens for focus/slider glows, `ease-in-out` as a token, and subtle text on `surface.selected` (not a solved pair yet).
- English example copy inside RTL tenants shows punctuation at the wrong end (e.g. ".Your card was declined"); set `dir="auto"` on user text or use tenant copy.
- Still waiting on Anuj: confirm ADR-012; deploy to Vercel.

---

## 2026-09-27 — ADR-006: button labels match across light and dark

**Changed**
- Theme engine: dark mode now tries the light-mode label first on solid fills and moves the dark fill up to ΔL 0.12 so it passes. It never undoes the dark visibility lift. `resolveRoles(scheme, ramps, lightRoles?)`; `generateTheme` passes light roles into dark. Two new tests in `test/theme.test.ts` (pure red, orange/navy).
- Pure red: `#ec0000` + white labels in both schemes (was `#ff0000` + ink in dark).
- Dev setup: pnpm linked via `corepack enable --install-directory ~/.local/bin pnpm` (no sudo on this Mac). Added `.claude/launch.json` (docs on :3000).

**Decided**
- Same button label in both schemes, deepen the dark fill (ADR-006 open question) — **Claude recommended, Anuj accepted**.

**Results**
- Tests: 159 engine + 271 component, all passing — `pnpm test`; `pnpm typecheck` clean.
- Fuzz: all checks pass, invariants valid, adjustments median 4 (unchanged) — `pnpm test:themes`.
- Brands whose labels differ between schemes: 95 → 0 (primary), 102 → 0 (accent) of the 1,000 fuzz brands (scratch script over `fuzzInputs()`).
- Dark fill moved to match: 10.9% of brands (primary), 11.5% (accent) — `pnpm test:themes` report.

**Next**
- Anuj: confirm ADR-012; deploy docs to Vercel.
- Verify the other-systems comparison in ADR-006 against current docs before quoting it publicly.
- Then Phase 4.

---

## 2026-09-26/27 — v0.2: shadcn-level component library, docs site, registry

**Changed**
- `@strata/react`: 41 components on React Aria + CSS Modules, each with a meta.json, tests and docs examples (136).
- `apps/docs`: Next.js 16 site themed by Strata itself. It has component pages (live Preview/Code per tenant, scheme, direction and density; install tabs; API; accessibility; tokens), Blocks (5), Themes (the generator rebuilt with Strata components), Colors, and ⌘K search.
- Registry: 55 shadcn-schema-valid items (components, blocks, token files, `theme-<tenant>` bridge items, `@strata/strata` base). Verified with shadcn CLI 4.21 through URL installs, namespaced installs and dependency resolution.
- npm build: Vite library mode with `preserveModules`; `'use client'` kept; `dist/styles.css`; types verified with bundler and nodenext resolution.
- Engine: `toShadcnCssVars` / `toShadcnCSS`. Feedback text is now checked against selected rows too (86 checks per theme), and feedback text is a step deeper, so the solver still never touches the system palette.
- Built by parallel agents (5 component owners, docs, registry, blocks, home, themes). Every change was integrated, reviewed and verified by the lead.

**Decided**
- Distribution: npm + shadcn-compatible registry from one source (ADR-011) — **Anuj**.
- Docs framework: Next.js App Router + MDX (ADR-004 accepted) — **Anuj**.
- Scope: ~30 core components + full site this round — **Anuj**.
- Overlays copy their scope's attributes; ThemeScope owns the locale (ADR-012) — **Claude recommended**, Anuj to confirm.
- House brand `tenants/house/brand.json` (#18181B, monochrome) so tenant colours are the only colour on the site — **Claude**.
- Registry token selector `:root, [data-strata-theme="<id>"], [data-strata-scheme]:not([data-strata-theme])` — **Claude**.
- Docs examples use fixed dates so static pages hydrate identically on any day — **Claude**.

**Results**
- Tests: 271 component + 157 engine, all passing — `pnpm test`.
- Fuzz: 86,000 / 86,000 checks; adjustments median 4 — `pnpm test:themes`.
- axe: 0 violations across 73 routes × light/dark — `node scripts/axe-sweep.mjs`.
- `pnpm check:meta` 41/41; `pnpm registry` 55 items.

**Known gaps (next wave)**
- shadcn bridge: `--destructive` used as *text* reaches ~4.4:1 (light) / ~4.1:1 (dark), and `--primary` as text isn't guaranteed. Documented on /docs/registry.
- `feedback.danger.hover` token requested by C1 (the danger button hover uses a blend workaround).
- Dialog close label and a few TextArea announcements are English-only; FileUpload now takes `strings`.
- Not yet on npm; the registry URL must be set at deploy (`NEXT_PUBLIC_SITE_URL`).

**Next**
- Anuj: review the site locally (`pnpm --filter @strata/docs dev`), confirm ADR-012, deploy the docs to Vercel.
- Then Phase 4 (governance + deprecation demo) and Phase 5 (MCP + drift audit + agent eval).

---

## 2026-09-26 — Phase 0 + Phase 1 started

**Changed**
- pnpm monorepo scaffold: `packages/theme-engine`, `packages/tokens`, `apps/generator`, `tenants/{vela,harbor,qamar}`.
- Phase 1 in progress: OKLCH ramps, contrast solver, exporters (CSS, DTCG, Figma), tenant brand + content files, Brand Generator v0 with one preview screen.
- ADR template + ADR-001…010 drafted.
- README, CLAUDE.md, CONTRIBUTING, CI workflow, Changesets config, `pnpm screenshots` (Playwright + axe).

**Decided**
- Repo built in the cloud, then saved to `~/projects/strata` — **Anuj**.
- Headless primitives: React Aria Components (ADR-002) — **Anuj**.
- Styling: CSS Modules + CSS custom properties (ADR-003) — **Anuj**.
- TypeScript pinned to 5.9, not 7.0, for tooling compatibility — **Claude**.
- Tenants Vela / Harbor / Qamar and their fictional product names — **Claude**, from the brief.
- Feedback palette retuned (success L 0.53, info L 0.55) and given preferred labels (warning = ink, others = white) so the solver log only shows brand-driven changes — **Claude** (ADR-006).
- Secondary button labels start at primary.12 in light mode (step 11 failed on the pressed fill for 82% of brands) — **Claude**.
- Mid-tone fills where neither label passes: deepen the fill and keep white labels if ΔL ≤ 0.12 — **Claude**.
- Figma export: one brand-moded "Brand" collection (ramps + resolved roles) with Semantic Light/Dark files identical across tenants; the build fails if they ever differ — **Claude recommended**, pending Anuj (ADR-010).
- Preview screen in the generator renders as an embedded region with headings shifted down a level (no nested `<main>`, one h1) — **Claude**.
- Awaiting Anuj: ADR-001, 004, 005, 006, 009, 010 (Claude recommended). ADR-007 and 008 are for Phases 2 and 5.

**Results**
- Theme fuzz: 1,000 brands, 78,000 / 78,000 checks pass; median 0.42 ms per theme; adjustments per brand median 4 (was 12 before retuning) — `pnpm test:themes`.
- Tenants: Vela, Harbor, Qamar each 78/78 checks, 3 adjustments, 316 tokens — `pnpm tokens`.
- Tests: 132 passing across engine + exporters — `pnpm test`.
- axe (wcag2a/aa, 2.1 a/aa, 2.2 aa): 0 violations on 6 preview pages — `pnpm screenshots` (run here with `STRATA_LOCAL_FONTS`, since the build sandbox can't reach Google Fonts).

- Hosted demo: single-file build (`pnpm --filter @strata/generator build:single`) published as a private claude.ai page; Download is hidden there (the host sandbox blocks page-started downloads), Copy stays; `#vela` / `#harbor` / `#qamar` deep-link a tenant — **Claude**.

**Open questions for Anuj**
- Pure-red brands get white labels in light mode but ink labels in dark (ink already passes there). Match the schemes by deepening the dark fill, or keep the brand exact? (ADR-006)

**Next**
- Phase 1 review with Anuj: screenshots in `docs/screenshots/phase-1/`, fuzz report, pending ADRs.
- Then Phase 2: components.

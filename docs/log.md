# Syntara — build log

One entry per session, newest first. Three headings: **Changed / Decided / Next**.
Every decision names who made the call: **Anuj**, **Claude recommended, Anuj accepted**, or **Claude** (pending Anuj's review).
Numbers only with the command that produced them. Design trade-offs get an ADR in `docs/adr/`.

---

## 2026-09-29 (process) — the branch was fifteen commits stale, and the same bug had two answers

Mostly repair of how this repo is being worked on, not new work. Anuj asked for a read on the process; the read found a
concrete cost, so this entry is the cost and the fix.

**Changed**
- `v0.3-craft` was **15 commits behind `origin/main`** and had an uncommitted tree built on that stale base. It is now
  fast-forwarded to `origin/main`; the work here is on `fix/avatar-grapheme-fallback`, a branch off its tip.
- The stale tree is preserved unmerged on `wip/haat-hindi-copy` (commit `53b0a95`). It held three unrelated things: a
  rewrite of Avatar initials, a rename of the Haat persona रेखा → नेहा across the tenant and two blocks, and a broad revision
  of Haat's Hindi copy. Nothing was discarded and nothing was merged.
- **Ported forward, and only this:** where `Intl.Segmenter` is missing, `getInitials` approximates a grapheme cluster
  with a regular expression instead of taking the first code point. The old fallback took one half of a flag and dropped
  a decomposed accent. `packages/react/src/ui/avatar.tsx`, one new constant and one changed line.
- `docs/adr/032` records Anuj's call and the alternative it beat; `packages/react/meta/avatar.meta.json` now states the
  Brahmic rule, which it had not.

**Decided**
- **Initials stay the base letter, रय — Claude recommended, Anuj accepted.** ADR-032 had flagged this as the rule to
  overrule; a second session, working from the stale base and not having seen the ADR, independently shipped the
  opposite (one syllable, रे). रय stands: a lone रे at avatar size is the rupee sign. Dropping the marks also makes
  conjunct splitting harmless, where keeping the syllable whole needs the virama halves rejoined by hand.
- **The Haat persona keeps the name रेखा — Claude recommended, Anuj accepted.** Renaming her to नेहा would have made the
  initials fault invisible in the demo without fixing it, and रेखा यादव is the name ADR-032's rule is tested against.
- **Haat's Hindi copy revision is not merged — Claude.** It is an area already waiting on Anuj's review, and it arrived
  mixed into a defect fix. It waits on `wip/haat-hindi-copy` as its own thing.

**Results**
- `pnpm test`: **1,453 passing, 1 skipped** (474 components · 309 engine · 245 icons · 193 MCP · 150 schema · 74 auditor
  · 8 codemods). Three of the component tests are new, in `describe('getInitials without Intl.Segmenter')`.
- The new tests are a real regression test, not a restatement: with the first-code-point fallback put back,
  `pnpm --filter @syntara/react exec vitest run test/avatar.test.tsx` fails 1 of 19. The Brahmic cases pass either way,
  which is the point — ADR-032's answers do not depend on the fallback.
- `pnpm typecheck`: clean, 11 packages. `pnpm check:meta`: exit 0, avatar `ok`.
- Not re-run, because nothing here can move a pixel or a route: `test:themes`, `registry`, the docs build and the axe
  sweep. `origin/main`'s own numbers for those stand in the entry below.

**Found by measuring, not fixed**
- **16 commit messages appear 2–3 times** across the branches, under different hashes — the same work committed more
  than once by sessions that could not see each other. The reflog also shows two commits made on `v0.3-craft` on
  2026-09-29 and then dropped by a reset; both survive elsewhere.
- **ADR-030 is allocated twice:** `030-static-export-on-cloudflare.md` on `main` and `030-duotone-icon-layer.md` on
  `origin/feat/duotone-icons`. It will collide when duotone merges. Not renumbered here — it is that branch's to fix.
- `scripts/compare-renders.mjs` (untracked, from the stale tree) cites "ADR-030" for before/after pixel evidence. No
  such ADR exists under that number or any other; the script is real and the decision it refers to was never written.
- Nine branches existed, three with deleted remotes, and six worktrees, two of them in `/private/tmp` scratchpads that
  a reboot would take. Pruned in this session.

**Next**
- Anuj: confirm with a Hindi reader that रय reads as initials rather than as an abbreviation — the one part of ADR-032
  still resting on Claude's judgement.
- Anuj: `wip/haat-hindi-copy` needs a read. The copy changes may well be improvements; they were never reviewed.
- Whoever picks up duotone icons: renumber its ADR before merging.

---

## 2026-09-29 — a still of every component on the index

**Changed**
- `/docs/components` cards now open with a still of the component: the same example the component's own page leads with, rendered live into a stage above the title. New `apps/docs/components/preview/example-thumb.tsx` + `.module.css`.
- The still is the /blocks thumbnail technique at a gentler ratio: the canvas lays out a quarter wider than the stage and is drawn back at the stage's width, so a switch reads at close to its real size while a table or a calendar gets room to lay out and is cropped rather than squeezed. It is `aria-hidden` and `inert`, so the card's title link stays the card's one target.
- It mounts on approach (IntersectionObserver, two viewports of lead) and nothing renders on the server: fifty-three examples share this page, and every card reads without its still.
- Which example a component leads with was decided in two places; it is now one exported rule, `heroExample` in `apps/docs/lib/meta.ts`, and `ComponentSummary` carries it as `example`.
- **The eight components whose example is only a trigger carry a caption along the bottom of their still** — "trigger only — the menu opens under the button", and so on. The text is a new optional `opens` in the meta contract (`packages/react/meta/schema.ts`), set on alert-dialog, command, dialog, menu, popover, sheet, tooltip and toast. It says what the still leaves out rather than repeating the description, which already says what each one is.

**Decided**
- **Live stills rather than baked screenshots — Claude recommended, Anuj accepted.** Committed PNGs would cost nothing at runtime but freeze one brand and one scheme and go stale silently; a live still follows the site's scheme switch and cannot drift from the component.
- **The eight overlay components show their trigger, unchanged — Claude recommended, Anuj accepted.** Dialog, Alert Dialog, Sheet, Popover, Menu, Command, Tooltip and Toast portal to `<body>` (ADR-012), so they cannot render open inside a scaled stage. A closed menu genuinely is a `⋮` button; a drawn stand-in would be a second set of examples to keep in step with the real ones.
- **The caption text lives in `meta.json`, not in the docs — Claude.** `meta.json` is the one source of truth per component (ADR-007), and "the surface portals to `<body>`, so an example can only show the trigger" is a fact about the component, not about this page. A map of eight names in the index would go stale the first time a ninth overlay is added. The field is optional and both other readers of `meta.json` — the MCP server and the schema generator — whitelist the fields they use, so `pnpm registry` and `pnpm --filter @syntara/sdui generate` produce byte-identical output. `packages/react` publishes only `dist`, so no changeset.
- **`zoom`, not `scale`, shrinks the canvas — Claude.** `zoom` shrinks the layout box as well as the paint, so the stage's own centring sees the size the example really takes up; `scale` leaves a full-size box behind, which floats a short example off centre or pushes a tall one's first line out of view depending on the transform origin. Guarded by `@supports (zoom: 1)`: without it the still is plainer, never broken.

**Results**
Run against the static export (`pnpm --filter @syntara/docs start`), on this branch's own base.

- `pnpm typecheck`: clean, 11 packages. `pnpm test`: 1,449 passing, 1 skipped (470 components · 309 engine · 245 icons · 193 MCP · 150 schema · 74 auditor · 8 codemods).
- `pnpm test:themes`: 118,000 / 118,000, adjustments per brand 0 / 4 / 7. `pnpm check:meta`: 53 / 53. `pnpm registry`: 73 items. `node scripts/check-override-weight.mjs`: 0.
- `pnpm --filter @syntara/docs build`: 81 pages. `node scripts/check-ssr-tabs.mjs`: 81 pages, 326 tab lists, 0 missing a panel.
- `node scripts/check-hydration.mjs`: 226 loads, 0 failures. `node scripts/check-theme-links.mjs`: 5 links, 0 failures. `node scripts/check-narrow-overflow.mjs`: 113 routes at 320px, 0 scrolling sideways. `node scripts/check-csp.mjs`: 113 routes, 0 broken by the site's own CSP.
- `node scripts/axe-sweep.mjs`: 113 routes × 2 schemes, **0 violation nodes**. `node scripts/check-overlay-exit.mjs`: 108 tooltips, 4 menus and popovers, 0 failures.
- Keyboard: 227 controls inside the 53 stills, **0 reachable by Tab**; all 53 stages `aria-hidden` and `inert` (measured in the page).
- Lazy mounting: 18 of 53 stills mounted on load at 1440×900, 53 after scrolling; 38 example chunks deferred until scroll (68 → 106 requests).
- Screenshots reviewed at 1440 light and dark, 820 and 390, and with `dir="rtl"` forced: the grid and the stills mirror, and the stages stay centred.
- Captions: 8 of 53 cards, none inside the `aria-hidden` or `inert` subtree (measured in the page). Contrast of the caption on the stage, at 12px 400: **6.42:1 light, 9.71:1 dark** (needs 4.5). One line at 390px, two at three-up.

**Found by measuring, not fixed**
- Calendar's still overflows its stage by 21px on the inline-end edge and is clipped there, in both directions — its seven-column grid has a min-content width wider than the stage at three-up. It trims the last weekday column; the month, both chevrons and the first rows read.
- Calendar aside, every still reads: the Overlays row was a grid of anonymous buttons until the captions went on, and Anuj called for them after seeing it rendered.

**Next**
- Anuj: the captions are written from the demos; check the wording reads the way he'd say it, particularly Command's "⌘K or the button".
## 2026-09-28 (live) — static export on Cloudflare, honest install copy, and no glyph clipping left

**Changed — going live**

- **The site is a static export** (`output: 'export'`), so Cloudflare Pages serves plain files: no adapter, no Workers
  runtime, nothing that can 500. `/themes` was the only server-rendered route, because it read the theme out of
  `searchParams`; it now reads the address on the client after hydration and dispatches a new `replace` action
  (ADR-030). `docs/deploy.md` has the Pages settings. `apps/docs/public/_headers` adds security headers and immutable
  caching for `/_next/static/*`.
- **`next start` no longer works with an export.** `pnpm --filter @syntara/docs start` serves `apps/docs/out` instead,
  and `/verify` step 9, CI and every script comment say so. `serve` is pinned as a devDependency rather than `npx`'d.
- **`scripts/check-theme-links.mjs`** (new): opens five shared `/themes` links, including a malformed one, and fails if
  the theme doesn't come back. The client-side read is easy to break silently; this is what notices.

**Changed — honest claims**

- The homepage's hero told visitors to run `npm install @syntara/react`, which 404s: nothing is published and the
  `@syntara` scope is unclaimed. It now carries a note and a link to the by-hand instructions. The "Ship it your way"
  cards already had a "Not on npm yet" badge; the hero did not.
- The install page said a component's dependencies are "usually `react-aria-components` and `@tabler/icons-react`".
  `@tabler/icons-react` is not a dependency of `@syntara/react` at all — the real counts, from `meta.json`, are
  react-aria-components ×44, `@syntara/icons` ×23, `@internationalized/date` ×2.
- The homepage said "in three tenants" while rendering five; it now counts them. The docs index listed four tenants and
  omitted Haat; governance said "all five tenants" when there are six.
- Three examples imported `Key`, `Selection` and `useLocale` from `react-aria-components`, which someone installing
  `@syntara/react` does not have. `Key` and `Selection` were already re-exported; `useLocale` now is too, from
  `theme-scope.tsx`, where the locale is set.

**Changed — the clipping, fixed (ADR-031)**

- Six type pairs carry their own measured line heights. **0 clipped in 42,768 cases, down from 5,209**, and
  `check-script-clipping.mjs` exits 0. Both Arabic pairs go to 1.8 (they were cutting vowelled text by up to 12px);
  friendly, editorial, calm and technical get 1.3–1.35 for descenders. `precise` and `modern` clipped nothing and are
  untouched — their exporter hashes are byte-identical, which is how the test proves the change is confined.
- `ScriptTypeTokens` widens to `'devanagari' | 'arabic' | 'latin'`, with `minFontSize` and `capsTracking` optional.

**Decided**

- **Static export over the Cloudflare adapter — Anuj.** A shared `/themes` link now paints the default preset for one
  frame. The pre-paint script that would have hidden it was measured and rejected: the theme is the output of
  `generateTheme()`, so the script would have to inline the whole engine, blocking, on every visit (ADR-030).
- **Per-pair line heights, not a higher shared default — Claude.** Raising the shared 1.2 would loosen the two pairs
  that clip nothing and the house theme the site is set in, to fix four that do (ADR-031).
- **Clipping is not monotonic in line height — measured.** `editorial` clips 10 cases at 1.22 and 31 at 1.25, then none
  at 1.3. Sub-pixel rounding. A value is only known good at exactly the value measured; this is in the type's doc.

**Results** (build `m3flFb_Tudn9IxbFF7LyO`, served by `pnpm --filter @syntara/docs start`)

- `pnpm typecheck`: clean, 11 packages. `pnpm test`: 1,447 passing (309 engine — 8 new lock the measured line heights).
- `pnpm test:themes`: 118,000 / 118,000, 0 failed. `pnpm tokens`: 6 tenants, 118/118 and 236/236 each.
- `node scripts/check-script-clipping.mjs`: **0 clipped across 42,768 cases, 9 type pairs** (was 5,209); exits 0.
- `node scripts/check-hydration.mjs`: 113 routes × 2 schemes, 226 loaded, 0 hydration failures.
- `node scripts/check-theme-links.mjs`: 5 shared links, 0 failures. `node scripts/check-ssr-tabs.mjs`: 81 pages, 326 tab
  lists, 0 missing a panel.
- `node scripts/axe-sweep.mjs`: 113 × 2, 0 violation nodes, no page errors.
- `node scripts/check-overlay-exit.mjs`: 108 tooltips, 4 menus and popovers, 0 failures.
- `pnpm drift apps/docs --min-score 95`: 98.5. `node scripts/check-override-weight.mjs`: 0.
- Qamar and Care were screenshotted at 1,440px after the line-height change; both read correctly, nothing clipped or
  reflowed badly. Only qamar, care and harbor move — vela, haat and the house theme keep their pairs' values.

**Changed — the last four Phase 5a gaps (ADR-032)**

Measuring them first changed what three of them were.

- **"Nine components set `line-height: 1`" was one component.** That rule only cuts anything where the same element
  also clips its overflow; elsewhere the ink renders outside the line box and nothing is lost. Checking every element
  on seven blocks in Hindi, Arabic and Latin for `overflow-y: hidden` with content taller than its box found exactly
  one — `PersonChip`'s `.name`, losing 4px off "रेखा", "सुनील", "परी" and "कमला". It now takes `margin-block: -0.3em;
  padding-block: 0.3em`: the clip box grows, the chip's height does not. Raising its line height to the token would
  have made Arabic chips much taller to fix a Hindi fault, and Arabic was not clipping. Now 0 elements clip in all
  three tenants.
- **Avatar initials take the base letter in Brahmic scripts.** A grapheme cluster there is a whole syllable, so one
  per word ran together as a word: "रेखा यादव" → "रेया". Marks are dropped and a conjunct gives the consonant it
  starts with: "रय", "कश" for "क्षमा शर्मा", "अ" for "अंजलि". Bengali, Tamil, Telugu and the rest included. Latin,
  Arabic and emoji are untouched.
- **The hi-IN date field reads "दिन / माह / वर्ष".** React Aria ships segment placeholders for 34 locales; `ar-AE` is
  one, `hi-IN` is not, so it fell back to English. `DatePicker` now fills that gap from
  `Intl.DisplayNames(locale, {type: 'dateTimeField'})` — for every locale React Aria has not got to, not Hindi alone.
  Only where its placeholder came back as plain ASCII on a non-Latin locale, so React Aria's own strings still win
  where it has them (a date input wants "dd", not "day").
- **The activity table's title wraps on a phone instead of truncating.** "बच्चों के स्पोर्ट्स जूते" was cut to
  "…स्पोर्ट्…" — a dead consonant with a trailing virama. CSS has no grapheme-aware truncation and the title missed
  fitting by 11px, so it wraps below 480px; the meta line still truncates, and cuts at an order number.

**Results — the four gaps** (build `rWCWlV4IaE6bWWXNndWdA`)

- Elements clipping content vertically, seven blocks × {haat, qamar, care}: **0** (was 4, all PersonChip in Hindi).
- Date segments: haat `["दिन","माह","वर्ष"]`, qamar `["يوم","شهر","سنة"]`, vela/harbor/care `["dd","mm","yyyy"]`.
- Initials: `getInitials('रेखा यादव','hi-IN')` → `"रय"`; 5 new cases in `avatar.test.tsx`; 469 component tests pass.
- Titles still truncated at 390px in Haat's activity table: **0** (was 3).
- Re-run after the fixes: clipping 0 / 42,768 · hydration 0 / 226 · theme links 0 / 5 · axe 0 nodes · overlays 0 ·
  SSR tabs 0 · drift 98.5 · override weight 0 · 1,448 tests pass.

**Next**

- **Anuj:** reserve the `@syntara` npm scope (it is unclaimed, and the rename spent 11,063 occurrences on the name);
  create the Cloudflare Pages project with the settings in `docs/deploy.md` and set `NEXT_PUBLIC_SITE_URL`.
- **Anuj:** look at Qamar. 1.8 is the value at which fully vowelled Arabic stops clipping; if Qamar's copy is never
  vowelled, a tighter value would look better and still be safe for that content (ADR-031).
- **Anuj:** the initials rule (ADR-032) is a judgement about how Hindi names read. "रय" over "रेया" — overrule it if
  you read it differently.
- Not fixed, and now the only known one left: truncation is grapheme-aware nowhere. The activity table wraps instead,
  but any other component that truncates Indic text can still stop inside a cluster. It needs measurement and a
  ResizeObserver, so it is an RFC, not a patch.

---

## 2026-09-28 (418, found) — the eight were real: compact notation, and two runtimes that disagree

**This corrects the entry below it,** which concluded the report was a stale-port artifact. It was not. The eight
reproduce on the Linux CI runner — the same four routes, the same two schemes — while a Mac with the same commit, a
clean install and a fresh build shows none. The earlier entry's *measurements* were right; its conclusion was wrong,
and it was reached by ruling out causes rather than by finding one.

**The cause (ADR-033)**

`Intl.NumberFormat` with `notation: 'compact'`. It is the one part of Intl whose output is not stable across ICU
versions, and the runtime that prerenders the page is not the runtime that hydrates it. On the runner, Node wrote
`₹18.0K`, `$5.0K`, `£240k` and its own Chromium rendered `₹18T`, `$5K`, `£240K`. On this Mac the two agree, which is
why it looked clean. The earlier elimination of Intl was not wrong about what it tested — plain currency formatting
does match across the two runtimes — only about what it covered: compact was never tested.

Three call sites use it, and they are exactly the four routes: `chart.tsx` (the default value format, which reaches
the y-axis labels, the data table and the summary, all prerendered), `amount.tsx` (`compact`), and the homepage's
`compactMoney`.

**Not a CI-only fault.** On Cloudflare, a visitor whose browser data differs from the build machine's makes React
discard the server HTML and re-render the page on the client.

**Changed**

- **The build's string is what everyone sees — Anuj.** `suppressHydrationWarning` on the elements carrying compact
  output, and only those: plain currency formatting is left alone, because suppressing more than necessary would
  hide a real mismatch later.
- **Amount merges neighbouring plain parts into one text node,** and this is what makes the above work. Suppression
  alone did **not** fix it, which only came out by simulating the runner's divergence locally: Intl returns as many
  parts as it likes, and how many depends on the value and the runtime — compact `18K` is two parts where `18.0K` is
  four. One node per part made it a difference in the *shape* of the DOM, which `suppressHydrationWarning` does not
  cover (React said `#418 args[]=HTML`, not `args[]=text`). Merged, it is a difference in text, which it does cover.
- **`check-hydration.mjs` now names the text that differs,** as a multiset diff of the server HTML against the
  hydrated DOM — positional diffing went out of step at the first client-only insertion (a chart's axis labels) and
  buried the real change. Without this the cause was invisible: the production error names nothing, and the only
  machine that reproduces it is a runner.
- **`native-exporters.test.ts` asks whether the toolchain can target macOS** instead of whether `swiftc` exists. CI
  had been red on main since 3a42138: the Linux runner ships Swift and no Apple SDKs, so every
  `-target *-apple-macos*` failed. A companion test records that Swift was not compiled, as the Kotlin one does.

**Results**

- Simulated the runner's divergence on this Mac (build emits `₹18.0K`, browser renders `₹18K`): **8 failures before
  the fix, 0 after**, across 113 routes × 2 schemes. The simulation is the only way to test this here.
- After reverting the simulation: hydration 0 / 226 · theme links 0 / 5 · SSR tabs 0 · axe 0 nodes · 1,449 tests.
- `getInitials`, clipping, drift and override weight unchanged from the entry below.

**Next**

- The better end state is to stop asking Intl for the compact form and own the suffix (`K`/`L`/`Cr`/`k`/`M`) in a
  per-locale table: deterministic, correct in the HTML, no suppression anywhere. It means owning locale data for
  every locale the system supports, so it is an RFC, not a patch (ADR-033).
- A suppressed element that later re-renders will swap to the browser's string. Nothing does that today.

---

## 2026-09-28 (hydration) — the eight React 418s could not be reproduced, and the sweep could not have told us

> **Superseded.** The entry above found the cause: compact notation, and a build runtime that disagrees with the
> browser. The conclusion here — a stale server on port 3000 — was wrong. The port hazard it describes is real, and
> the guard added for it stays, but it was not what happened.

**The report**: React error #418 on `/`, `/blocks`, `/themes` and `/docs/components/amount`, in both schemes — eight
occurrences — from `node scripts/axe-sweep.mjs` against a production build, reproduced on `3a42138` as well.

**What was measured**

- At `ba85fb6`, in a clean worktree with its own `pnpm install` and `pnpm --filter @syntara/docs build`, **none of the
  four routes fails**. The same sweep the report came from prints `routes: 113 × 2 schemes; violation nodes: 0` and an
  empty summary — no `pageerror` key at all. A second, dedicated check agrees: 226 page loads, 0 hydration failures.
- `#418` **does** reach `page.on('pageerror')`, so `axe-sweep.mjs` is a real detector and its silence here means
  something. That was confirmed by injecting a mismatch, not assumed.
- The four routes were not the ones at fault in the obvious places. Every `<Amount>` in the site passes an explicit
  `locale`, so `useLocale()` is never consulted; `request-flow`'s `today(getLocalTimeZone())` is used only in
  validation and never rendered; `ThemeStats`' `generationMs` already carries `suppressHydrationWarning`. The one real
  server/client difference on those pages — a chart's axis ticks — is by design: `useChartSize` returns 0×0 until
  mounted, so SSR draws no marks and the ticks arrive after hydration, which is a state update, not a mismatch.

**The likely cause of the report, not proven**

`/verify` step 9 said to start the site with `cd apps/docs && npx next start -p 3000 &`. When something already holds
port 3000 that command exits with `EADDRINUSE`, and because it is backgrounded the failure is easy to miss — the old
server keeps answering. Demonstrated here: a second `next start -p 3000` died with `EADDRINUSE` while `curl
localhost:3000` still returned 200 from the first. `axe-sweep.mjs` defaulted to `http://localhost:3000` and never
checked which build answered, so a sweep run that way describes whatever was already on the port. That also explains
the detail offered as confirmation — that `3a42138` in a separate worktree gave *identical* eight errors. Two
different codebases agreeing to the route and the scheme is the signature of both sweeps reaching one stale server,
not of a bug surviving a rename. The server is gone, so this is the best-supported explanation, not a proven one.

**Changed**

- `scripts/check-hydration.mjs` (new): loads every prerendered route in Chromium, in both schemes, and fails on a
  React hydration error. `check-ssr-tabs.mjs` catches one known shape of this fault by reading the HTML; React only
  reports the rest in a browser, at hydration time, and a production build says no more than "Minified React error
  #418". In `/verify` step 9 and in CI after the build.
- `scripts/served-build.mjs` (new): compares the build id the server is serving with `apps/docs/.next/BUILD_ID` and
  stops with an explanation if they differ. Wired into `check-hydration.mjs`, `axe-sweep.mjs` and
  `check-overlay-exit.mjs`, so none of the three can silently measure someone else's port again.
- `scripts/docs-routes.mjs` (new): the route list, shared by the sweeps so they cannot drift on what counts as covered.
- `/verify` step 9 and `.github/workflows/ci.yml` run the hydration check; the skill spells out the `EADDRINUSE` trap.

**Decided**

- **No component or page was changed — Claude.** Nothing was found to fix, and changing code to chase an error that
  does not reproduce would have been worse than leaving it. What is durable here is the check and the guard.

**Results** (all against build `ZPIwNxPIvQIyLLA1dYc76`, served by a `next start -p 3000` whose PID was noted)

- `pnpm --filter @syntara/docs build`: clean.
- `node scripts/check-ssr-tabs.mjs`: pages 80; tab lists 325; 0 missing a panel.
- `node scripts/check-hydration.mjs`: 113 routes × 2 schemes; 226 loaded; **0 hydration failures**; 2m44s.
- `node scripts/axe-sweep.mjs`: 113 × 2; 0 violation nodes; empty summary (no page errors).
- `node scripts/check-overlay-exit.mjs`: 108 tooltips, 4 menus and popovers; 0 failures.
- Detector proved, not assumed: rendering `typeof window === 'undefined' ? 'server' : 'client'` in the homepage
  showcase made `check-hydration.mjs` report `light /` and `dark /` with "Minified React error #418" and exit 1. The
  guard was proved the same way — pointed at a build id that was not the served one, it exits 1 and names both.
  Both edits reverted; the numbers above are from the rebuild after reverting.

**Next**

- If the eight errors ever come back, capture the failing build id and keep the server alive: `check-hydration.mjs`
  names the build, so a repeat can be tied to a commit instead of a port.

---

## 2026-09-28 (rename) — the project is Syntara

**Changed**
- **The project is renamed from Strata to Syntara**, in one case-preserving pass over every tracked text file except `evals/runs/`: 11,063 occurrences in 747 files, two of them also renamed on disk. Counts from `git grep -I -o -i syntara -- . ':!evals/runs' | wc -l` and `git diff --name-only | wc -l`.
- The npm scope is `@syntara/*`. The CLIs are `syntara-audit`, `syntara-mcp`, `syntara-codemods`.
- **Tokens are renamed with it:** `--strata-*` → `--syntara-*` (8,405 occurrences) and `data-strata-*` → `data-syntara-*` (319). No token value changed and no component behaviour changed.
- The MCP server is `syntara`, so its tools are `syntara__get_component` and the rest; its resources are `syntara://agents` and `syntara://governance`. Server-driven UI schema ids are `urn:syntara:sdui:v1:*`. Script environment variables are `SYNTARA_REGISTRY_URL`, `SYNTARA_BASE_URL`, `SYNTARA_LOCAL_FONTS`. The Kotlin and Swift exports are `SyntaraTokens`, `SyntaraColors` and the rest, and the two native snapshots are renamed to match.
- A breaking changeset for all eight published packages, spelling out the four things a consumer has to rewrite.

**Decided**
- **ADR-029, the rename and how far it reaches — Anuj.** The token prefix and the wire contract change with the name, because a design system whose every custom property reads `--strata-` is still called Strata to the people using it, and doing it after 1.0 would cost the same with users attached.
- **The GitHub repository keeps its name — Anuj's call, not taken here.** 20 links in the docs, ADRs and RFCs point at `github.com/anujpatel06/strata` and are left exactly as they are. Renaming the repository breaks every clone and every link anyone already holds; GitHub's redirect would keep these links working once he does it.
- **The eval records are not rewritten — Claude.** All 803 files under `evals/runs/` are byte-identical, and so are the generated `results.md`, `results.json` and `results.svg`, which record the literal tarball names and workspace paths of runs that happened (`packs/strata-react-0.1.0.tgz`). Rewriting them would report an install that never took place. `score.mjs` now accepts either scope so archived runs still score; `evals/README.md` says that re-scoring `iter-1` or `iter-2` needs `SOURCE_ROOT` pointed at a pre-rename checkout, because the auditor no longer knows `--strata-*`.

**Next**
- Anuj: rename the GitHub repository if he wants it to match, and decide whether `@syntara` is the scope to reserve on npm.
- A codemod for the token prefix, if there is ever a consumer to migrate. GOVERNANCE.md already sets that policy for deprecations.

---

## 2026-09-28 (Phase 5a) — server-driven UI, native tokens, Hindi tenant, and fixes from the eval

**Changed**
- `packages/sdui` (new): a JSON Schema per component generated from `meta.json`, `validateScreen`, and `SyntaraScreen`, a reference renderer for the web. 26 node types. New docs page, /docs/server-driven-ui, with a live demo.
- `packages/theme-engine`: `toCompose` and `toSwiftUI`. The token build writes a Kotlin and a Swift file per tenant and re-checks every contrast pair on the exported values.
- Tenant **Haat** (hi-IN), with a Devanagari type pair (Mukta) whose line heights and tracking were set by measuring for clipping. New `scripts/check-script-clipping.mjs`. The docs show "Hindi copy: draft" wherever Haat's copy appears.
- `packages/mcp`: new tool `find_icon`; `get_component` returns `imports` and `typeNotes`. `AGENTS.md` gains an icon rule and a narrow-screen rule.
- Components: ToggleButtonGroup wraps when it doesn't fit; `Key` is exported; StatTile marks bad news with a shape and a word for screen readers (ADR-028).
- Docs CSS: 163 selectors that restyle a Syntara component now outweigh it. New `scripts/check-override-weight.mjs`, in CI and `/verify` (ADR-026).
- The schema validator named the wrong node for errors inside a slot called `action`. Fixed, with tests.

**Decided**
- Haat, reseller commerce, `#B5179E` and `#F48C06`; Anuj reviews the Hindi; native tokens from our own exporters — **Anuj**.
- Subagents run on Opus 5.5 — **Anuj**.
- ToggleButtonGroup wraps; `Key` exported; StatTile's bad-news mark; the renderer sets direction from the document's language; the schema rules in ADR-023 — **Anuj delegated the call** ("fix all of these, do what is correct"); Claude decided (ADR-023, ADR-028).
- Mukta over Noto Sans Devanagari; per-script token values (ADR-024) — **Claude recommended, pending Anuj**.
- The shape of the generated Kotlin and Swift files (ADR-025) — **Claude recommended, pending Anuj**.
- Docs overrides are doubled and checked; cascade layers left for an RFC (ADR-026) — **Claude** (pending Anuj).
- The schema stays at 1.0.0 after StatTile gained two props, because 1.0.0 was never released — **Claude**.

**Found by measuring, not fixed**
- Both Arabic type pairs (Qamar) clip at the normal line height, by up to 12px on vowelled text. Four Latin pairs clip descenders at the tight line height; Care's pair in 269 cases — `node scripts/check-script-clipping.mjs` (exits 1).
- Nine components set `line-height: 1` and ignore the per-script token: tag, tabs, steps, person-chip, kbd, icon-tile, command, chip, calendar.
- Avatar turns "रेखा यादव" into "रेया", and "रे" at avatar size reads like ₹.
- The date field shows "dd / mm / yyyy" under hi-IN.
- The browser's ellipsis can end on a half letter: "स्पोर्ट्…" in the activity table at 390px.
- Tooltip stays mounted after keyboard focus moves on. Being fixed in a separate session.
- Docs examples import `Key`, `Selection` and `useLocale` from `react-aria-components`, which a consumer doesn't have directly.
- The homepage still says "three tenants", and the docs index doesn't list Haat.

**A regression caught and fixed before commit**
- Adding `@syntara/sdui` to the docs changed the order of the site's stylesheets, and the Portfolio block grew from 1,440px to over 8,000px wide in every left-to-right tenant. Typecheck, 1,422 tests, the build and the drift gate all passed with it broken. A subagent's screenshot review found it.
- After the fix, every block in four tenants at 1,440 and 390px was compared pixel by pixel with 9061227. Portfolio is identical. Two small differences remain and are kept: the dashboard's "View all" icon, and a 15px mark at the top of the request flow.

**Results**
- `pnpm typecheck`: clean, 11 packages.
- `pnpm test`: 468 components · 301 engine · 245 icons · 193 MCP server · 150 schema · 74 auditor · 8 codemods, all passing.
- `pnpm test:themes`: 118,000 / 118,000; the 1,000 brands are the same as before (the fuzz keeps its original eight type pairs).
- `pnpm tokens`: 6 tenants, 118 / 118 each, and 236 / 236 on the exported native values.
- Swift files: type-checked with `swiftc` 6.3.3 against the macOS SDK, not built for iOS. Kotlin files: **not compiled**; no Kotlin compiler is installed.
- `node scripts/check-script-clipping.mjs --pairs=bilingual-devanagari`: no clipping in 5,616 cases.
- `pnpm check:meta`: 53 / 53. `pnpm registry`: 73 items. `node scripts/check-override-weight.mjs`: 0.
- `pnpm drift apps/docs --min-score 95`: passes, 98.8, 60 findings.
- `pnpm --filter @syntara/docs build`: 81 pages. `node scripts/check-ssr-tabs.mjs`: 0 of 80.
- `SYNTARA_BASE_URL=http://localhost:3016 node scripts/axe-sweep.mjs`: 113 routes × light/dark, 0 violation nodes, 0 page errors.
- Horizontal overflow, every block × 5 tenants at 1,440 and 390px: 0.
- Dark-scheme brand fidelity, examined: of 1,000 brands, 108 get a slightly deeper fill so labels stay white as in light (median distance 3.0), and 92 dark brands are lightened so they don't vanish on a dark canvas. All 33 moves over 10 are in the second group; 26 of them are near-black brands. By design (ADR-006), not a fault.

**Next**
- Eval iteration 3: the `mcp` condition again with the fixed server, 50 runs, Sonnet 5.
- Anuj: review the Hindi copy; look at the bad-news pill, the homepage chips and the two small block differences; decide Mukta, `useLocale`, and the clipping in the existing pairs.

---

## 2026-09-28 (fix) — tooltips stayed on the page after keyboard focus moved on

**Changed**
- `Tooltip` (`packages/react/src/ui/tooltip.tsx`, `tooltip.module.css`): a tooltip closed by a swap to the next tooltip now unmounts.
  - Cause: a fault in React Aria 1.21.1, reproduced with its own components and no Syntara code. Tooltips on the buttons of a `ToggleButtonGroup` stay mounted when Tab leaves the group. On Tab the group moves focus to its last item, that item's tooltip replaces the open one with `shouldSkipAnimation`, and the closed tooltip ends up mounted as `[data-exiting]` with no position, at 0,0. Tooltips on plain buttons don't do it. It isn't the CSS animation: it happens with reduced motion and with no CSS at all.
  - Fix: the component hands React Aria a trigger state with `shouldSkipAnimation: false`, so the tooltip always takes the path that ends. The swap stays instant: the tooltip gets `data-instant`, and the CSS skips the enter and exit animation for it.
- `Tooltip`: no fade for a tooltip that never appeared. A toggle group moves focus to its last item on Tab so that the browser's Tab leaves the group. That item's tooltip opened and closed before the first paint, then faded out for 120ms ("Compact" on the preview toolbar). The component now marks a tooltip that closes before its first frame as `data-instant`.
- `Tooltip`: a tooltip opened by keyboard focus stays open when that focus scrolls the page. React Aria closes tooltips on any scroll, so "Copy code" on the component pages closed as soon as it opened. While the trigger has keyboard focus, only a scroll the person made (wheel, touch, pointer or key) closes it.
- Draft report for React Aria: `docs/upstream/react-aria-tooltip-stays-mounted.md`. Not posted.
- New browser check, `scripts/check-overlay-exit.mjs`, added to `/verify` step 9. It tabs through three component pages and opens a Menu and a Popover, with and without reduced motion.
- `tooltip.test.tsx`: two more cases. Focus moving across three tooltip triggers passes before and after the fix, because jsdom can't show that fault; the browser check is its regression test. The scroll case fails without the fix.
- Changeset: `tooltip-unmounts-on-swap` (patch).

**Decided**
- Keep a focus-opened tooltip open through the scroll that focus causes — **Anuj** ("fix these"). ADR-027.
- Keep the instant swap between tooltips (React Aria's behaviour) and don't fade each one out — **Claude**, delegated by Anuj ("whatever you feel is best"). ADR-027. No API change, so GOVERNANCE §5 doesn't apply.
- Fix it in the component, not with a patched dependency. 1.21.1 is the newest `react-aria-components` (`npm view react-aria-components version`) — **Claude**.

**Results**
- Stale tooltips: 802 failures before the fix, 0 after (first version of the check). Pass-through flashes: 5 failures with only the first fix, 0 with both. Final: `tooltips checked: 88; menus and popovers checked: 4; failures: 0` — `SYNTARA_BASE_URL=http://localhost:3010 node scripts/check-overlay-exit.mjs`, on the production build.
- With `/docs/server-driven-ui` included (working tree, built to `.next-tooltipfix`): `tooltips checked: 98; menus and popovers checked: 4; failures: 0` — `SYNTARA_BASE_URL=http://localhost:3011 node scripts/check-overlay-exit.mjs`.
- Scroll: 8 failures without the fix, 0 with it. Final check on the scratch build: `tooltips checked: 96; menus and popovers checked: 4; failures: 0`.
- Menu and Popover don't have the fault: they passed on the build without the fix too.
- `/verify`, all steps pass: `pnpm typecheck`; `pnpm test` (react 445, theme-engine 224, icons 245, mcp 143, audit 74, codemods 8); `pnpm test:themes` 118,000 / 118,000; `pnpm check:meta` 53/53; `pnpm registry` 71 items; docs build 80 pages; `node scripts/check-ssr-tabs.mjs` 0 of 79 pages; `node scripts/axe-sweep.mjs` 0 violation nodes on 105 routes × 2 schemes.

**Next**
- Report the fault to React Aria, then remove the workaround when a release fixes it.
- Anuj: post the React Aria report if it reads right.

---

## 2026-09-28 (Phase 5, eval) — the agent eval ran; the first attempt was thrown out

**Changed**
- Ran the agent eval twice. Iteration 1 is invalid and kept on record (`evals/runs/iter-1/INVALID.md`). Iteration 2 is the result (`evals/results.md`).
- Harness fixes, each found by reading runs:
  - `node_modules` is copied into each workspace, not linked. File search doesn't follow links, so in iteration 1 only 2 of 50 runs without context imported from `@syntara/react`, and 31 said the packages weren't installed.
  - The eval stops at the account's usage limit and records nothing for the runs it cuts short. In iteration 2 the limit produced 84 empty runs and 3 half-finished ones; all 87 were thrown away and run again.
  - The leak check no longer flags a run's own files. Its first 5 reports were all false.
  - Each result records whether the run read the installed packages, and whether the screen imports from `@syntara/react`.
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
- `pnpm --filter @syntara/docs build`: 80 pages. `node scripts/check-ssr-tabs.mjs`: 0 of 79 pages with a tab list missing its panel.
- `SYNTARA_BASE_URL=http://localhost:3010 node scripts/axe-sweep.mjs`: 105 routes × light/dark, 0 violation nodes, 0 page errors.

**What the eval says, and doesn't**
- With Syntara installed and readable, the agent used it in every run, in both conditions. The baseline is already strong.
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
- `packages/tokens`: `@syntara/theme-engine` moved to dev dependencies. The eval's setup found that installing the packed package tried to fetch the engine from npm.
- CI runs the drift gate: `pnpm drift apps/docs --min-score 95`.
- Docs: the MCP page describes the real server.

**Decided**
- Eval size "Standard" and model Sonnet 5 — **Anuj**. With one model that is 100 runs, not 200 (ADR-022).
- Auditor and MCP server built in parallel by two subagents with separate files — **Anuj**.
- Score formula and weights, safe-fix rule, `get_example` as a seventh tool, eval isolation rules (ADR-022) — **Claude** (pending Anuj).
- Colours inside `mask-image` aren't checked: a mask is read for alpha only — **Claude** (the auditor subagent's call, accepted by the lead).
- Native elements in the docs app (a skip link, anchors, two tables) stay as findings. No exemptions were added to raise the score — **Claude**.

**Results**
- `pnpm --filter @syntara/audit test`: 74 passing. `pnpm --filter @syntara/mcp test`: 143 passing, including 3 against the real auditor. `pnpm --filter @syntara/theme-engine test`: 224 passing.
- `pnpm drift apps/docs`: score 98.8. 60 findings (24 errors, 36 warnings) in 4,598 places looked at; 34 have a safe fix. By rule: 35 off-scale space, 23 native elements, 1 off-scale radius, 1 physical property.
- `pnpm drift packages/react/src/ui`: score 99.9. 1 finding, the `<table>` in `chart.tsx`.
- Brand fidelity over 1,000 random brands (`pnpm test:themes`), ΔE in OKLab × 100:
  - primary, light: kept exactly 89.2%, p95 3.5, largest 5.8
  - primary, dark: kept exactly 80.0%, p95 7.1, largest 29.0
  - accent, light: kept exactly 88.4%, p95 3.1, largest 5.6
  - accent, dark: kept exactly 77.5%, p95 8.0, largest 25.0
- Tenants (`pnpm tokens`): Vela, Harbor, Qamar and Care keep both brand colours exactly in both schemes. The house theme's near-black `#18181b` ships as `#4a4a4e` in dark, a distance of 20.0.
- MCP response sizes: see the MCP docs page; `pnpm --filter @syntara/mcp test sizes`.
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
- `packages/react/scripts/build-registry.mjs`: `buildBlockItems` rejected every `@syntara/*` import, so the 7 blocks that import `@syntara/icons` were skipped and the build exited 1. Components never failed because `importProblems` already exempts `@syntara/icons` (ADR-014). Blocks now get the same exemption: the package is added to the item's `dependencies`. Other `@syntara/*` imports are still errors.
- `packages/react/CONVENTIONS.md`: the allowed-imports line lists `@syntara/icons` instead of `@tabler/icons-react`.
- Tabler selectors replaced in `button`, `link` and `toggle-group` CSS. They matched Tabler's class names, which `@syntara/icons` doesn't render, so two rules were dead:
  - The RTL flip for arrows and chevrons only worked with `data-directional`. It now matches `[data-syntara-icon^='arrow']` and `[data-syntara-icon^='chevron']`. Not yet checked in a browser.
  - The icon stroke rule now matches `[data-syntara-icon]`. ThemeScope already applied the same value, so nothing looked different.
- `button.test.tsx`: the pending test looked for `.tabler-icon-plus`, which could never be there, so it passed without testing anything. It now looks for `[data-syntara-icon="plus"]`.
- Comments that described Tabler behaviour in `button.tsx`, `button.module.css`, `link.module.css` and `badge.module.css` now describe `@syntara/icons`. `steps.tsx` and `checkbox.tsx` still credit Tabler for their path geometry, which is accurate.
- Icon stroke is 1.5 everywhere. CONVENTIONS "Icons match text" said 1.75 and cited Tabler; it now names the token. The 1.75 fallbacks in `chip` and `eyebrow` CSS are 1.5 (the token is always set to 1.5, so nothing looked different). Two places did render at 1.75 and now follow the token: the portfolio block's next-step icon and the file icons in docs code blocks.
- Hydration fix brought over from the `infallible-merkle-6dffef` worktree, where another session wrote it:
  - Cause: the component page (a server component) rendered `Tabs`, `TabList`, `Tab` and `TabPanel` directly. React Aria chose the default tab from a collection that was still empty, so the server HTML had no selected tab and no panel, and hydration threw React error 418.
  - Fix: the new client component `apps/docs/components/docs/install-tabs.tsx` creates the tabs; the page passes only the panel contents. No change to the Tabs component.
  - New `scripts/check-ssr-tabs.mjs` fails when a prerendered page has a tab list without a panel. It is step 8 of `/verify` and runs in CI after the build.
  - Tabs meta: one Do and one Don't about server components.
- Registry build: a `workspace:*` dependency is written as the package's own version (`@syntara/icons@^0.1.0`). Also from that worktree.
- Accordion: closed panels in server-rendered HTML are `display: none` again. The panel's `display: grid` beat the browser's `[hidden]` rule, so until React Aria mounted, links inside a closed panel could take keyboard focus while invisible. Found by running axe on `/blocks` with the site's scripts blocked.

**Decided**
- Fix the hydration error in the docs page, not in Tabs — **Claude** (pending Anuj), as the other session recorded it.
- The Accordion finding is a real fault, not a false one as the showcase-card entry calls it: without the fix a keyboard user can tab into hidden links before hydration, or for good if scripts fail — **Claude** (pending Anuj). The Meter finding in the same state is false: `role="meter progressbar"` is valid ARIA that axe-core 4.13 rejects.
- Icon stroke is 1.5, as ADR-014 says, not the 1.75 in CONVENTIONS — **Anuj**.
- Treat `@syntara/icons` in blocks the way components already treat it — **Claude recommended, Anuj accepted**. Not a design trade-off: it applies ADR-014 to a check that was missed when Tabler was replaced. The registry stays internal (ADR-011 revision).

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
  - `NEXT_DIST_DIR=.next-verify pnpm --filter @syntara/docs build`: 80 pages.
  - `NEXT_DIST_DIR=.next-verify node scripts/check-ssr-tabs.mjs`: 79 pages, 323 tab lists, 0 pages with a tab list missing its panel.
  - `SYNTARA_BASE_URL=http://localhost:3021 node scripts/axe-sweep.mjs` against `next start -p 3021`: 105 routes × light/dark, 0 violation nodes, 0 page errors.
- Before the hydration fix the sweep gave 40 page errors (#418 on 20 component pages × 2 schemes) and 8 violation nodes on `/blocks`. The 8 appear only when axe runs before hydration: 1 run in 18 under load, every run with the site's scripts blocked. After the Accordion fix that state gives 1, the Meter false finding.
- Screenshots (`node scripts/shoot.mjs`, playground and the built site), looked at one by one: arrows in Button and Link point left under Qamar RTL and right under Vela; the portfolio block's next-step icon and the code block file icons read clearly at the 1.5 stroke.

**Next**
- `@syntara/icons` is not on npm, so a registry install that needs it would still fail. Only matters if the registry is published again.
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
- New package `@syntara/codemods` with `button-variant-danger-to-tone` and a CLI. It was run on `apps/` and `packages/react/test`: 3 usages rewritten, 3 places reported for a person to read (all three turned out to need no change).
- The settings block had a local override that made an outline button look destructive. It now uses `variant="outline" tone="danger"`, and the override's CSS is gone.
- Engine: the four `feedback.*.fg` roles are also solved on `surface.canvas` and `surface.raised`. No token value moved; tenants still need 3 adjustments each (`pnpm tokens`).
- Docs: governance and changelog pages; the decision list no longer shows raw `**` marks or clipped text.
- CI runs `pnpm check:meta`. `scripts/axe-sweep.mjs` takes `SYNTARA_BASE_URL`. README numbers, repo map and roadmap brought up to date.

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
- Danger label contrast on outline and ghost buttons, worst case over 5 tenants and 1,000 fuzz brands, light and dark: 6.10:1 on `surface.selected`, 6.18:1 on `feedback.danger.bg` — `pnpm --filter @syntara/react exec vitest run test/button.test.tsx -t "contrast proof"`.
- `pnpm check:meta`: 53 / 53; 18 alpha · 35 beta · 0 stable.
- `pnpm --filter @syntara/docs build`: 80 pages.
- `SYNTARA_BASE_URL=http://localhost:3010 node scripts/axe-sweep.mjs`: 105 routes × light/dark, 0 violation nodes.
- **Failing, and already failing at commit 31cde5d:**
  - `pnpm registry`: 7 errors, all blocks that import `@syntara/icons`. Fixed later the same day; see the registry entry above.
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
- `pnpm check:meta` enforces the automatable criteria: a declared beta/stable that misses one is an error; an alpha that misses the floor is a printed note (nothing lower to move it to); stable is rejected while `@syntara/react` is unpublished (`PUBLISHED_ON_NPM` in the script). New optional `review.a11y` meta field (a date, only for a real review).
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
- Position Syntara on published evidence; widen Phase 5 with a per-model eval, a brand fidelity metric and auditor autofix (ADR-018) — **Claude recommended, Anuj accepted**.
- Mobile story is a server-driven UI schema plus native token export, not native components (ADR-019) — **Claude recommended, Anuj accepted**. Claude first recommended a native Compose slice and changed that after the research.
- Add a Hindi tenant with per-script type tokens (ADR-020) — **Claude recommended, Anuj accepted**.

**Results**
- None. The research contains no Syntara-measured numbers, and its figures must not appear on the site as Syntara metrics.

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
- Engine: `--syntara-sheen` (dark: a 115° band peaking at 8% text.default; light: none). text.subtle stays ≥ 6.86:1 at its brightest pixel over tenants and fuzz (test).
- Toast and Alert rebuilt to Anuj's toast reference:
  - sheen, hairline and rim; filled status icons (shape `feedback.*.fg`, knockout `feedback.*.bg`, worst 6.09:1; `solid` failed 3:1 in three places);
  - icon | title and description | one action; action weight by severity (`contrast` for danger/warning).
  - `@syntara/icons` gains 6 filled status icons (243 total).
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
- `@syntara/icons`: 235 icons (health, commerce, media, travel and system domains added).
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
- `@syntara/icons` (ADR-014): 95 curvy, minimal icons drawn to one spec (24 grid, 1.5 stroke, `--syntara-icon-stroke`). Tabler is replaced everywhere except the GitHub and React logos (official marks, docs only). `pnpm --filter @syntara/icons sheet` renders the review sheet.
- Editorial voice (ADR-015):
  - engine: `editorial` type pair (Fraunces with italics and optical size, DM Sans, DM Mono), `paper` neutral, `--syntara-font-tracking-caps`, `--syntara-icon-stroke`;
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
- No shadcn anywhere users look: docs site, Brand Generator and README. Install is npm or copying the source. `/r/*.json` is no longer served, `pnpm registry` writes to `packages/react/registry/` (gitignored), and the Registry docs page was deleted. The engine's shadcn exporter stays as internal code. `@syntara/tokens` now ships `dist` (`files`).
- Engine tokens:
  - motion: `duration-slow`, `easing-out`, and a damped spring (stiffness 400, damping 28) sampled into `linear()`, which settles in 402ms;
  - elevation: `shadow-highlight`;
  - glass: `glass-bg`/`blur`/`opacity`, with the opacity *solved* per scheme;
  - finesse: radii retuned (sharp 6/6/10/4, soft 10/10/16/6, round pill/14/22/pill), softer layered shadows, `--syntara-hairline` (0.5px on 2× screens), and `--syntara-font-tracking-*` (Inter dynamic-metrics curve, 0 for Arabic pairs).
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
- `@syntara/react`: 41 components on React Aria + CSS Modules, each with a meta.json, tests and docs examples (136).
- `apps/docs`: Next.js 16 site themed by Syntara itself. It has component pages (live Preview/Code per tenant, scheme, direction and density; install tabs; API; accessibility; tokens), Blocks (5), Themes (the generator rebuilt with Syntara components), Colors, and ⌘K search.
- Registry: 55 shadcn-schema-valid items (components, blocks, token files, `theme-<tenant>` bridge items, `@syntara/syntara` base). Verified with shadcn CLI 4.21 through URL installs, namespaced installs and dependency resolution.
- npm build: Vite library mode with `preserveModules`; `'use client'` kept; `dist/styles.css`; types verified with bundler and nodenext resolution.
- Engine: `toShadcnCssVars` / `toShadcnCSS`. Feedback text is now checked against selected rows too (86 checks per theme), and feedback text is a step deeper, so the solver still never touches the system palette.
- Built by parallel agents (5 component owners, docs, registry, blocks, home, themes). Every change was integrated, reviewed and verified by the lead.

**Decided**
- Distribution: npm + shadcn-compatible registry from one source (ADR-011) — **Anuj**.
- Docs framework: Next.js App Router + MDX (ADR-004 accepted) — **Anuj**.
- Scope: ~30 core components + full site this round — **Anuj**.
- Overlays copy their scope's attributes; ThemeScope owns the locale (ADR-012) — **Claude recommended**, Anuj to confirm.
- House brand `tenants/house/brand.json` (#18181B, monochrome) so tenant colours are the only colour on the site — **Claude**.
- Registry token selector `:root, [data-syntara-theme="<id>"], [data-syntara-scheme]:not([data-syntara-theme])` — **Claude**.
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
- Anuj: review the site locally (`pnpm --filter @syntara/docs dev`), confirm ADR-012, deploy the docs to Vercel.
- Then Phase 4 (governance + deprecation demo) and Phase 5 (MCP + drift audit + agent eval).

---

## 2026-09-26 — Phase 0 + Phase 1 started

**Changed**
- pnpm monorepo scaffold: `packages/theme-engine`, `packages/tokens`, `apps/generator`, `tenants/{vela,harbor,qamar}`.
- Phase 1 in progress: OKLCH ramps, contrast solver, exporters (CSS, DTCG, Figma), tenant brand + content files, Brand Generator v0 with one preview screen.
- ADR template + ADR-001…010 drafted.
- README, CLAUDE.md, CONTRIBUTING, CI workflow, Changesets config, `pnpm screenshots` (Playwright + axe).

**Decided**
- Repo built in the cloud, then saved to `~/projects/syntara` — **Anuj**.
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
- axe (wcag2a/aa, 2.1 a/aa, 2.2 aa): 0 violations on 6 preview pages — `pnpm screenshots` (run here with `SYNTARA_LOCAL_FONTS`, since the build sandbox can't reach Google Fonts).

- Hosted demo: single-file build (`pnpm --filter @syntara/generator build:single`) published as a private claude.ai page; Download is hidden there (the host sandbox blocks page-started downloads), Copy stays; `#vela` / `#harbor` / `#qamar` deep-link a tenant — **Claude**.

**Open questions for Anuj**
- Pure-red brands get white labels in light mode but ink labels in dark (ink already passes there). Match the schemes by deepening the dark fill, or keep the brand exact? (ADR-006)

**Next**
- Phase 1 review with Anuj: screenshots in `docs/screenshots/phase-1/`, fuzz report, pending ADRs.
- Then Phase 2: components.

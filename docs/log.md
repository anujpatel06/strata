# Syntara — build log

One entry per session, newest first. Three headings: **Changed / Decided / Next**.
Every decision names who made the call: **Anuj**, **Claude recommended, Anuj accepted**, or **Claude** (pending Anuj's review).
Numbers only with the command that produced them. Design trade-offs get an ADR in `docs/adr/`.

---

## 2026-10-03 (21st.dev-style pieces) — Marquee, PromptComposer, the AI reply, and previews in the tenant's language

Four branches, one PR each. This entry lives on `feat/docs-preview-locale`; the other three carry no log edit, so
they merge without touching this file.

**Changed**
- **`feat/marquee` — `Marquee` (alpha).** A self-scrolling strip with a pause toggle, pause on hover and on focus
  inside (WCAG 2.2.2); no movement under reduced motion; one readable copy, the loop's copies `aria-hidden` + `inert`;
  pace from width; rightwards in RTL. 4 tests, 3 examples.
- **`feat/prompt-composer` — `PromptComposer`, `ComposerButton`, `ComposerSelect` (alpha).** Built from Anuj's
  reference screenshot. Enter sends, Shift+Enter breaks, Enter during IME composition never sends; send becomes stop
  while pending. `glow="brand" | "spectrum"` (primary/accent, or warning→info), `surface="glass"` (Popover's
  recipe). Icon-only pills on narrow composers. 6 tests, 3 examples.
- **`feat/ai-reply` — `StreamingResponse` + `ResponseText`, `ResponseSources`, `ResponseSource` (alpha).** The
  2026-10-02 prototype (`feat/ai-streaming-announcer`, never committed) copied in unchanged, plus a visual layer:
  words settle from the brand text colour into the body colour, a glowing caret, a shimmer on "Writing…", citation
  chips. RFC-002 Accepted. 13 tests, 4 examples.
- **`feat/docs-preview-locale` — previews speak the tenant's language (ADR-042).** Every preview takes the tenant's
  `locale`/`dir` (Qamar Arabic RTL, Haat Hindi), the direction toggle overrides; Button's seven examples translate
  through `examples/_copy/` and the Code tab strips the `t()` calls back to plain English.
- The composer and AI reply demos follow the preview tenant's language themselves (a MutationObserver on the scope);
  once ADR-042 is merged they can switch to `useCopy()`.

**Decided**
- Build showy motion pieces first, Marquee as the first: **Anuj** (chose "showy motion pieces", "build one now").
- Glow from the solved palette, not raw orange/blue; send button stays solid with a glowing ring, no gradient behind
  the icon: **Claude recommended, Anuj accepted** (he kept going after seeing both).
- Glass as a `surface` option on the composer: **Anuj** asked for it; glass outside floating layers is **Claude**,
  pending review against CONVENTIONS' "glass is for floating layers".
- Build the AI reply on the unsaved announcer prototype: **Anuj** ("build on top of it").
- RFC-002's three questions and the shimmer's motion-rule exception: **Anuj** (ADR-041).
- Previews follow the tenant's language, direction toggle kept as an override, words one component at a time:
  **Anuj** (ADR-042). The Code-tab stripping mechanism: **Claude**, pending Anuj.
- Anuj reviewed the Arabic and Hindi wording written this session (the composer, the AI reply and Button examples).
- The AI reply's word fade-in and chip pop-in run only without reduced motion; under reduced motion words only change
  colour, both ends readable. **Claude**, after the axe sweep caught a half-faded word (below).

**Results** (each branch, `/verify` steps 1–9 via one script, each on its own port with `SYNTARA_BASE_URL`)
- `feat/marquee`: all steps pass. `pnpm test` 2,175 passing (react 478); `check-hydration` 115 routes × 2: 0
  failures; `check-narrow-overflow` 230 checks: 0 sideways; `axe-sweep` 115 × 2: 0 violation nodes;
  `check-overlay-exit` 108 tooltips + 4 menus: 0 failures. `grep -rl marquee-duration apps/docs/out/_next/static`: 10 files.
- `feat/prompt-composer`: all steps pass. `pnpm test` 2,177 (react 480); hydration 0 of 230; sideways 0 of 230;
  axe 0; overlay exit 0. `grep -rl data-surface …/static`: 10 files.
- `feat/ai-reply`: the first sweep failed — `axe-sweep`: 1 color-contrast node, light, `/docs/components/streaming-response`,
  a word caught mid fade-in. After the fix, all steps pass: `pnpm test` react 487; hydration 0 of 230; sideways 0
  of 230; axe 0; overlay exit 0. A one-off scan of that page at 16 moments of playback × 2 schemes, reduced motion:
  32 scans, 0 violation nodes. `grep -rl word-settle …/static`: 10 files.
- `feat/docs-preview-locale`: all steps pass. hydration 0 of 228 (114 routes, no new component); axe 0. The Code tab
  for Button's seven examples is byte-identical to the pre-change files (7 of 7, `stripCopy` vs `git show HEAD:`);
  `grep -rl 'طلب جديد' …/static`: 7 files; the built Button page contains no `useCopy`.
- Not done: a VoiceOver/NVDA run of `StreamingResponse`; `/screenshots` across tenants × schemes × RTL × widths.

**Next**
- Merge order matters for two hand-kept numbers: each component branch says **54 components** and its own README
  test counts. Whichever merges second and third bumps the count (55, 56) in README, `packages/react/README.md`,
  CLAUDE.md and `packages/mcp/test/{sizes,tools}.test.ts`, and re-runs `node scripts/check-test-counts.mjs --fix`.
- Roll `useCopy()` out to the other 52 components, a group at a time; move the composer and AI reply demos onto it.
- The component playground still renders blank for every component on a fresh install (`use-sync-external-store`
  export error); not touched here.
- Close the `ai-announcer` worktree and `feat/ai-streaming-announcer`: its work is on `feat/ai-reply`.

---

## 2026-10-02 (homepage) — the hero becomes the demo, and the page gets a way in

**Changed**
- **The hero is two columns**, built from Anuj's mockup: version pill and "What's new", the display headline, a
  one-line lead, "Get started" beside the real install command, four read-from-the-repo figures, and on the right a
  fan of three live tenant cards with the brand chips and a caption under them
  (`components/home/hero-stack.tsx`, new).
- **The brand pick moved to the hero and lives on the stage.** `HomeStage` owns it; the hero's chips set it; the
  glow, the headline's accent word, the hero buttons, the card fan and the showcase grid all read it. The showcase
  keeps the two controls the hero does not have — the hex field and light/dark — and lost its duplicate chip row.
- **The showcase is a titled section** ("Pick a brand. *The screen follows.*") on a full-bleed banner band with its
  own surface and a hairline, and the hero's glow is clipped to that band — it used to spill ~170px past the hero,
  behind the section's heading and chips, which is what made the two read as one block.
- **The hero's buttons and the two agent cards follow the selected brand.** The site runs on the house theme, whose
  primary is `#18181B`; on a dark canvas the solver lifts it to `#4a4a4e`, so "Get started" was grey whatever was
  picked, and the agents section's brand and accent cards were the *same* grey twice, because house has no accent.
- **The agent cards are tinted, not filled.** `action.primary.bg` and `accent.bg` are button-sized roles; across a
  whole card they were two flat slabs. They now sit at a tenth strength over `surface.default` with the colour at
  full strength in the hairline, the text back to the engine's own pair, and the code sample capped so all three
  cards are one height.
- **The 53-component grid is eight category tiles**, each linking to that group on `/docs/components` — which lists
  the same components with a rendered thumbnail of each. `component-filter.tsx` and 12 dead CSS rules are gone.
- **A way in from anywhere:** "Get started" is first in the header nav and points at Installation, not at the
  Introduction; the hero carries the real `pnpm add` command, highlighted at build time by the site's own Shiki.
- **The site has a favicon** (`apps/docs/app/icon.svg`) — there was none, so tabs showed the browser's globe. Same
  mark as the header, with its own colours per scheme because a favicon has no `currentColor`.
- **Haat's Hindi copy is marked reviewed** (`tenants/haat/content.json`), so the draft note no longer appears.
- **"Get started" in the header waits for 960px.** Merging #38 showed the cost: that fix left the header row
  fitting at 768 with 33px to spare, and a seventh nav item is wider than that, so every page from 768 to 959
  went 26px over — 72 of 228 route/width pairs. The item is held back to the same breakpoint the search expands
  at; below it the hero's own button is the entry point.
- ~~Three invented token names fixed~~ — landed independently as #37, which also added the `pnpm drift` rule
  that catches the next one. This branch had found and fixed the same three (`.trustRow`, `.toolChip`, the
  component-name labels); the merge kept #37's wording.

**Decided**
- **The hero replaces the showcase's toolbar, not the showcase — Anuj**, after Claude flagged that building the
  mockup literally would delete "Your colour", the solver line, the names overlay and the full grid.
- **Brand cards: ADR-040's version stands — Anuj.** This branch had solved the same two requests differently (both
  figures kept, stats floor lowered to 128px, footer forced to two columns, card widened). That work was dropped on
  merge rather than superseding an accepted ADR.
- **The agent cards are tinted — Anuj**, from three options.
- **Eight category tiles — Anuj**, from three options.

**Results** — `/verify`, all nine steps, on build `0UityzepSFWvAPEapJwWI`; steps 7–9 re-run after merging
#38 on build `TBToOPzTGGY2xKuyP0f2m`, which is where the header overflow above was caught and fixed:

| Step | Command | Result |
|---|---|---|
| 1 | `pnpm --filter @syntara/react gen:index` | `src/index.ts → 53 modules` |
| 2 | `pnpm typecheck` | exit 0, all 9 packages |
| 3 | `pnpm test` | **2,167 passed, 1 skipped, 0 failed**; `check-test-counts` README row matches at 2,168 |
| 4 | `pnpm test:themes` | 118,000 / 118,000 checks, 0 failed; adjustments/brand median **4**, max 7 (unmoved) |
| 5 | `pnpm check:meta` | exit 0, 53/53 components |
| 6 | `pnpm registry` | 73 items ok |
| 6a | `node scripts/check-override-weight.mjs` | **0** selectors weighing the same as the component they restyle |
| 7 | `pnpm --filter @syntara/docs build` | exit 0, **82 pages**, `/icon.svg` among them |
| 8 | `node scripts/check-ssr-tabs.mjs` | 327 tab lists, **0** missing panels |
| 9 | `check-hydration` | 228 loads, **0** failures |
| 9 | `check-theme-links` | 5 links, **0** failures |
| 9 | `check-narrow-overflow` | **0** scrolling sideways — 684 route/width pairs at 320, 768, 860, 900, 959 and 960 |
| 9 | `check-csp` | 114 routes, **0** failures |
| 9 | `axe-sweep` | 114 routes × 2 schemes, **0** violation nodes |
| 9 | `check-overlay-exit` | 108 tooltips + 4 menus/popovers, **0** failures |

- Step 9 was served on port 3177, not 3000: another session's `serve out` from the `duotone-pr` worktree has held
  3000 all day. Every script was given `SYNTARA_BASE_URL` and each one reported build `0UityzepSFWvAPEapJwWI`, so
  they measured this build and not that one.
- **Proof it shipped:** `apps/docs/out/index.html` contains "The same card, in" (the hero stack's caption) and
  `apps/docs/out/icon.svg` exists.
- **Hero contrast, re-measured** after the headline moved onto the band rather than the canvas: 14 of 14
  tenant × scheme pairs at or above 4.5, worst **4.87:1** (Your colour, light), at 1440, 1280, 768 and 390 wide.
  The script that produced it is not in the repo — see Next.

**Next**
- The hero's card fan is drawn at `--stack-zoom: 0.5`, which renders the card's body text at about 6.5px. It reads
  as a texture rather than as a card. 0.7 is the suggestion; it is one number in `hero-stack.module.css`.
- The showcase heading still says "Pick a brand. The screen follows." while the brand is now picked in the hero.
- The "One command" label Anuj asked for was dropped when the hero was rebuilt from the mockup, which has no label.
  Its CSS has been removed; restoring it is a label above the command only, not above the actions row.
- ~~Six more invented `--syntara-*` names remain.~~ Done on main by #37, auditor rule included.
- ~~The homepage scrolls sideways at 768px, in the brand rail's figures.~~ Fixed on main by #38 while this
  branch was open, and the diagnosis here was wrong: the rail's off-screen cards were already held by
  `contain: paint`, and the culprit was the site header's search growing to a 192px field at the same
  breakpoint the nav appears.
- `.tenantGrid` in `sections.module.css` is dead: no component uses that class.
- ADR-032 (whether a Hindi reader agrees that रय reads as initials) and `CLAUDE.md`'s "Waiting on Anuj" line still
  say Haat's copy is unreviewed.

---

## 2026-10-02 (invented tokens) — seven names that were never tokens, and the rule that catches the next one

**Changed**
- **Seven `--syntara-*` names used in `apps/docs` were never emitted by the theme engine.** An undefined custom
  property is not a CSS error: `var(--syntara-radius-md)` parses, the declaration holding it is then *invalid at
  computed-value time*, and it computes to `unset` — doing nothing, silently, while still winning the cascade
  over any lower-specificity rule that would have worked.
  - `--syntara-focus-ring-width`, `--syntara-focus-ring-offset`, `--syntara-color-border-focus` → the engine
    emits `--syntara-color-focus-ring` and no width or offset token. Rewritten to the pair every component in
    `packages/react` uses: `outline: 2px solid var(--syntara-color-focus-ring); outline-offset: 2px`.
  - `--syntara-radius-full` → `-pill` (9999px), `--syntara-radius-md` → `-container`, `--syntara-radius-sm` →
    `-field` on `.trustRow` and `-badge` on `.toolChip` and the component-names label. The engine has no
    t-shirt sizes: the roles are `button`, `field`, `container`, `badge`, `pill`.
  - `--syntara-line-height-relaxed` → `-normal` (1.5), the loosest step the scale has (tight/snug/normal).
  - Each replacement carries a comment saying why that role and not another.
- **`--syntara-radius-sm` was *not* already fixed on `feat/docs-showcase-heading`.** That branch is unmerged and
  three uses of it survive there (`component-names.module.css:25`, `sections.module.css:1073` and `:1102`). All
  three are fixed here.
- **New auditor rule `unknown-token`** (`packages/audit`), the real deliverable. It flags any `var(--syntara-…)`
  whose name the engine does not emit and the file does not declare itself — in `calc()`, in a `var()` fallback,
  and on the right-hand side of a custom property. Known names come from the engine's own `toCssVariables`,
  unioned over every tenant, both schemes and both densities, so the list cannot drift from what ships. The fix
  is never safe: it lists the candidate roles and asks for a comment saying why. Fixture at
  `test/fixtures/css/unknown-token.css`.

**Decided**
- **The three focus names were a WCAG 2.2 AA 2.4.7 failure, not a cosmetic one — Claude (pending Anuj).**
  Measured in the browser under real keyboard focus before deciding the fix, as asked. Five keyboard-reachable
  elements matched `:focus-visible` and computed `outline-style: none` with no box-shadow: `.adr` (`/story`),
  `.arrow` and `.rail` (brand rail), `.componentTile` and `.filterChip` (home). The site's own zero-specificity
  fallback in `globals.css` — `:where(a, button, [tabindex]):focus-visible` — would have covered all five, but
  the module rules outrank it and then threw the ring away. Working footer links measured `solid 2px` in the
  same sweep, which is what made the absence legible.
- **`unknown-token` is an `error`, and it counts an opportunity for every `--syntara-*` use — Claude (pending
  Anuj).** The consequence is that **scores move**: a file using tokens correctly now gains error-weighted
  passing opportunities. The score test's snippet goes 62.5 → 78.5 with no change to its findings. Audit scores
  are only comparable within one version of the rule set, and `evals/results.md` was produced under the old one.
  Flagging rather than silently re-baselining.
- **No ADR.** Nothing here is a design trade-off: six of the seven names had exactly one role that matches, and
  the focus pair copies what `packages/react` already does in 39 places.

**Results**
Branch cut from `origin/main` at `99cec94` (0 behind, 0 ahead at start). `main` moved by two commits while this
ran (#34, #35), so it was merged in before pushing; the only overlap was this file. Those commits touch the
homepage's brand cards, so the whole verification was re-run against the merged tree and every number below is
from build `Vy0CNyRPfmHmI6qymi6mC`, after the merge. Port 3000 was held by another session's
server (PID 28615, a different scratchpad), so step 9 ran against my own build on 3042 via `SYNTARA_BASE_URL`;
that session's server was left alone.

Undefined-name scan over all **328** committed `.css` files against `packages/tokens/dist/*/tokens.css`:
**7** undefined before, **0** after. `pnpm drift apps/docs packages/react packages/sdui apps/generator
apps/playground`: **0** `unknown-token` findings over **14,605** opportunities — no false positives. The same
auditor run against the pre-fix files from `HEAD` reports **all 7** names at the right line and column, so the
rule catches the bug it was written for.

`pnpm typecheck` clean · `pnpm test` **2,171** passing across 7 packages (`check-test-counts.mjs --fix` updated
the README's auditor row 74 → 77) · `pnpm test:themes` **118,000/118,000** checks, 0 failed, median 4
adjustments per brand, charts **2,000/2,000** · `pnpm check:meta` **53/53** · `pnpm registry` 73 items ok ·
`check-override-weight` clean · `check-ssr-tabs` **0** of 82 pages (327 tab lists) · `check-hydration` **0**
over 114 routes × 2 schemes · `check-theme-links` **0** · `check-narrow-overflow` **0** at 320px ·
`check-csp` **0** · `axe-sweep` **0** violation nodes over 114 routes × 2 schemes · `check-overlay-exit` **0**
over 108 tooltips and 4 menus/popovers.

Change proven to be in build `Vy0CNyRPfmHmI6qymi6mC`, not just alongside it:
`grep -roE '--syntara-(focus-ring-width|focus-ring-offset|color-border-focus|line-height-relaxed|radius-full|radius-md|radius-sm)' apps/docs/out/_next/static`
returns **nothing**, and `outline:2px solid var(--syntara-color-focus-ring)` is present in the built chunks.
In-browser after the fix: `.adr`, `.arrow`, `.rail`, `.componentTile` and `.filterChip` all compute
`solid 2px rgb(183,183,186)` under real Tab focus; chips and arrows compute `9999px`, cards `20px`, toolChip
`8px`, trustRow `12px`.

**Next**
- Anuj to review: the focus-ring fix is behaviour-visible (five elements that had no ring now have one) and the
  radius fixes change the look (category chips were square, now pills — screenshotted before/after).
- `evals/results.md` numbers predate `unknown-token`. Re-running the eval would make them comparable again;
  not done here because `run.mjs` calls a paid model.
- Known gaps from the previous entry are unchanged.

---

## 2026-10-02 (the 768 band) — the header, not the rail

**Changed**
The homepage scrolled sideways at 768px: `scrollWidth` 882 against a 768 viewport, and clean at 320, 390, 1024
and up. The report blamed the brands rail, because the rail's off-screen cards do stick out past the viewport —
but that is what a horizontal scroller looks like, and `contain: paint` was already holding them. Walking the tree
and skipping every box with a clipping ancestor left one culprit: **the site header**.

- **`site-header.module.css`: the expanded search moves from `min-width: 768px` to `min-width: 960px`.** At 768 the
  main nav appears and the search grows into a 192px field at the same moment. Measured at 768: gutter 24 + brand
  86 + its margin 16 + nav 457 + gap 8 + actions 284 ends the row at **882**, needing **906** with the end gutter.
  So 768–881 scrolled, by **114px at 768** and **22px at 860**. With the icon-only search the actions are 120 and
  the row needs **735** — it fits at 768 with **33px** spare. The search keeps its `aria-label`, so the icon-only
  form is still named; its box is 36px, over the 24px target floor.
- **`data.module.css`: the tenant brand line wraps.** Once the header stopped hiding it, `/docs` still scrolled 3px
  at 768: the sidebar leaves a 448px column, each of the two tenant cards gets 216, the line needs 272, and the
  industry (`white-space: nowrap`, pushed to the far edge) hung 3px past the viewport. `flex-wrap: wrap` drops it
  to its own line, still at the far edge.
- **`sections.module.css`: the homepage's figures get a column wide enough for their number.** Found while
  measuring the band, pre-existing, and Anuj chose to fix it here. `.figures` sized its columns at
  `minmax(min(100%, 160px), 1fr)` — a number tuned for 320px and nothing else. "118,000" is **154px** at 3xl with
  no break opportunity, and the tile adds **58** of padding: **212** in all. So the value hung out of its own card
  by **48px at 375, 41 at 390, 21 at 430 and 44 at 768**, and scrolled the page **3px at 375 and 376**. The
  minimum is now **224** (`space-16 × 3.5`): the four figures are one-up below ~496px and two-up above it, which
  leaves the desktop layout exactly as it was.
- **`check-narrow-overflow.mjs` now checks 320 **and** 768 by default** (and `/verify` expects both). The bug lived
  at a width nobody opens by hand; 320 and 1024 both passed throughout.

**Decided**
- **960, not 900 — Claude.** The row needs 906 with both gutters intact. At 900 the end gutter was already being
  eaten (actions ended at 882 inside a 900 box) without the page scrolling, so 900 would have left a cramp behind.
- **Wrap the brand line rather than shrink or truncate the industry — Claude.** It keeps both labels readable and
  keeps "industry at the far edge", which is what the rule says it is for.
- **The rail was not touched.** It was already contained; arrows, keyboard and RTL were only verified.
- **Stack the figures rather than shrink the number — Anuj**, from three options. Shrinking it would have kept two
  columns on a phone but needed a fluid font size outside the `--syntara-*` type scale, which CONVENTIONS.md's
  tokens-only rule forbids without an ADR.

**Results** — full `/verify`, all nine steps, on the merge with `origin/main` (which brought #35's shorter brand
cards, so every number below is measured with those in place):

| Step | Command | Result |
|---|---|---|
| 1 | `pnpm --filter @syntara/react gen:index` | `src/index.ts → 53 modules` |
| 2 | `pnpm typecheck` | exit 0 |
| 3 | `pnpm test` + `check-test-counts` | **2,168** tests across 7 packages, none failing; README row matches |
| 4 | `pnpm test:themes` | **118,000** checks, **0** failed (100.00%); 2,000/2,000 chart palettes; adjustments/brand median **4**, unmoved |
| 5 | `pnpm check:meta` | **53/53** |
| 6 | `pnpm registry` | 73 items ok |
| 6a | `node scripts/check-override-weight.mjs` | 0 selectors weighing the same as the component |
| 7 | `pnpm --filter @syntara/docs build` | exit 0, **82** pages, build `XtXFQlTkJJE4f-oqKv_nj` |
| 8 | `node scripts/check-ssr-tabs.mjs` | 327 tab lists, **0** missing panels |
| 9 | `check-hydration` | 228 loads, **0** failures |
| 9 | `check-theme-links` | 5 links, **0** failures |
| 9 | `check-narrow-overflow` (new defaults) | 114 routes × 320 **and 768**, 228 checks, **0** scrolling sideways |
| 9 | `check-csp` | 114 routes, **0** failures |
| 9 | `axe-sweep` | 114 routes × 2 schemes, **0** violation nodes |
| 9 | `check-overlay-exit` | 108 tooltips + 4 menus/popovers, **0** failures |

Wider sweeps than `/verify` runs, measured on the pre-merge build while fixing this — all after the fix:

| Measurement | Result |
|---|---|
| `SYNTARA_WIDTHS=320,390,768,800,860,900,1024,1280,1440,1920`, 114 routes | 1,140 checks, **0** after the fix |
| the same ten widths × light and dark, 9 key routes | 180 checks, **0** after the fix |
| spilling text boxes at 320/360/375/376/390/430/470/496/500/600/768/900/1024/1280/1440/1920 | **0** after the fix (was 1 at six of them) |
| rail behaviour at 320/768/900/1280 | arrow pages 0 → 268/396, `End` reaches the same, Qamar card `dir=rtl lang=ar`, document stays 0 over while scrolled |

- **Proof it shipped:** `@media (min-width:960px){.site-header-module__…__search…}`, `tenantHead{…flex-wrap:wrap…}`
  and `minmax(min(100%,calc(var(--syntara-space-16) * 3.5)),1fr)` are all in `apps/docs/out/_next/static/chunks/*.css`.
- Both of the faults this session set out to fix were **pre-existing on `main`** (2557e70), not from any in-flight branch.
- `pnpm test:themes` again rewrote only its own timing numbers (median 0.62 → 0.68 ms, p95 0.95 → 1.49 ms, this
  machine being busier). Reverted, as last session did.

**Next**
- **For Anuj's eye:** at 768–959 the header now shows the full nav with an icon-only search; the "Search
  documentation…" field returns at 960. And on `/docs` at 768, Harbor's "Insurance" and Care's "Family health
  benefits" now sit on a second line while the shorter labels stay inline.
- **For Anuj's eye:** the four figures under "Accessible by construction" are one per row on a phone now, two per
  row from ~496px, and unchanged on desktop.
- **`.tenantStats` had the same fault and `main` had already cured it.** Before the merge, "₹5,00,000" needed
  113px in a 98px box and spilled **15px at 320** (clipped by the rail's `contain: paint`, so no check caught it
  and the page never scrolled — the card just looked broken). The brand cards dropping to one figure each (#35)
  gives that tile the card's full width: re-measured on the merged build, **0** boxes on the homepage fail to hold
  their content at 320, 375, 390, 430 or 768. Nothing left to do, but the `space-16 * 2.5` minimum is still in
  `.tenantStats`, so a second figure coming back would bring the spill back with it.

---

## 2026-10-01 (brand cards) — the homepage's tallest thing gets shorter

**Changed**
- **One figure per brand card, not two.** `getTenantOverviews` slices each tenant's `overview.stats` to the first
  entry (`apps/docs/components/home/home-data.ts`). The two tiles never fit side by side — the card is 342px wide
  inside its 384px rail slot and `.tenantStats` holds a 160px floor per tile — so `auto-fit` stacked them and spent
  **261–293px** of card on them. Nothing is deleted from any `content.json`; the second number is still there.
- **Both actions on one line**, which Anuj asked for after seeing the first result. The buttons are `size="sm"` and
  `CardFooter` keeps its own wrapping, so they are made to *fit* rather than forced: a card too narrow for the pair
  still wraps instead of clipping.
- **Care's primary action is "Book a visit"**, from "Book a consultation". At `sm` the pair fits in four brands of
  five; Care's was 39px too wide and its label is the longest on the page. The Hindi and Arabic labels were not
  touched — they fit as they are.
- Built in its own worktree (`.claude/worktrees/docs-shorter-brand-cards`) because another session was editing the
  same files in the main checkout at the same time.

**Decided**
- **One figure, not two — Anuj**, from four measured options. He rejected widening the card to 432px (Care's
  ₹10,600 clipped by 11px) and squeezing two columns in at today's width (three of five cards clipped).
  [ADR-040](adr/040-one-figure-per-brand-card.md).
- **Buttons side by side — Anuj**, asked for directly after seeing them wrapped, and delivered by making them fit
  rather than by `flex-wrap: nowrap`, which clips (see Results).

**Results** — `/verify`, all nine steps, on build `vj7aGX_vRMzoQ60Xo8t4k`:

| Step | Command | Result |
|---|---|---|
| 1 | `pnpm --filter @syntara/react gen:index` | `src/index.ts → 53 modules` |
| 2 | `pnpm typecheck` | exit 0, all 9 packages |
| 3 | `pnpm test` | **2,167 passed, 1 skipped, 0 failed**; `check-test-counts` README row matches at 2,168 |
| 4 | `pnpm test:themes` | 118,000 checks, 0 failed, adjustments/brand median **4** (unmoved) |
| 5 | `pnpm check:meta` | exit 0 |
| 6 | `pnpm registry` | 73 items ok |
| 6a | `node scripts/check-override-weight.mjs` | 0 selectors weighing the same as the component |
| 7 | `pnpm --filter @syntara/docs build` | exit 0, 82 pages |
| 8 | `node scripts/check-ssr-tabs.mjs` | 327 tab lists, **0** missing panels |
| 9 | `check-hydration` | 228 loads, **0** failures |
| 9 | `check-theme-links` / `check-narrow-overflow` / `check-csp` | **0** failures each (114 routes) |
| 9 | `axe-sweep` | 114 routes × 2 schemes, **0** violation nodes |
| 9 | `check-overlay-exit` | 108 tooltips + 4 menus/popovers, **0** failures |

- **Height, measured on one build at a 1440px window** (`getBoundingClientRect` on `.tenantScope` and on the rail):

  | | tallest card | rail row |
  |---|---|---|
  | before | 700px | 781px |
  | one figure | 543px | 622px |
  | one figure + actions on one line | **512px** | **590px** |

  −188px on the card, −191px on the row (24%).
- **Proof it shipped:** in `apps/docs/out/index.html`, "Spent this month", "Claims in progress", "Hospital cover"
  and "Book a consultation" appear **0** times; "Available balance", "Active policies", "OPD wallet" and
  "Book a visit" appear twice each.
- **Nothing clips.** `scrollWidth − clientWidth` is 0 for every figure and every footer in all five cards at
  1440px, all five footers are one row, and at 375px the footers wrap to two rows with 0 overflow.
- **`flex-wrap: nowrap` was tried first and is wrong.** `Button` sets `flex-shrink: 0` and `white-space: nowrap`
  with nothing to truncate it, so the second button is pushed past the card's edge and clipped by the scope: Care
  by **48px** at 1440px, and at 375px every card overflowed (Qamar 9px to Care 139px). My first measurement missed
  it because it read the buttons' own overflow instead of the footer's.
- The first `pnpm test` run of the session failed on a 5,000ms timeout in `@syntara/mcp`; the same suite passed in
  **2.5s** on a warm re-run. Same cluster of load-sensitive tests as the previous entry.
- `pnpm test:themes` again rewrote only its timing numbers (median 0.62 → 0.65 ms, p95 0.95 → 1.12 ms). Reverted.

**Next**
- **For Anuj's eye:** Vela's buttons are exactly **24px** tall — Vela is the Compact tenant, and `sm` takes the
  control height down by `space-2`. That is the WCAG 2.2 § 2.5.8 floor exactly, passing with nothing to spare.
- **For Anuj's eye:** which figure each brand keeps is now whichever is first in its `content.json` — Available
  balance, Active policies, رصيد النقاط, OPD wallet left, इस महीने की कमाई. Reordering the file swaps it.
- Raise the 5s test timeout on the load-sensitive tests, or give them their own budget (carried over).

---

## 2026-10-01 (phases shipped) — the changelog says what is true, and CLAUDE.md catches up

**Changed**
- **Phases 3, 4 and 5 are badged Shipped — Anuj.** The changelog had them "In progress" while `CLAUDE.md`
  recorded Phase 0–5a as done; the two disagreed and Anuj settled it. The homepage roadmap reads the badges, so
  it followed without a code change.
- **`CLAUDE.md`'s status was three kinds of stale** and is rewritten: Phase 6 is done rather than "2 of 5";
  versions are `react`, `sdui` and `mcp` at 0.1.1 with the other five at 0.1.0, not "all eight at 0.1.0"; and
  the repo is public rather than pending.

**Decided**
- **ADR-037's cold clone was not run, and the entry now says so.** The ADR asked for a clone on a machine
  without this pnpm store *before* `private: false`. The visibility change was made on Anuj's instruction after
  a secret scan of all 101 commits and 6,382 objects — no credentials, no personal data beyond the committed
  author address — but that is not the check the ADR specified. It is still worth running, now as a check
  rather than a gate. Recording it rather than quietly updating the text around it.

**Results**
Separate worktree again; the main checkout is still on another session's branch with uncommitted work. Build
`OBK9ihZkVXIhKrlwQ4HRn`: `check-narrow-overflow` **0** at 320px · `check-hydration` **0** ·
`check-override-weight` clean · typecheck clean. Changelog page renders **0** "In progress" badges; the
homepage roadmap shows all five Shipped.

---

## 2026-10-01 (top-edge highlight) — the other "sheen" comes off too

**Changed**
Having seen ADR-038's result, Anuj asked for the same treatment on buttons. The code calls this a "sheen" as well,
but it is a different token on a different kind of surface: `--syntara-shadow-highlight`,
`inset 0 1px 0 rgb(255 255 255 / 0.20)` in light and `/ 0.12` in dark — a 1px white line along the top edge of a
solid fill, the "pressable key" look from the v0.3 tactile pass.

- It was in **41 places across 29 files**, far wider than the buttons he named: **25 sites in 19 components**
  (Button, Badge, Chip, Checkbox, Switch, Radio, Slider, Progress, Steps, Kbd, Tooltip, Avatar, Chart, FileUpload,
  IconTile, Pagination, Sidebar, Tabs, ToggleGroup) and **16 more in the docs site's own blocks and page CSS**.
- **All 41 are gone, in both schemes.** The docs blocks went with the components: they are examples built from the
  system, and leaving them lit would have left the pages Anuj actually looks at half-changed.
- The engine token is untouched, as ADR-038 left `--syntara-sheen`. The published contract does not move; the token
  simply has no users in this repo now, which `CONVENTIONS.md` § Depth tokens says plainly.
- 18 comments across 16 files rewritten, because they described a highlight that is no longer drawn.

**Decided**
- **All 19 components, both schemes — Anuj**, asked directly. He rejected "Button only" once the shared token was
  shown (a flat button beside a still-lit badge reads as a bug) and rejected "dark only" because the highlight is
  strongest in light. [ADR-039](adr/039-no-top-edge-highlight.md).
- **The engine token stays — Claude**, for consistency with ADR-038 and so no consumer's build changes silently.

**Results** — full `/verify` again, all nine steps:

| Step | Command | Result |
|---|---|---|
| 1 | `pnpm --filter @syntara/react gen:index` | `src/index.ts → 53 modules` |
| 2 | `pnpm typecheck` | exit 0 |
| 3 | `pnpm test` | **2,167 passed, 1 skipped, 0 failed**; `check-test-counts` README row matches at 2,168 |
| 4 | `pnpm test:themes` | 2,000/2,000 palettes, all brands valid, adjustments/brand median **4** (unmoved) |
| 5 | `pnpm check:meta` | **53/53** |
| 6 | `pnpm registry` | 73 items ok |
| 6a | `node scripts/check-override-weight.mjs` | 0 selectors weighing the same as the component |
| 7 | `pnpm --filter @syntara/docs build` | exit 0, **82** pages, build `5DqgIO49jRk82zIPS4xT1` |
| 8 | `node scripts/check-ssr-tabs.mjs` | 327 tab lists, **0** missing panels |
| 9 | `check-hydration` | 228 loads, **0** failures |
| 9 | `check-theme-links` / `check-narrow-overflow` / `check-csp` | **0** failures each (114 routes) |
| 9 | `axe-sweep` | 114 routes × 2 schemes, **0** violation nodes |
| 9 | `check-overlay-exit` | 108 tooltips + 4 menus/popovers, **0** failures |

- **Proof it shipped:** `var(--syntara-shadow-highlight)` appears in **0** files of the export; the token itself is
  still defined in **326** files, which is the point — engine untouched, nothing consuming it.
- **Three earlier test runs failed and none of it was the code.** Load average reached **42.8** (macOS
  `mobileassetd` at 63%, app helpers, another session's dev server). Every failure was a 5,000ms timeout in a test
  unrelated to CSS — theme-engine's sheen fuzz test and two icon tests in `@syntara/mcp`. Isolated it three ways:
  `git diff main -- packages/theme-engine` is empty, the same test passes on `main`, and all pass once load drops.
  **Worth fixing on its own:** a cluster of tests sits right on a 5s budget and goes red whenever the machine is
  busy, which will bite in CI.
- `pnpm test:themes` again rewrote only its timing numbers (median 0.62 → 0.59 ms, p95 0.95 → 0.98 ms). Reverted.

**Next**
- ~~**For Anuj's eye:** Button's pressed state.~~ **Checked and fine.** It no longer differs by shadow, but the press
  still shrinks the control to scale 0.96 (93.53px → 89.79px) and darkens the fill twice over from rest; hover is
  carried by the fill alone. Figures in [ADR-039](adr/039-no-top-edge-highlight.md). A first capture with reduced
  motion on hid the scale and made the press look weaker than it is — measure this one with motion enabled.
- ~~**For Anuj's eye:** Kbd.~~ **Checked, and the worry was wrong.** The claim that "only the bottom edge is left to
  say 'key'" came from a code comment, not a measurement. The cap keeps three of its four layers (ring, weighted
  bottom edge, drop shadow); light mode is visually identical and dark differs only under magnification. ADR-039
  corrected.
- Raise the 5s test timeout on the three load-sensitive tests, or give them their own budget.

---

## 2026-10-01 (one version) — the site stops having a version of its own

**Changed**
- **The hero pill shows the published version of `@syntara/react`** (0.1.1), not the changelog's top heading.
  The site had been showing `v0.5` beside packages published at `0.1.0`: two true numbers, six lines apart,
  that read as a contradiction. Flagged three times and now fixed at the source.
- **The changelog's `v0.N` headings are `Phase N`.** They were always build phases — the file said so in its
  own first line — and calling them versions is what created the collision. Its intro now says the packages
  are versioned separately on npm.
- **The roadmap beside the FAQ reads each phase's real status** from its badge: Phases 1 and 2 Shipped,
  3, 4 and 5 In progress.
- `/docs` said "Phase 1 … shipped as v0.1 … Next is Phase 4, governance", which was both the old scheme and
  out of date. Rewritten without version numbers.

**Decided**
- **Phases and package versions are different things, and only npm's is called a version — Anuj.**
  The alternative was renumbering the changelog to npm versions, which would be false: Phases 1–5 were never
  published to npm, and three of them are still in progress.

**Two faults found while doing it**
1. **The roadmap said every phase had Shipped.** The previous entry here recorded reasoning that an entry in
   the changelog meant a phase had shipped. It does not: the changelog badges three of five "In progress", and
   Anuj's mockup had it right. The status is read rather than inferred now.
2. **Phase 1 carried no badge at all,** so the fallback invented "In progress" for the phase that shipped
   first. It has the Shipped badge it was missing, and a phase with no badge now renders no status rather than
   a guessed one.

**Results**
Built in a separate worktree, because the main checkout was on another session's branch with uncommitted work.
Build `qLqwRH-Fxz9ftUAOn_HM7`, asserted before each reading: `axe-sweep` 114 × 2 schemes **0 violation nodes** ·
`check-narrow-overflow` **0** at 320px · `check-hydration` **0** · `check-override-weight` clean · typecheck
clean.

**Next**
- The changelog still badges Phases 3, 4 and 5 "In progress" while `CLAUDE.md` records Phase 0–5a as done.
  One of the two is stale. Not changed here: that is a statement about where the project stands, and Anuj's
  to make.

---

## 2026-10-01 (sheen) — the metallic band comes off the surfaces

**Changed**
Anuj saw the home page's brand carousel in dark and called the cards metallic. It was one token doing it:
`--syntara-sheen`, a 115° band of `text.default` peaking at 8%, dark schemes only, added 2026-09-27 as layer 1 of
the **Surface recipe** that came from his own toast reference. On a toast it read as a soft light source; on a large
card with a stack of tiles inside it, each carrying the same band, it read as brushed metal.

- **No component paints it any more** — 13 of them did: Card, StatTile, Alert, Toast, Dialog, Sheet, Popover,
  Select, Combobox, Command, DatePicker, DataTable, EmptyState.
- **The engine token is untouched.** It still emits the gradient in dark and `none` in light, because
  `@container not style(--syntara-sheen: none)` is how **14 rules** ask "is this a dark scheme?" without naming one
  — and that is what switches on the **rim light**. Blanking the token at the engine would have taken the rim with
  it in all 13 components. Nothing in the published theme contract moves.
- **The sheen slot stays in the layer list** as `--_sheen: none`, so the recipe keeps its documented shape and the
  band is one line per file from returning.
- `CONVENTIONS.md` § Surface recipe rewritten to match; 18 stale comment blocks across 14 component files updated so
  nothing in the code still claims the band is painted.

**Decided**
- **Remove the band, keep the rim — Anuj**, asked directly and chosen over "remove both" and "keep it, at 3%".
  [ADR-038](adr/038-no-painted-sheen.md).
- **Keep the glass surfaces' 8-point opacity offset — Claude.** It existed only to buy back the contrast the sheen
  cost, so it is now unnecessary, but a more opaque face can only add margin and removing it would be a second,
  unrequested change to seven overlays.
- **Out of scope:** `--syntara-shadow-highlight`, the *other* effect the code also calls a "sheen" — the inset
  top-edge highlight on solid fills (Button, Badge, Checkbox, Switch, Radio, Slider, Progress, Steps, Kbd, and the
  raised pills in Tabs, Pagination, ToggleGroup). Different token, different surface, not what Anuj pointed at.

**Results** — full `/verify`, all nine steps, each with the command that produced it:

| Step | Command | Result |
|---|---|---|
| 1 | `pnpm --filter @syntara/react gen:index` | `src/index.ts → 53 modules` |
| 2 | `pnpm typecheck` | clean, all packages |
| 3 | `pnpm test` | **2,167 passed, 1 skipped, 0 failed** |
| 3b | `node scripts/check-test-counts.mjs` | README matches: 2,168 across 7 packages |
| 4 | `pnpm test:themes` | 118,000 checks, 0 failed, 100.00%; adjustments/brand 0 / **4** / 7 (median unmoved) |
| 5 | `pnpm check:meta` | **53/53** components pass, exit 0 |
| 6 | `pnpm registry` | 73 items + `registry.json`, every item ok |
| 6a | `node scripts/check-override-weight.mjs` | 0 selectors weighing the same as the component |
| 7 | `pnpm --filter @syntara/docs build` | exit 0, **82** HTML pages, build `0AkkO74NriQwjV52p55qb` |
| 8 | `node scripts/check-ssr-tabs.mjs` | 82 pages, 327 tab lists, **0** missing panels |
| 9 | `check-hydration` | 114 routes × 2 schemes, 228 loads, **0** failures |
| 9 | `check-theme-links` | 5 links, **0** failures |
| 9 | `check-narrow-overflow` | 114 routes × 320px, **0** scrolling sideways |
| 9 | `check-csp` | 114 routes under the site's own CSP, **0** failures |
| 9 | `axe-sweep` | 114 routes × 2 schemes, **0** violation nodes |
| 9 | `check-overlay-exit` | 108 tooltips + 4 menus/popovers, **0** failures |

- **Proof the change is in the build measured**, not just that a build exists
  (`grep -rl … apps/docs/out/_next/static`): **0** built stylesheets still paint the sheen as a background layer,
  **2** carry the new empty slot `--_sheen:none`, **5** still carry the rim's `style(--syntara-sheen:none)` query.
- `pnpm test:themes` rewrote only its two timing numbers in `reports/fuzz-report.*` (median 0.62 → 0.61 ms, p95
  0.95 → 1.07 ms, machine noise; pass rate, failures and adjustments identical). Reverted, so the commit says one thing.
- **Contrast only improves.** The band brightened the face in dark, where text is light. Every figure in the
  comments and tests was measured *under* it, so each is now a floor. The proofs still composite the old peak on
  purpose and passed unchanged.
- **Four assertions flipped** from "the sheen is painted" to "it is not", so it cannot come back by accident:
  `card.test.tsx`, `alert.test.tsx`, `toast.test.tsx`, `popover.test.tsx`.
- **Proof it shipped**, read from the live page's computed style on a carousel card (dark, dev server on :3100):
  `background-image: none, linear-gradient(rgb(25,28,32), …), linear-gradient(135deg, … 0.18, transparent 60%)`
  — layer 1 empty, the face flat, the rim still there.
- Port note: `:3000` was held by **another session's** worktree (`duotone-pr`), so this ran on `:3100` and the owner
  of the port was checked with `lsof` before any screenshot was believed.

**Next**
- Anuj to look at the carousel in dark and say whether the cards now read too flat; if so the rim can go up before
  the band comes back.
- Open question for him: whether the solid-fill top-edge highlight above should go the same way. Separate ADR.
- Port note for the next session: `:3000` was held throughout by **another session's** `duotone-pr` dev server, so
  step 9 served this build on `:3200` via `SYNTARA_BASE_URL` rather than killing someone else's server. Each script
  printed the build id it measured (`0AkkO74NriQwjV52p55qb`), which is how we know it was this build.

---

## 2026-10-01 (home v3 layout) — the design, not just the words

**Changed**
Anuj's point, fairly made: the earlier passes changed the copy and the section order and left the design alone.
This is the design, built from `Home3.dc.html` rather than from a screenshot of it, in eight layers.

1. **Foundations.** The accent word is **Instrument Serif** italic at 1.1em, the mockup's one display face; it
   had been the house font slanted. Heading and lead read as one paragraph. The hero is left-aligned.
2. **The showcase labels itself.** A caption read off `brand.json` (`cool · sharp · compact · Inter Tight`), and
   a **Component names** overlay tagging each part of the demo with the component it is.
3. **Components as tiles**, carrying category and maturity, with a count-led filter row and a line naming the
   7 blocks and counting the icons.
4. **The brands section is a carousel** — a snapping rail with arrows that disable at each end.
5. **The data panels** are the mockup's: *Every fix, in a sentence* (the engine's own words) and the
   `brand.json → theme-engine → tokens → react` pipeline, replacing two I had invented.
6. **The agent cards** carry brand and accent faces, with the three trust levels and a decisions banner.
7. **A release roadmap** beside the FAQ, read from the changelog.
8. The four-column footer was already right.

**Decided**
- **The lead stays outside the `<h2>` — Claude.** The mockup puts it inside. A heading containing a paragraph
  of prose is what a screen-reader user hears when navigating by heading, and this site argues against that
  trade on its own accessibility page. Both are `display: inline` in a block wrapper: same look, two elements.
- **Stale figures in the mockup are not copied.** It says 235 icons (243), seven MCP tools (eight), 36
  decisions (37, computed), "Not on npm yet" and "An MCP server, in progress". All are counted from source now.
- **The roadmap says Shipped for all five releases.** The mockup marks three "In progress"; every one has a
  changelog entry, so they shipped. Phase 6 has no entry and is not listed.

**Results**
Static export, build `LB2O-MPApqYjrbluLu_PK`, build id asserted before every reading.

| | |
|---|---|
| `axe-sweep` | 113 × 2 schemes, **0 violation nodes** |
| `check-narrow-overflow` | **0** at 320px |
| `check-hydration` · `check-csp` | **0** · **0** |
| `check-override-weight` | clean |
| `pnpm typecheck` · `pnpm test` | clean · **2,167 passing** |

**Six faults the checks caught that reading did not**

1. **The hero would not left-align.** A `text-align: center` sat at the end of `.hero`, after the change.
   `text-wrap: balance` was also indenting the second line — balance evens a ragged edge, for centred headings.
2. **The name overlay matched nothing.** It keyed on `syntara-<file>__`, the scoped name the *published*
   package uses; the docs app compiles the same CSS Modules itself and emits `<file>-module__<hash>__`.
3. **The Component names switch was wrapped in a `<label>`.** Syntara's Switch takes its label as children, so
   that was an empty label — axe **critical**, a control with no accessible name.
4. **The carousel grew the page by 1127px** at 320px as a column-flow grid, then by **871px** as flex — and the
   second only under `prefers-reduced-motion: reduce`, which is what CI measures with, so a normal browser
   showed nothing. `contain: paint` fixed it; `overflow-x: clip` on the section did not.
5. **The carousel arrows did nothing.** `scrollBy` with `behavior: 'smooth'` left `scrollLeft` at 0 every time —
   snapping mandatory, proximity and none, containment on and off — while the same call without it worked.
6. **`action-accent-*` does not exist.** The second agent card used it with a fallback, so it silently rendered
   as a plain surface rather than accent-coloured. The pair is `accent.bg` / `accent.fg`. A raw
   `rgb(0 0 0 / 12%)` also went in and came back out as `color-mix` on `currentColor`.

**Next**
- The hero pill still reads "53 components" where the mockup reads "Agents release in progress", and the site's
  `v0.5` milestone still sits beside npm's `0.1.0`. Both are Anuj's call.
## 2026-10-01 (GIF out of git) — the demo moves to a release, and the repository is public

**Changed**
- **`docs/media/readme.gif` is deleted from the tree** and `docs/media/` is gitignored. The README points at
  the **`readme-media` release asset** instead, which costs nothing to clone.
- **`scripts/readme-gif.mjs` says so in its header**, with the two commands that publish a new clip:
  `pnpm gif`, then `gh release upload readme-media docs/media/readme.gif --clobber`. No commit involved.
- **New release `readme-media`** holding `readme.gif` (4,849,857 bytes), with notes explaining why it lives
  there rather than in the tree.

**Decided**
- **Forward-only removal, not a history rewrite — Anuj.** Claude laid out three options. The blob is still in
  `main`'s history, in exactly one commit (`419be9f`, the squash of #27). Purging it would have meant
  `git filter-repo` and a force-push to `main`, which was cheap in blob terms but would have rewritten every
  sha and broken the other sessions' in-flight branches. Anuj chose to stop the bleeding rather than rewrite.
  **One 4.6 MB copy is in history permanently; no more will accumulate.**
- **Host on a GitHub release asset — Anuj.** The alternative was dropping the embed and linking the live site,
  which would not have met BRIEF §13's "README with a 30-sec GIF".

**Results**

| Check | Result |
|---|---|
| Asset uploaded | `readme.gif`, **4,849,857 bytes** — byte-identical to the file that was committed |
| README URL, fetched with no credentials (`--no-netrc`, `Authorization:` cleared) | **HTTP 200** |
| Downloaded and identified | `GIF image data, version 89a, 960 x 535`, 4,849,857 bytes |
| Blob still in `main` history | yes — `f493747`, one commit (`419be9f`) |

**The repository is public.** `gh repo view --json isPrivate` returns **false**. This session did not do it;
it happened while the GIF work was in progress, so ADR-037's irreversible step is done. Two things are worth
recording about the state it went out in:

- **The scrub landed first.** `git show origin/main:BRIEF.md` no longer contains the employment description or
  the roles being applied for; §0 reads as the softened version from #23. The pre-publication audit in that
  same PR found no credentials in any commit. So the thing that mattered was in place.
- **The cold-clone test never ran.** ADR-037 listed it as the step before going public, and it was skipped.
  It is now a test of a public repository rather than a gate on publishing it, which is a weaker thing but
  still worth doing.

**A timing failure worth naming.** Anuj asked for the GIF to be moved out of git; by the time the
auto-merge could be disabled, #27 had already merged and the blob was in `main`. Auto-merge had been enabled
two steps earlier at his request, before the GIF was added to that branch — so the thing that landed was not
the thing that was armed. **Enabling auto-merge makes a branch a moving target; do not add a new deliverable
to a branch that is already armed to merge itself.**

**Next**
- **Run the cold-clone test anyway.** `git clone` into a temp directory on a machine that does not share this
  pnpm store, then `pnpm install && pnpm docs`. It is now a bug report rather than a gate.
- **Re-read ADR-037 beside §3 of `2026-10-01-differentiation.md`** — still outstanding, and now after the fact.
  The 21st listing is the part of it the research weakened; going public has happened regardless.
- Unchanged: the `/story` opening scene and its rollout section, both Anuj's; the 21st monorepo question; and
  the shadcn focus-ring claim, still unreproduced after two research passes.

---

## 2026-10-01 (README GIF) — Phase 6's last item, and three cuts to get one honest clip

**Changed**
- **`docs/media/readme.gif`** — 28.5s, 960×535, 12 fps, **4.6 MB**. Vela, Harbor, Qamar, Haat, then dark,
  driven through the homepage's own brand switcher. It is the README's hero now;
  `docs/screenshots/v0.5/home.png` stays as the v0.5 record and is referenced only by this log.
- **`scripts/readme-gif.mjs`, wired as `pnpm gif`.** The script is committed rather than the output alone, so
  the clip is reproducible and the next person does not have to rediscover the framing. Playwright records
  webm, ffmpeg converts. Like the sweeps, it calls `assertServedBuild` first and refuses to record a server
  that is not running this build.
- Playwright's palette is built **once over the whole clip** and then applied; a per-frame palette banded the
  brand ramps.
- The script **fails the run above 10 MB** rather than letting a README quietly grow a 30 MB hero.

**Decided**
- **Care is left out of the walkthrough — Claude.** Its blue reads too close to Vela's indigo to be worth three
  of the thirty seconds. Four brands plus the dark toggle is the demo; five was one beat of nothing.
- **The GIF is committed to the repository — Claude, pending Anuj.** 4.6 MB in a clone is real, and every
  re-record adds another copy to history. Hosting it outside the repo is the alternative and is easy now,
  awkward after ten re-records. Flagged rather than decided.

**Results**

| Check | Result |
|---|---|
| `ffprobe` duration | **28.5 s** against BRIEF §13's "30-sec" |
| `ffprobe` dimensions | 960×535 after the crop |
| File size, from the script's own guard | **4.6 MB**, under its 10 MB limit |
| `assertServedBuild` before recording | passed; recorded against the build in `apps/docs/.next/BUILD_ID` |

The clip was checked by extracting frames with `ffmpeg -ss` and **looking at them**, not by trusting that the
script exited 0. That is how all three faults below were found.

**Three cuts, and what each one got wrong:**

- **Cut one recorded the hero, which is brand-neutral.** Switching brands moved a swatch and nothing else; the
  branded dashboard was below the fold. The script now scrolls to 440px first, so the switcher sits under the
  sticky header and the branded UI fills the frame. A GIF that exits 0 and demonstrates nothing is the same
  class of problem as a screenshot of the wrong build.
- **Cut two still had a flat grey band along the bottom** — headless Chromium painting its own background
  below the page. Removing Playwright's pinned `recordVideo.size` did **not** fix it, which was the first
  guess. The band's height is not stable across machines, so the script samples one frame as raw RGB, walks up
  the middle column counting flat-grey rows, and crops. `ffmpeg`'s `cropdetect` is no use here: it looks for
  near-black letterboxing and the band is mid-grey. On this machine it measured 54px.
- **The README's alt text said five brands and the clip shows four.** Caught before committing.

**Next**
- **Decide whether a 4.6 MB GIF belongs in git.** It is in now; moving it out gets harder with each re-record.
- Phase 6 (BRIEF §13) is **complete**: npm publish, docs deployed, the differentiation re-run, `/story`, and
  this.
- Unchanged and still waiting on Anuj: the `/story` opening scene; the `/story` rollout section, which is a
  claim about how he works; ADR-037 re-read beside §3 of the new research before the irreversible step; the
  cold-clone test; the 21st monorepo question; and the shadcn focus-ring claim, still unreproduced after two
  research passes.

---

## 2026-10-01 (/story) — the case-study page, and a page that already existed

Phase 6's second-to-last item (BRIEF §11, §15). Built, then discovered it had already been built, then merged
the two.

**Changed**
- **New `/story`** — `apps/docs/app/story/page.tsx` + `page.module.css`, with `apps/docs/lib/story.ts` for the
  numbers. BRIEF §11's seven sections in its order: opening scene, the generator live, three tenants side by
  side, numbers, five decisions, the rollout, and what this does not prove. **551 words** of prose against the
  ~600 cap, leaving room for the opening scene, which ships as a loud placeholder card badged "Anuj writes
  this" so it cannot go out unnoticed.
- **Every figure is read at build time from the file its command writes**, and prints that command beside
  itself. A missing report makes the figure disappear rather than go stale. `packages/audit/reports/blocks.json`
  is new and committed, on the same footing as `fuzz-report.json`, because the page reads it.
- **The ADR count is computed, not typed.** `getAdrSplit()` reads each ADR's own `Status:` line, so "37, 6
  pending" cannot drift from the record it describes.
- **The generator section mounts the real `/themes` workspace**, not a copy and not an iframe. The preset list
  moved to `apps/docs/lib/theme-presets.ts` so both pages read one source; a second copy would have silently
  dropped the `copyReview` draft marker on the Hindi and Arabic tenants.
- **`/story` added to `scripts/docs-routes.mjs`.** That list is partly hardcoded, so without the line axe,
  hydration, CSP and narrow-overflow would all have skipped the new page while still reporting green — the
  same shape as the 2026-09-29 finding about a guard covering less than it looks like it covers.
- **Linked from the header's ⌘K pages and the footer**, because a page nothing points at is half-shipped.
- **PR #15's prose folded in** — see Decided.

**Decided**
- **Merge the two `/story` implementations rather than pick one — Anuj.** Claude built this page without
  checking for existing work; **PR #15 had added a `/story` the day before**. Claude laid out three options
  (open this one and close #15, keep #15 and bin this, or merge) and recommended merging; Anuj took it. #15
  reads better but misses four of the brief's seven sections, sits nine commits behind main, and its "what is
  not done" still said nothing was on npm and the docs were not deployed — both false since #16 and #18.
  Four passages moved across nearly verbatim: "a brand has to be data, not code… no component ever learns
  which brand it is rendering"; "a design system that claims accessibility and cannot show it is a brochure";
  the invalid-eval paragraph, which is the best writing on either page; and the who-decided framing. #15 is
  closed, its branch left in place, and #27's body credits it.
- **Section 7 states that RTL is table stakes — Claude, pending Anuj's review.** It follows the re-run in the
  entry above and names shadcn/ui and Untitled UI React. It is the first place that retraction appears on the
  site itself.
- **The rollout in §6 is Claude's draft of how Anuj would work — pending Anuj.** It is a claim about him,
  published under his name, so it should not ship unread.

**Results**

| Check | Result |
|---|---|
| `pnpm --filter @syntara/docs exec tsc --noEmit` | exit **0** |
| `pnpm --filter @syntara/docs build` | exit **0** |
| `pnpm drift apps/docs/app/story apps/docs/lib/story.ts` | **100.0 / 100**, 142 places, **0 findings** |
| `node scripts/check-override-weight.mjs` | clean |
| axe over `/story`, light and dark, same tags and viewport as `axe-sweep.mjs` | **0 violations, 0 nodes** |

The axe run scrolls the page first, because the tenant shots are lazy and would otherwise never load; the
one-off script is not committed. `served-build.mjs` was run before every measurement, and the serve ports were
4317–4322 rather than 3000, so no run could have measured another session's build.

**Four things this page got wrong first, each caught by a check rather than by reading it back:**

- **`next/image` emitted `/_next/image`**, which does not exist in a static export (ADR-030). All three tenant
  shots would have 404'd in production. Now a plain `<img>`, as the rest of the site uses — this page was the
  first and only use of `next/image` in the repo.
- **Four of the five ADR links pointed at routes that do not exist** (`/docs/foundations/*`, invented rather
  than read). All five resolve in the export now.
- **The brand-inputs figure printed 7**, against the site's own "six brand inputs", because it counted `name`.
  `name` is the display name; the six that drive a theme are primary, accent, neutral, shape, typePair and
  density.
- **`.placeholder` sits on a `Card` and weighed the same as it.** `check-override-weight.mjs` caught it and
  `--fix` doubled it. The comment at the top of the stylesheet had claimed nothing on the page restyles a
  component; it was wrong and now says what actually happened.

**Next**
- **The opening scene is Anuj's to write.** One paragraph, first person, the Thursday moment. The placeholder
  is deliberately hard to miss.
- **The rollout section wants Anuj's read** before it is published as his approach.
- **The README GIF** is the last Phase 6 item (BRIEF §13).
- **A full-page screenshot of `/story` shows the three tenant shots blank**, because `shoot.mjs --full` does
  not scroll and the images are lazy. They render correctly for a reader. Either the script should scroll
  before shooting or those images should load eagerly; until one of those happens, a screenshot of this page
  is misleading evidence, which is the same trap as a screenshot of the wrong build.
- **Check for an existing branch or PR before building a named deliverable.** This session built `/story`
  twice. `gh pr list --state open` would have cost one command.
- Carried: the cold-clone test, the monorepo question, ADR-037 re-read against the new research, and the
  shadcn focus-ring claim still unreproduced.

---

## 2026-10-01 (home v3) — read the mockup's source instead of guessing at a screenshot

**Correction, same day.** This session ran its own four-pass re-run in parallel with the one that produced
`docs/research/2026-10-01-differentiation.md` (#25), and the two disagreed on a verifiable point. One pass here
reported that Untitled UI React's components ship *physical* Tailwind classes and that RTL is a codemod over
your files. Reading https://www.untitledui.com/react/docs/rtl directly: "Our components use CSS logical
properties that automatically adapt based on the document direction", and the `migrate` CLI converts physical
classes "across **your** project" — the consumer's code, not their components. The pass inferred the mechanism
from the codemod's existence and the inference was wrong. **#25's retraction stands: RTL is not a
differentiator.** Their component source is behind authentication, so this rests on their documentation rather
than on inspection, which is the most either session can honestly say.


**Changed**
- **The hero lead gains its second sentence** from the mockup: "53 React components, built by a design engineer,
  ready for agents." This partly reverses the one-sentence hero from the 30 Sep (hero) entry; Anuj's mockup puts
  a version of the claim back, so it goes back.
- **The component gallery filters by category**, as the mockup does: a chip per category with its count, "All"
  first with 53, and a live "Showing N of 53" line. It was a flat list of all 53 before.
- **The FAQ carries Anuj's own answers**, numbered 01–07, replacing the ones drafted here blind.

**Decided**
- **Three of the mockup's answers are overtaken, so they were corrected rather than copied — Claude, pending
  Anuj.** The mockup says Syntara is *not* on npm and tells people to copy source "when the packages ship"; they
  shipped this morning. It calls the MCP server "in progress"; it is `@syntara/mcp@0.1.0`. It has **eight**
  tools, not the seven the mockup said and a check here wrongly confirmed — that check grepped only
  `get_`/`list_`/`find_`/`search_` names and missed `audit_snippet`, so it returned the number it was looking
  for. The wrong figure reached the branch before the research re-run caught it.
- **The "36 decision records" correction was wrong, and Anuj was right.** `ls docs/adr/*.md` counts
  `000-template.md`, which is a blank form, not a decision. At the commit where this copy was written there were
  37 files and so **36** records — the mockup's figure. ADR-037 has since landed, making it 37 for real, so the
  published number is accidentally correct. It is computed now (`getAdrCount()`, excluding the template) rather
  than typed, because every other figure on that page already is. Everything else is Anuj's wording, unchanged.
- **The mockup's stale hero note was not copied either.** "Not on npm yet. Copy the source today." would have
  undone the morning's work.

**Results**
Static export on port 3243 (build `WM0VVsbshObRtB76P42YV`), build id asserted before every reading.

| | |
|---|---|
| `axe-sweep` | 113 × 2 schemes, **0 violation nodes** |
| `check-narrow-overflow` | **0** scrolling sideways at 320px |
| `check-hydration` · `check-csp` | **0** · **0** |
| `check-override-weight` | clean |
| `pnpm typecheck` | clean |

Filter verified by driving it: Inputs 13, Overlays 7, All 53, counts matching the chips and `aria-checked`
following the selection.

**Two faults the checks caught**

1. **`color-contrast`, 1 node.** The count inside an unselected filter chip had `opacity: 0.7`, which put
   `text-subtle` at **3.25:1** on the light canvas. Removed; it inherits the chip's colour, which passes. This is
   the second time a decorative dimming has cost contrast — worth remembering that opacity on a token is a
   contrast change, not a style.
2. **`.faqNumber` weighed the same as the Accordion rule it sits inside.** Doubled, per the repo's own rule.

**Next**
- **I should have read the mockup file, not the screenshot.** Working from the image I got the structure right
  but missed the hero's second sentence, the category filter and the numbered FAQ, and I invented seven answers
  Anuj had already written. The file was available for the asking.
- The version schemes are still split: the hero pill reads `v0.5` from the changelog, npm reads `0.1.0`.

---

## 2026-10-01 (differentiation re-run) — RTL stops being a differentiator, and the solver is what is left

The re-run BRIEF §13 puts first in Phase 6, and `2026-09-27-differentiation.md` §7 asked for. Primary pages
read in a browser today; no subagents, no search summaries.

**Changed**
- **New [`docs/research/2026-10-01-differentiation.md`](research/2026-10-01-differentiation.md).** It supersedes
  the 2026-09-27 file, which now carries a banner at the top saying so and naming the one finding that was
  retracted.

**Decided**
- **Syntara stops claiming RTL as a point of difference — Claude, pending Anuj's review.** This is a retraction,
  not a refinement. The old file's table read "shadcn has it as an opt-in transform with manual exceptions.
  Syntara's is by default." Today shadcn's RTL page opens with "first-class support", its CLI converts
  `left-*`/`right-*` to `start-*`/`end-*`, updates directional props and flips icons with `rtl:rotate-180`; and
  **Untitled UI React** — the stack the old file called closest to Syntara and never checked — ships logical
  properties on the components, documents `I18nProvider` for React Aria's portalled overlays, and has a
  `migrate` CLI. That is Syntara's own mechanism and Syntara's own portal fix (ADR-012). "RTL by default,
  unlike the others" is now on the must-not-claim list.
- **The differentiator is the solver, and only the solver — Claude, pending Anuj's review.** Not React Aria
  (Untitled UI React and HeroUI v3 both use it), not RTL, not tokens, not an MCP server. Everyone lets you
  theme; nobody *solves* a theme to pass and fixes what fails. That is the one sentence the site and `/story`
  should carry.
- **21st.dev is a backlink, not an audience — Claude, pending Anuj's review.** Worth doing because it is cheap;
  not worth reading as evidence that design-engineer registries are Syntara's market. See Results.

**Results**

Counts taken from each live page's own text in the browser on 2026-10-01, via
`(t.match(/contrast/gi)||[]).length` and the same expression for the other terms.

| Page | contrast | WCAG | accessib* | multi-brand |
|---|---|---|---|---|
| `ui.shadcn.com/docs/theming` | **0** | **0** | **0** | **0** |
| `untitledui.com/react/docs/theming` | **0** | **0** | **0** | — |

- **Untitled UI React** asks you to pick a Tailwind palette or hand-write eleven shades, and its own FAQ says
  the quiet part: *"Just make sure to define all the necessary color shades (from 50 to 950) for a consistent
  look."* Multi-brand is "multiple theme files… using CSS scoping techniques" — hand-rolled, exactly as the
  previous research predicted of everyone else.
- **tweakcn** still checks rather than solves: its landing page advertises a "Contrast Checker", and
  `/guarantee|solve|auto-?fix/gi` returns **0** matches on it.
- **shadcn/ui** pairs `--primary` with `--primary-foreground` as a naming convention. Nothing checks that the
  pair is legible.
- **21st.dev moved from [U] to [V].** Submissions go `on_review` → `posted` → `featured` with the maintainer
  reviewing each one personally; open-source templates are rehosted pinned to a commit; paid ones run $19–$99.
  What that market rewards, by category size: Buttons 2043, Cards 1780, Forms 1522, Heroes 1152 against Sign
  Ins 103, Toasts 79, Empty States 77, with scroll animations and liquid-glass buttons at 6–10k bookmarks.
  **Documentation: 11 templates out of roughly 700.** The shelf is empty, and the same numbers say why.

Three of the five follow-ups from 2026-09-27 are closed (Untitled UI React in depth; 21st's review process and
payouts; the re-run itself). Two carry forward, plus a new one: HeroUI v3 and coss ui were **not** re-read
today, so their rows are carried over and are [S] at best.

**Next**
- **The shadcn focus-ring contrast claim is still uncited and still unreproduced**, and its source sells a
  competing kit. Either reproduce it with a script or drop it; it has survived two research passes unverified.
- **Re-read HeroUI v3 and coss ui** before either appears in a comparison.
- **`/story` and the README GIF** are the two Phase 6 items left (BRIEF §13), and both should now lead with the
  solver rather than the stack.
- **ADR-037's premise is weaker than when it was written.** It was decided before this research; the research
  says 21st's audience is not Syntara's. The decision to go public stands on its own merits, but the 21st
  listing part of it is now a nice-to-have. Worth Anuj re-reading ADR-037 with §3 of the new research next to
  it before the irreversible step.
- Unchanged from the previous entry otherwise: the cold-clone test, and the monorepo question, both still open.

---

## 2026-10-01 (public-eyes pass) — the repo stops describing its author's job search

Groundwork for making the repo public and listing the site on 21st.dev. A read-only audit first, then a
prose-only scrub. No code changed.

**Changed**
- **`BRIEF.md` §0 drops the employment description.** "Senior Product Designer, 7 years, founding designer at a
  white-label B2B2C platform… moving into Lead / Staff Product Designer and UX Design Engineer roles" became "a
  product designer who has built multi-brand systems — one product rendered as many client brands." The bar the
  repo has to clear is still stated; the job search is not. Public and permanent means searchable, including by
  a current employer, and that is the one finding in this audit with a personal consequence rather than a
  presentational one.
- **Five more places stop addressing interviewers and state the rule instead.** `BRIEF.md` §13 ("it's the proof
  the policy is real"), §14 twice (the log is "the project's timeline"; who-decided has to be legible to "a
  reader"), the Figma track ("a first-class deliverable, judged alongside the code"), `CLAUDE.md`'s opening ("it
  is maintained to a standard where…"), `docs/adr/000-template.md` ("the maintainer decided vs. what the agent
  recommended"), and `docs/research/2026-09-27-differentiation.md` ("anywhere public").
- **`GOVERNANCE.md` §5 is deliberately unchanged.** Saying out loud that this is one maintainer, and marking
  what is and is not enforced by a script, is the honest claim the rest of that file rests on. Removing it to
  look bigger would be the dishonest edit.
- **[ADR-037](adr/037-public-repo-and-21st-template.md)** records the decision. Numbered 037, not the 027 this
  session first planned: 027 is the tooltip ADR, and the wrong number came from `CLAUDE.md`'s status line, which
  still lists the open ADRs as 024–026 and is three phases out of date. **`CLAUDE.md`'s status section is stale
  and was not corrected here.**
- **The nine Phase 1 screenshots are regenerated** (`pnpm screenshots`). They said "Strata | Brand Generator
  v0.1"; they now say Syntara. The regeneration also caught real drift the old images predated: the token count
  moved 316 → 339 and the neutrals row gained a fourth option, "Paper".
- **Three docs-site screenshots are reshot into a new `docs/screenshots/v0.5/`** — home, themes and the Button
  component page — and `README.md`'s hero image points at `v0.5/home.png`. A new folder rather than overwriting
  `v0.2/`, because the site is on v0.5 (the changelog's top heading) and regenerating inside a folder named for
  v0.2 would make the name a lie. The stale `v0.2/` images are left as the v0.2 record; nothing references them
  any more except this log.

**Decided**
- **Publish the whole repo open source, MIT, and list the site as a 21st.dev template — Anuj.** Claude laid out
  three options and recommended the narrow one: publish only the docs-site shell with a neutral tenant and
  placeholder copy, keeping the five real brands and the written content out of it. Anuj chose the whole repo
  for reach, having been told once that public + MIT cannot be recalled, that 21st rehosts a pinned commit, and
  that anyone may then ship the portfolio site commercially keeping only the copyright line.
  **[ADR-037](adr/037-public-repo-and-21st-template.md).**
- **Soften `BRIEF.md` §0 rather than leave it or move it to an untracked file — Claude recommended, Anuj
  accepted.** Leaving it keeps a searchable job-hunt notice; cutting it entirely loses the explanation for why
  the standards sit where they do.
- **Keep `GOVERNANCE.md` §5 and reword the other five — Claude recommended, Anuj accepted.** The alternative,
  removing the framing everywhere, risks the repo reading as though it claims to be a staffed project.
- **Apply the scrub in a fresh worktree rather than on the branch that was checked out — Claude.** See Results.

**Results**

Pre-publication safety audit. Every row is the command and what it returned on 2026-10-01.

| Check | Command | Result |
|---|---|---|
| Secret-shaped tracked files | `git ls-files` piped through `grep -Ei '\.env\|secret\|credential\|\.pem$\|\.key$\|token'` | 20 hits, **all false positives** — the word "token" in design-token code |
| `.env` on disk | `find . -name '.env*' -not -path '*/node_modules/*' -not -path './.git/*'` | **none exist** |
| Credentials in history | `git log -p --all` piped through `grep -Eo 'sk-ant-…\|sk-…\|gh[pousr]_…\|AKIA…\|AIza…'` | **nothing**, across all 65 commits |
| How the eval authenticates | `grep -rn "API_KEY\|apiKey\|process\.env" evals/*.mjs` | spawns the `claude` CLI and inherits `process.env`; **no key stored** |
| Personal contact details | grep for email, LinkedIn and phone patterns over all tracked text | **none**; the only identifier is `@anujpatel06` in `.github/CODEOWNERS`, which is wanted |
| Tracked agent config | `git ls-files .claude` → 9 files, grepped for `/Users/`, `/home/`, `C:\` | **clean**; no absolute paths, no local config |
| Tenant copy realism | grep for ~30 real bank, retailer and payment brands over `tenants/*/*.json` | **no real company passed off as a client**; people, card numbers and `app.vela.example` are invented |
| Tracked images | `git ls-files` counted against `\.(png\|jpg\|jpeg\|gif)$` | 23, all under `docs/screenshots/` |

Two findings from that audit are **not** fixed here:

- **The README's hero image is wrong three ways.** `docs/screenshots/v0.2/home.png` shows the logo reading
  **"Strata"** (the pre-rename name), the badge **"v0.2 · 41 components"** against the README's 53, and the
  install line `npx shadcn@latest add @strata/button` — the old scope *and* the shadcn path reversed by the
  ADR-011 revision. The three `phase-1` images carry "Strata | Brand Generator v0.1" too. The ten `phase-5a`
  images are fine: they are tenant renders and carry no Syntara chrome. This is the first thing a visitor sees
  on GitHub and in a 21st listing.
- **Tenant copy uses real trademarks descriptively** — UPI ×16, WhatsApp ×7, IMPS ×4 across
  `tenants/*/content.json` and the block content files. Normal and defensible for a realistic Indian fintech and
  reseller demo. Recorded, not changed.

After the scrub, over every tracked `.md`, `.json`, `.ts` and `.tsx` except `docs/log.md` (1,455 files):

| Pattern | Result |
|---|---|
| `interview\|recruit\|hiring\|Lead/Staff\|moving into` | **NONE** |
| `white-label\|B2B2C\|7 years\|founding designer\|Senior Product Designer` | **NONE** (one unrelated hit: Razorpay Blade's white-labelling, in the competitor research table) |
| `portfolio project` | **`GOVERNANCE.md:5` only** — intended |

`pnpm typecheck && pnpm test` was **not** run. A grep for `BRIEF\.md\|000-template\.md\|2026-09-27-differentiation`
over every tracked `.ts`, `.tsx`, `.mjs`, `.js`, `.yml` returns nothing, so no script, test or CI job reads any
of the four edited files; a green suite would have proved nothing about this diff. The greps above are the check.

**Two sessions were live in the same checkout again.** This session started on `docs/phase-6-status` with two
modified files; by the time the audit finished, `git status` reported `feat/home-layout` on a clean tree and the
reflog showed `commit (merge): Merge main into feat/home-layout` **three minutes earlier**. The scrub was
therefore applied in a new worktree, `.claude/worktrees/chore+public-eyes-scrub`, branched from `origin/main`'s
tip (`git rev-list --count HEAD..origin/main` = 0), leaving `feat/home-layout` untouched. Second recorded
occurrence in this checkout.

**21st.dev, read on 2026-10-01.** Page reads, not script output — no number here is a Syntara metric.

- It hosts components, templates and shadcn themes. There is no way to list a website as such; a whole site is a
  **template**, and `/publish/template` exists behind sign-in.
- Two library lists: **143 "On 21st"**, which authors uploaded, and a **shadcn directory of ~360 registries**
  crawled from public repos and ranked by GitHub stars. **React Aria is in the directory** (154 components,
  ★16k) without ever having published. A crawled author page carries the banner *"21st created this page
  automatically… This person has not signed up for 21st"* — Fancy Components has 3.9M views and 17.4K bookmarks
  on exactly that basis. Being crawled, rather than publishing, is the route with precedent.
- The component market rewards marketing spectacle, not primitives: Buttons 2043, Cards 1780, Forms 1522,
  Heroes 1152, against Sign Ins 103, Toasts 79, Empty States 77; the popular list is scroll animations, shaders
  and liquid-glass buttons at 6–10k bookmarks each. **Documentation templates: 11**, out of roughly 700 — the
  thinnest shelf on the site, and the one Syntara fits.
- Open-source templates are **rehosted by 21st pinned to one commit, licence intact**, installed with
  `npx @21st-dev/cli@latest template add <slug>`; the listing shows repo, licence and commit sha.
- `curl -s -o /dev/null -w '%{http_code}' https://syntara.pages.dev` → **200**, so the "Open preview" link a
  listing needs already exists.

Screenshot runs. The first `pnpm screenshots` **failed** — `vite: command not found`, because a fresh worktree
has no `node_modules` — and the failure was hidden by piping the command through `tail`, so the shell reported
exit 0 over "✗ Generator build failed (exit 1)". Every run below captures the real exit code.

| Run | Result |
|---|---|
| `pnpm install` in the worktree | 599 packages, **done in 5.7s** |
| `pnpm screenshots` | **9 screenshots**, axe on 6 preview pages, **0 violations**, real exit **0** |
| `pnpm --filter @syntara/docs build` | exit **0**, `apps/docs/.next/BUILD_ID` = `cdDwFGlplCAbXnamqi967` |
| `serve out -l 4317`, then `scripts/served-build.mjs http://localhost:4317` | exit **0** — the served build is this one. `lsof -nP -iTCP:4317 -sTCP:LISTEN` confirmed pid 3235, the server this session started |
| `scripts/shoot.mjs` ×3 at 1440×900 | home, themes, component-page saved, exit 0 each |

The images were then opened and read, not trusted from the exit codes. `phase-1/vela-light.png` now reads
"Syntara | Brand Generator v0.1". `v0.5/home.png` reads "Syntara", the pill reads **v0.5 · 53 components**
against the old "v0.2 · 41 components", and the install line is "The packages are on npm" where it used to be
`npx shadcn@latest add @strata/button`. `v0.5/component-page.png` no longer shows the "Registry" nav entry or
the "Registry item" button — both removed by the ADR-011 revision, both still present in the old image — and
installs with `pnpm add @syntara/react @syntara/tokens`.

The docs build was run, not `next dev`, so the gotcha where `next dev` rewrites `apps/docs/AGENTS.md`,
`apps/docs/CLAUDE.md` and `next-env.d.ts` did not apply; `git status` after the run showed only the intended
files.

**The hero was then shot twice,** because the homepage changed underneath it. `#22` (the entry below this one)
landed on `main` while this branch was open and rewrote `apps/docs/app/page.tsx`,
`apps/docs/components/home/sections.tsx` and `sections.module.css`, so the first `v0.5/home.png` was already a
picture of the old homepage. Merging `main` in conflicted only on this file — two entries at the top, both
kept — after which the site was rebuilt (`BUILD_ID` `cdDwFGlplCAbXnamqi967` → `i8gQFW-TKfCIOAzUNJ_i3`),
`served-build.mjs` re-checked the served copy, and the hero was reshot. The rebuild was proved to contain the
merged homepage before the shot, not after: three strings that exist only in #22's diff — "Values change, never
names", "Scope a theme to one screen", "How theming works" — were grepped out of `apps/docs/out/index.html`.
Above the fold the two shots look nearly the same; #22's new sections are below 900px at 1440 wide.

**Next**
- **Prove a clean clone runs.** `pnpm install && pnpm docs` from a fresh clone in a temp directory, not from a
  working copy with a warm store and an existing `node_modules`. This is the last real engineering risk before
  the repo is public. Partly evidenced already: this worktree started with no `node_modules`, and `pnpm install`
  then a full docs build both succeeded from it. A worktree shares the pnpm store with the main checkout, so it
  is not the same test as a cold clone on another machine.
- ~~`CLAUDE.md`'s status section is three phases stale.~~ Fixed in this session. It listed the open ADRs as
  024–026 when the repo holds 037, which is what produced the wrong ADR number here. The waiting-on-Anuj line
  now names all seven open ADR questions (020, 024, 025, 026, 032, 034, 035, read from each file's Status
  line), a Going public bullet tracks the ADR-037 work, and a closing line tells the next reader to check
  `ls docs/adr/` rather than trust the number.
- **Then, and only then,** `gh repo edit --visibility public`. Irreversible.
- **Open question, worth answering before that irreversible step:** 21st's open-source templates all appear to
  be single runnable apps, and whether a pnpm monorepo is accepted is unknown. If it is not, `apps/docs` has to
  be extracted, and the chokepoint is `apps/docs/lib/repo.ts` — `REPO_ROOT = cwd/../..`, read at build time for
  `tenants/*` and `packages/react/meta/*` — plus the literal `../../` in `tsconfig.json`, `next.config.mjs`,
  `blocks/tenant-content.check.ts` and `lib/meta-types.ts`.
- **Unrelated housekeeping:** `.claude/worktrees/heuristic-noyce-7a829a` is 1.2 GB on disk and untracked.

---

## 2026-10-01 (home) — the homepage in Anuj's layout, and the brand reaches the whole page

**Changed**
- **New order and new copy, from Anuj's mockup.** Accessibility moves above brands; the heads become
  "118 checks a brand. *Zero failures.*", "One card. *Five brands.*", "Brands are *data*, not code.",
  "Built by a *person*. Read by agents.", "53 components on *React Aria*." and "Questions, *straight* answers."
  The closing lead is now "Copy a button today, and tell me when it's wrong."
- **Three new sections.** *Brands are data, not code* — four panels generated at build time from
  `tenants/vela/brand.json` and the theme the engine makes from it, so the numbers cannot drift from the engine.
  *53 components on React Aria* — every component as a chip with its maturity badge, counted from `meta.json`.
  *Questions, straight answers* — seven answers drafted from the ADRs, GOVERNANCE and the measured figures.
- **The Ship section is gone — Anuj.** Distribution lives on `/docs/installation`, which the hero links to.
- **The selected brand now colours the whole page, not just the hero — Anuj.** `HomeStage` wraps every section,
  and each section's one accent word is a `HeroAccent`. Surfaces stay on the house theme on purpose: only
  `text.brand` follows the pick, and only for tenants whose `text.brand` already passes on the house canvas.

**Results**
Measured against the static export on port 3230 (build `8HrTRDrx5RM27zc8r6T-L`), asserted with
`assertServedBuild` before every reading; port 3000 was another session's server and was left running.

| | |
|---|---|
| `axe-sweep` | 113 routes × 2 schemes, **0 violation nodes** |
| `check-narrow-overflow` | 113 routes at 320px, **0 scrolling sideways** |
| `check-hydration` | 113 × 2, **0 failures** |
| `check-csp` | 113, **0 failures** |
| `check-override-weight` | every override outweighs the component's own rule |
| `pnpm typecheck` / `pnpm test` | clean · **2,167 passing** |

Accent contrast, measured in the browser for every selectable tenant in both schemes: worst **8:1** (Harbor,
light) against 4.5:1 required. `Care` falls back to `house` because its `text.brand` does not clear the house
canvas — the existing guard, working.

**Four things the checks caught that review had not**

1. **`target-size`, 2 nodes.** The new "Browse all 53" link is a `.textLink`, which was 21px tall. Elsewhere on
   the page those links pass on *spacing*, not size; this one had the chip grid inside its 24px clearance, so it
   failed. `.textLink` now has `min-block-size: 24px`, which does not depend on what sits next to it.
2. **113 routes scrolling sideways at 320px — a regression I introduced.** The new `.panel` is a flex column
   holding a `CodeBlock`; a flex item defaults to `min-width: auto` and will not shrink below its content, and
   `.panelGrid`'s implicit `auto` track did the same. Both are `minmax(0, 1fr)` / `min-inline-size: 0` now.
   Confirmed a regression, not a pre-existing fault, by measuring the deployed main at 320px: 0px over.
3. **Every section accent rendered in `text.default`, not `text.brand`.** `HeroAccent` puts
   `data-syntara-theme` on the span, and the global `[data-syntara-theme]` rule is an attribute selector — the
   same weight as one class — so a bare `.titleAccent` lost on source order. The hero has always been
   `.heroTitle .heroBreak` for this reason; the section accents are now two classes too.
4. **"Seven inputs" and `0.6158544999999549 ms`.** The first counted `name` as a brand input — it is the
   tenant's label, and the six are primary, accent, neutral, shape, typePair and density, which is what the hero
   and BRIEF §3 say. The second interpolated a raw float.

**Next**
- **The FAQ answers are mine, not Anuj's.** Seven answers drafted from the repository; they state what the site
  already claims elsewhere, but they are prose in his voice and want his read before anyone sees them.
- The version schemes are still split: the hero pill reads `v0.5` from the changelog, npm reads `0.1.0`.

---

## 2026-10-01 — the CSP check survives a network blip, and CI stops assuming port 3000

**Changed**
- **`scripts/check-csp.mjs` no longer dies on a dropped connection.** Its Playwright route handler replays every
  document through `route.fetch()` to attach the policy from `_headers`, and that call sat outside any `try`. A
  throw inside a route handler is an unhandled promise rejection, so one `read ECONNRESET` from the local `serve`
  took the process down with a `node:internal/process/promises` trace and no mention of which check had failed —
  that is how a docs-only pull request (#20, touching `CLAUDE.md` and `docs/log.md`) failed the `verify` job.
- **A dropped document fetch is retried three times** (150 ms then 300 ms; `SYNTARA_FETCH_ATTEMPTS` overrides).
  A reset against a static local server is a flake, not a policy finding, so it should not be either a crash or a
  CSP failure.
- **When it does give up, it says so in the check's own words.** Transport faults are tracked apart from CSP
  findings and reported per route as `transport error after 3 attempts, not a CSP failure — <message>`, with a
  closing line naming the server that stopped answering and how to look for it. The run still exits 1: a route
  that was never fetched was never measured under the policy, the same rule `axe-sweep.mjs` applies to a route it
  could not scan.
- **A last-resort `unhandledRejection` / `uncaughtException` handler** prints what the script was doing and that
  the fault is transport, not CSP, so no future escape re-reads as a Node internals trace.
- The count of retried fetches is printed when it is non-zero, so a run that was rescued does not look identical
  to a run that had a clean network.
- **The `verify` job no longer assumes `serve` took port 3000.** It backgrounded `serve`, curled
  `http://localhost:3000/` in a readiness loop, and ran four browser checks against that address. `serve` falls
  back to a random port when 3000 is taken and still exits 0, so on a busy runner that loop waited out its sixty
  iterations against a stranger's server and continued anyway. It now reads the port from `serve`'s own output and
  exports `SYNTARA_BASE_URL`, which is what the `a11y` job has always done — the two jobs now do this identically,
  and the step carries a comment saying to keep them that way. All six sweep scripts already default to
  `localhost:3000` and already take `SYNTARA_BASE_URL`, so nothing else moved.

**Decided**
- **A transport fault fails the run rather than being skipped — Claude recommended, pending Anuj.** The
  alternative was to drop unreachable routes from the denominator and pass. Rejected for the reason written into
  `axe-sweep.mjs` on 2026-09-29: an unmeasured route must not read as a clean one.

**Results**
Docs built (`pnpm --filter @syntara/docs build`), `apps/docs/.next/BUILD_ID` = `G8FJmhb3nnPq50JzweqYj`, served
with `pnpm --filter @syntara/docs start`, build id asserted by `scripts/served-build.mjs` on every run below.
`serve` was asked for 3000 and took 56029, then 57092 — the gotcha, live — so every run passed
`SYNTARA_BASE_URL`, which this script already honoured.

| Run | Result |
|---|---|
| `node scripts/check-csp.mjs`, full sweep | build `G8FJmhb3nnPq50JzweqYj`, **113 routes, 0 failures**, exit 0 |
| Server killed mid-run (`kill -9` the listener after 7 s) | loaded 16, **97 failures, all labelled transport error**, `fetches retried: 194`, exit 1, **0 lines matching `triggerUncaughtException\|node:internal`** |
| Two document fetches reset with a real TCP RST, server otherwise up | 4 routes, **0 failures**, `fetches retried: 2`, exit 0 — the blip was ridden out |
| The **pre-fix** script, one document fetch reset | `route.fetch: read ECONNRESET` at `check-csp.orig.mjs:39:27` over a `node:internal/process/promises` trace — the CI failure reproduced verbatim |

Fault injection used a throwaway TCP proxy in the scratchpad that sends an RST to the document request (the one
asking for `text/html`; `route.fetch` does not replay `sec-fetch-dest`, so that header cannot be used to find it)
and proxies everything else through. It is not committed. The kill test also settled a question the retry loop
depends on: `route.fetch()` can be called again on the same route, which the 194 retries show.

Audited the sibling scripts for the same shape: every other `ctx.route` handler in `scripts/` fulfills from a
local file or a static body, so `check-csp.mjs` was the only one exposed to a network fault.

The workflow change was run, not just read. Port 3000 on this machine was already held by another session's
`serve` — the gotcha, unprompted — so the condition was real. The `Serve the export` step's text was extracted
from `ci.yml` by a YAML parser and executed verbatim under `bash` with `GITHUB_ENV` pointed at a temp file:

| Run | Result |
|---|---|
| The extracted step, port 3000 busy | `serve` took **57367**; step wrote `SYNTARA_BASE_URL=http://localhost:57367` |
| `check-hydration.mjs` at that port | build `G8FJmhb3nnPq50JzweqYj`, 113 routes × 2 schemes, 226 loaded, **0 hydration failures** |
| `check-theme-links.mjs` | 5 links, **0 failures** |
| `check-narrow-overflow.mjs` | 113 routes at 320px, **0 scrolling sideways** |
| `check-csp.mjs` | 113 routes, **0 failures** |
| `check-csp.mjs` at the old hardcoded `:3000` | exits 1: *"is serving build (unknown), but apps/docs/.next holds G8FJmhb3nnPq50JzweqYj"* |
| `curl -sf http://localhost:3000/` | fails — the readiness loop it replaced would have spun 120 s and continued regardless |

That last pair is the honest shape of the old bug: `served-build.mjs` already stopped a wrong-build measurement
from passing, so a busy port cost a spurious red job with a clear message, never a false green. `ci.yml` parses and
the `verify` job's step order is unchanged apart from the split.

**Next**
- **Two jobs now start a server the same way, and nothing enforces that.** If a third sweep arrives, the port
  handling will be copied a third time by hand. A shared composite action or a small script would make it one
  thing; not worth it at two, worth watching at three.
- Unchanged from the previous entry otherwise.

---

## 2026-09-30 (published) — all eight packages are on npm, and the site stops saying they are not

**Changed**
- **The `@syntara` scope is reserved and all eight packages are published at 0.1.0:** `react`, `tokens`,
  `theme-engine`, `icons`, `sdui`, `audit`, `mcp`, `codemods`. Anuj created the npm org and ran every publish;
  this session could not and did not handle his credentials.
- **Every "not on npm yet" claim is gone:** the callout at the top of `installation.mdx`, the hero note on the
  homepage, and the two `Not on npm yet` badges on the Ship cards (now `v0.1.0`). `README.md`'s distribution line
  and its "Coming" line, and `CLAUDE.md`'s status.
- **The hero line names no version.** The pill above it shows the site's milestone (`v0.5`, read from the
  changelog's top heading by `getReleaseInfo()`); the packages are on `0.1.0`. Both are correct and they are six
  lines apart, which reads as a contradiction, so the hero says "The packages are on npm" and the Ship cards carry
  `v0.1.0` beside `pnpm add @syntara/react`, where it cannot be misread. Reconciling the two schemes is a real
  decision and is left to Anuj.
- **The hero keeps its one line rather than getting its install block back.** The block was removed because it
  promised a package that did not exist; that premise has inverted, but the demo is still the page's argument and
  the command still belongs on `/docs/installation`. The comment above it says so, so the next reader does not
  restore the block by reflex.

**Results**
Verified against the public registry, not local tarballs. A clean `npm install` outside the workspace, then:

| | |
|---|---|
| `ThemeScope` + `Button` | render with `data-syntara-theme="vela" data-syntara-scheme="dark"` |
| `IconCheck` | renders |
| `generateTheme` (Vela) | 118 checks, **118 passed, 0 failed** |
| `@syntara/tokens` | `syntara.css`, 82 kB, 1,368 token declarations |
| `tsc --module nodenext --moduleResolution nodenext`, `skipLibCheck: false` | **0 errors**, all four typed packages |
| `@syntara/react` published manifest | depends on `@syntara/icons@0.1.0`, not `workspace:*` |

`icons` and `theme-engine` — the two that would have shipped unusable TypeScript this morning — are the ones that
typecheck cleanly as published packages.

**Phase 6 is 2 of 5, not closed.** BRIEF §13 asks for: npm publish (scoped) ✅, deploy docs ✅, a README with a
30-second GIF ❌, a `/story` page ❌, and the differentiation research re-run *first* ❌ — the one on file,
`docs/research/2026-09-27-differentiation.md`, predates the phase. The two shipped halves are the visible ones,
which is exactly why the remaining three are easy to lose.

**Verified after publishing**
- **The codemod works from the registry.** `npm install @syntara/codemods` in a clean project outside the
  workspace, then `npx @syntara/codemods button-variant-danger-to-tone src/App.tsx`: `1 ok, 0 errors`. It migrated
  both `variant="danger"` call sites, kept `size` and `onPress`, and left `variant="primary"` and an
  already-migrated `variant="outline" tone="danger"` untouched.
- **Its output typechecks against `@syntara/react@0.1.0`,** so the migration it recommends compiles; and the
  *pre-migration* form still typechecks too, which is what GOVERNANCE §5 promises — a deprecated API works through
  every 0.x and goes at 1.0.0. An error there would have meant the deprecation broke early.
- `node_modules/.bin/syntara-codemods` exists after install, so npm's `bin` normalisation warning was cosmetic.
- #19 was merged on Anuj's instruction with two gates still running; they finished **green**, and `main`'s runs for
  #17 and #19 are both green.

**Next**
- **`+ <pkg>@<version>` from npm does not mean the version is on the registry.** With web auth, npm stages the
  tarball and commits it minutes later. `@syntara/react` printed success and 404'd for roughly ten minutes
  (`time["0.1.0"]` is 17:31:38, well after the CLI said so); `codemods` did the same. Re-running on the assumption
  of failure would have chased nothing. Check `npm view <pkg> version` before concluding anything.
- **`@syntara/theme-engine@0.0.0-stage` is gone.** npm's own leftover staging placeholder (343 bytes,
  "Temporary package placeholder for staged publishing"); Anuj unpublished it. The package now lists `["0.1.0"]`.
- **Publish with pnpm, never npm.** `@syntara/react` pins `@syntara/icons` as `workspace:*`, which only pnpm
  rewrites. `npm publish` would ship the literal string and break every install.
- **The rest of Phase 6:** the differentiation research re-run (BRIEF §13 says *first*, so before the GIF and
  `/story`), a README GIF, and the `/story` page.
- **The version schemes have split.** The homepage pill reads the changelog's top heading (`v0.5`, phase-based);
  npm reads semver (`0.1.0`). Both are right and they will diverge further every release. Reconciling them, or
  deciding they stay separate and labelling them so, is Anuj's.

---

## 2026-09-30 (npm) — the packages carry their own licence, readme and build

**Reconciled with #14.** `chore(release): Phase 6 publish prep` (#14) merged to main at 08:42, mid-session, doing
overlapping work neither side knew about — the exact failure two sessions shipping opposite fixes for one problem.
Both found the same three defects and fixed two of them differently:

| | #14 | here |
|---|---|---|
| raw TypeScript entry points | `files: ["src"]` — still ships `.ts` | built: JS + `.d.ts` |
| test files in the tarball | fixed by `files: ["src"]` | fixed by `files: ["dist"]` |
| `repository` link | **plus `keywords`** | no keywords |
| `LICENSE` in the tarball | — | fixed |
| stale `dist`, no `prepack` | — | fixed |
| `changeset version` → 1.0.0 | major→minor ⇒ 0.2.0 | changeset deleted, baseline 0.0.0 ⇒ **0.1.0** |

Merged toward this branch on Anuj's call, keeping #14's `keywords` and all three of its READMEs, which are better
than the ones written here — more specific, with working examples, and correct where these were not (243 outline
drawings including the 6 filled, not "237 outline plus 6 filled"; the 54 twins that carry no tint; the `Icon.node`
composition that stops a twin drifting from its outline).

Two things the merge caught:

- **Git auto-merged `packages/icons/package.json` into a broken package:** #14's `files: ["src"]` alongside this
  branch's `publishConfig.exports` pointing at `dist`. The tarball would have contained source and pointed its
  entry at a `dist` that was not in it. A post-merge assertion over all eight manifests caught it; the check is in
  the session scratch, not the repo.
- **#14's README told consumers to import `@syntara/react/styles.css` and nothing else.** That file reads
  `var(--syntara-*)` 2,736 times and defines none of them (`grep -c` on the built `styles.css`), so following it
  renders every component unthemed. The token import is back in both the quickstart and the Importing section.

`.changeset/publish-metadata.md` and `.changeset/publish-readiness.md` are merged into one accurate changeset:
#14's said `files: ["src"]`, which stopped being true.

A third: **#14's theme-engine README stated the wrong output for its own example.** Run verbatim against the packed
tarball, those six inputs give `adjustments: 1`, not 3. Corrected to the measured value.


**Changed**
- **`LICENSE` copied into all eight published packages.** Every manifest said `"license": "MIT"` and no tarball
  contained the text; npm does not hoist a monorepo root `LICENSE`.
- **`repository` (with `directory`), `homepage` and `bugs` added to all eight.** Without them npm renders no
  source link. The URLs use `github.com/anujpatel06/strata`, which ADR-029 settled: the repository keeps its name.
- **`prepack: pnpm run build` on `@syntara/react` and `@syntara/tokens`.** Both ship `files: ["dist"]`, `dist` is
  gitignored, and neither had a publish lifecycle script. `packages/react/dist` was built 27 Sep and 83 source files
  under `packages/react/src` changed after that, so `changeset publish` would have shipped a `dist` predating
  the avatar, tooltip and hydration fixes, silently. Verified by `pnpm pack`: `dist/index.js` rebuilt, no source file newer than it.
- **READMEs for `@syntara/react`, `@syntara/icons` and `@syntara/theme-engine`,** which had none. The react page is
  where anyone evaluating this lands.
- **`@syntara/icons` and `@syntara/theme-engine` are built packages now** — `vite.config.ts` + `tsconfig.build.json`
  on the pattern `@syntara/react` already uses: ESM with `preserveModules` (so importing two icons does not pull in
  480), declarations via `tsc`, and the dist mapping in `publishConfig.exports` so in-repo imports still resolve to
  `src`. Both were exporting `./src/index.ts`.
- **The declaration fixer now resolves bare directory specifiers,** in all three configs. `tsc` writes the barrel as
  `import("..").Icon`, which `nodenext` rejects; it becomes `import("../index.js").Icon`. This was latent in
  `@syntara/react`'s config too.
- **The first release is 0.1.0 across all eight packages.** `.changeset/rename-to-syntara.md` is deleted and the
  version baseline is set to `0.0.0`, so the accumulated changesets produce a uniform `0.1.0`.
- **`@syntara/sdui`'s peer ranges are real ranges** (`>=0.1.0 <1.0.0`) instead of `workspace:*`, which pnpm
  publishes as an exact pin — every later `@syntara/react` release would have been a peer conflict for every
  consumer of sdui.
- **`onlyUpdatePeerDependentsWhenOutOfRange` set in `.changeset/config.json`,** so a peer bump inside the declared
  range stops forcing a major on the dependent.

**Decided**
- **First release at 0.1.0, not 1.0.0 — Anuj.** A dry run of `changeset version` produced **1.0.0** for all eight:
  `rename-to-syntara.md` marked everything major. That would have opened npm with a v1.0.0 changelog headed
  "Major Changes", describing a four-part migration from `@strata` — a scope that was never published — while
  `pnpm check:meta` reports 0 stable, 35 beta, 18 alpha. Three options were put up: release at 0.1.0, ship 1.0.0
  with the entry reworded, or ship as-is. Anuj chose 0.1.0. The rename stays recorded in ADR-029 and here.
- **Build the two packages people import; leave the CLIs as they are — Anuj.** Six packages exported raw
  TypeScript. Three options were put up: build `icons` + `theme-engine` only, build all six, or publish only
  `react` + `tokens` + `icons`. Anuj chose the first. `audit`, `mcp` and `codemods` run through `bin/*.mjs` with
  `tsx` as a real dependency, so their CLIs work; only programmatic import is affected and nothing documents it.
  `sdui` stays a demo. ADR worth writing if the CLI packages ever grow a documented API.
- One README claim was written and then removed: that direction-bearing icons flip themselves under RTL. They do
  not. `@syntara/icons` ships no direction logic; the consuming component flips it in CSS (`.separator:dir(rtl)` in
  breadcrumbs, `.navIcon:dir(rtl)` in calendar). The README now says so.

**Results**
`pnpm pack` on `@syntara/react`, tarball inspected:

| | before | after |
|---|---|---|
| `LICENSE` in tarball | no | **yes** |
| `README.md` in tarball | no | **yes** |
| `dist` freshness | 3 days stale | **rebuilt by `prepack`** |
| `@syntara/icons` dependency | `workspace:*` | **`0.1.0`** (pnpm rewrites it; `npm publish` would not) |

Tarball 424K, `dist/types/index.d.ts` present.

Then all three tarballs installed into a clean `npm` project outside the workspace:

- `node` imports `@syntara/icons` and `@syntara/theme-engine` and renders `IconCheck` — before the build both threw
  on the `.ts` extension.
- `tsc --module nodenext --moduleResolution nodenext --skipLibCheck false` over all three: **0 errors**.
- `pnpm typecheck`: every package Done. `pnpm test`: **2,167 passed, 0 failed.**

`pnpm changeset version`, run three times as a dry run and reverted each time:

| | version it produced |
|---|---|
| as found | 1.0.0, all eight |
| rename changeset dropped, baseline 0.0.0 | 0.1.0 — except `@syntara/sdui` at **1.0.0** |
| + sdui peer ranges and the changesets peer flag | **0.1.0, all eight** |

`@syntara/sdui` was the outlier because changesets majors any package whose *peer* dependency bumps, and sdui
peer-depends on `@syntara/react` and `@syntara/icons`. `pnpm install`, `pnpm typecheck` and `pnpm test` all re-run
clean after the peer ranges changed; the workspace links are intact (the packages are devDependencies too).

**Next**
- **The `@syntara` npm scope is not reserved and this session could not reserve it.** `npm whoami` returns 401, and
  `@syntara` has to exist as an npm *organisation* before anything can be published into it — a signup flow on
  npmjs.com behind Anuj's password. No package named `syntara` exists on the registry; whether the org name is free
  is not knowable without the create form.
- **The README numbers table is stale** on one row. `pnpm test` now gives 474 components · 309 engine · 959 icons
  · 193 MCP · 150 schema · 74 auditor · 8 codemods; the table says 468 · 301 · 245 · 193 · 150 · 74 · 8 and is
  footnoted "Measured 2026-09-28". Only the test counts were re-measured this session, so the row was left alone
  rather than half-updated under a date that would then cover figures nobody re-ran.
- Publish with **pnpm**, not npm: `workspace:*` is only rewritten by pnpm.

---
## 2026-09-30 (numbers) — the README's front-page table is re-measured whole, not row by row

**Follow-up, same day: the row counts totals, not passes.** CI failed the new check on its first real run —
`packages/theme-engine` reports **308 passed | 2 skipped** on Linux against **309 passed | 1 skipped** on a Mac.
`test/native-exporters.test.ts` type-checks the Swift export against the macOS SDK with `it.skipIf(!canTargetMacOS)`
and a complementary test that skips on a Mac, so the suite is 310 either way but the *passing* count never agrees
across machines. A row of passing counts could only ever be right on one of them, and the check would have failed
in CI forever.

So the row is **"Tests"** and counts each package's total (engine 309 → 310, suite 2,168). `check-test-counts.mjs`
already fails on any `failed` count, and still does, so "310 engine" means 310 tests with none failing. Verified
against the real CI output shape as well as this Mac's: both pass.

**Changed**
- **The "Numbers" table in `README.md` was re-run end to end and its date moved to 2026-09-30.** Only the test row
  had moved: **468 → 474 components, 301 → 309 engine, 245 → 959 icons** (the icons jump is #7, the duotone twin for
  every icon). MCP server 193, schema 150, auditor 74 and codemods 8 are unchanged. Every other row reproduced
  identically, so nothing else in the table changed.
- **`scripts/check-test-counts.mjs` now compares that row to the suite, so it cannot go stale again — Anuj asked
  for it.** It parses the per-package `Tests N passed` lines out of `pnpm -r test` and checks three things: every
  package that ran has a part in the row, every part names a package that ran, and each part equals its package's
  count. The parts summing to the suite total follows from those, and is printed because that total is the number
  `docs/log.md` quotes. It runs the suite itself, or takes saved output with `--from` so CI does not test twice.
  `--fix` rewrites the counts and deliberately leaves the "Measured" date alone: that date covers all fourteen
  rows, and only running all fourteen commands earns it.
- **CI now runs it next to `pnpm test`,** as `pnpm test | tee` with `set -o pipefail`. Without `pipefail` `tee`
  returns 0 and a failing suite would pass the step, with the check then reading a run nobody looked at.
- Step 3 of the `/verify` skill runs it too.
- The table has no generator script — each row carries the command that reproduces it, maintained by hand — so all
  fourteen script-backed rows were re-run rather than the one known-stale row. A single "Measured" date under the
  table covers every figure above it; refreshing the date while leaving rows un-run would have made that date a
  claim nobody had checked, which is the "No invented metrics" rule in `CLAUDE.md`.

**Results**
Every row re-run on this checkout at `c1a2eb2` (`origin/main`'s tip), except the two eval rows.

| Row | Command | Result |
|---|---|---|
| Themes fuzzed | `pnpm test:themes` | 1,000 brands × light/dark |
| Contrast checks | `pnpm test:themes` | 118,000 / 118,000 (100.00%), 118 per brand |
| Chart palettes | `pnpm test:themes` | 2,000 / 2,000 (100.00%) |
| Solver adjustments | `pnpm test:themes` | min 0 / median 4 / max 7 |
| Brand colour kept exactly | `pnpm test:themes` | 89.2% light, 80.0% dark |
| Components / blocks | `pnpm check:meta`; `blocks.json` | 53 / 53 pass · 7 blocks |
| Component maturity | `pnpm check:meta` | 18 alpha · 35 beta · 0 stable |
| **Tests** | `pnpm test` | **474 · 310 · 959 · 193 · 150 · 74 · 8 = 2,168 total; 2,167 passing and 1 skipped on this Mac** |
| Axe sweep | `node scripts/axe-sweep.mjs` | 113 × 2 schemes, 0 violation nodes, 0 page errors |
| Tenants | `pnpm tokens` | 6 tenants, 118/118 checks each |
| Native token contrast | `pnpm tokens` | 236 / 236 per tenant |
| Devanagari clipping | `check-script-clipping.mjs --pairs=bilingual-devanagari` | 0 in 5,616 cases |
| Deprecations with a codemod | `@syntara/codemods test` | 1 deprecation (`button.meta.json`), 1 transform, 8 tests |
| Drift score, docs app | `pnpm drift apps/docs` | 98.8 / 100, 60 findings (24 errors, 36 warnings) |

- **The eval rows were not re-run.** `evals/run.mjs` calls a paid model once per run; the README quotes iteration 2
  as recorded in `evals/results.md` (64% → 88% fully on-system, 88% → 88% typecheck), and those lines are unchanged.
- The axe sweep ran against this build on **port 3131**, not 3000: another session's `serve` (PID 28615, a
  `duotone-pr` scratchpad) was already answering on 3000 with a 200. `SYNTARA_BASE_URL` exists for exactly that, and
  `assertServedBuild` confirmed the served build id was `ZHgz6NCEn0vyArjzFqxy4` — this checkout's. The other
  session's server was left running.
- `pnpm test:themes` rewrites `packages/theme-engine/reports/fuzz-report.{json,md}`; the only diff was generation
  timing (median 0.62 → 0.60 ms, p95 0.95 → 1.05 ms), which is machine noise the report itself disclaims, so it was
  reverted rather than committed.

**Found by measuring, not fixed**
- **The log was right while the README was stale.** The 2026-09-30 (hero) entry already recorded `pnpm test` at
  "2,167 passing, 1 skipped" — the README's row summed to 1,439. The per-package split lived in one hand-maintained
  table and the total lived in the log, and nothing compared them. **Closed** by
  `scripts/check-test-counts.mjs`, above.
- **A check on the total alone would not have been enough.** Relabelling one part — `74 auditor` written as
  `74 linter` — keeps the sum at 2,167 while the row names a package that does not exist. The check is written
  per-package for that reason, and the label map is the one thing in it that is hand-maintained: a new package with
  tests and no entry is reported rather than defaulted, because what the README calls it is a wording decision.
- **The other thirteen rows still have nothing watching them.** This closes the row that was actually wrong. A
  drifting axe route count or drift score would still be found only by a person re-running the command.

**Next**
- Anuj: Phase 6 publishes to npm and deploys the docs, and this table is the repo's front page. The test row is
  checked now; the other thirteen are not. Worth deciding whether they get a generator script before the deploy, or
  stay hand-maintained with the date as the contract.
## 2026-09-30 (publish prep) — the tarballs are right; the version number is a decision

**Changed**
- **`@syntara/icons` and `@syntara/theme-engine` were packing their test suites.** Neither declared `files`, so npm
  took everything not ignored: 2 test files from icons, and 14 from theme-engine including the native token
  snapshots (`vela.SyntaraTokens.kt`, `.swift`). Both now declare `files: ["src"]`, which is what their `exports`
  actually need — both publish TypeScript source rather than a build.
- **Every package carries `repository` with its `directory`, and `keywords`.** Eight packages had none, so npm would
  have shown no source link and found them by name only.
- **`@syntara/react`, `@syntara/icons` and `@syntara/theme-engine` have READMEs.** npm renders the README as the
  package page, and the flagship package had none. Every number in them comes from the code: 53 components, 480
  icon exports (243 outline + 237 duotone), 48 semantic roles, 118 contrast checks per theme, 0 runtime
  dependencies in the engine.
- **No `homepage` field.** The docs site is not deployed yet, so there is no URL to point at; adding one would be a
  link that 404s. It goes in with the deploy.

**Decided**
- **Nothing is published in this commit.** The `@syntara` npm scope is still unclaimed (ADR-029, waiting on Anuj),
  and reserving it needs his account. This is the preparation only.

**Results**
All eight packages pack with `pnpm pack`, which applies `publishConfig`:

| Package | Size | README | test files |
|---|---|---|---|
| `@syntara/react` | 420 KB | yes | 0 |
| `@syntara/tokens` | 113 KB | yes | 0 |
| `@syntara/sdui` | 90 KB | yes | 0 |
| `@syntara/theme-engine` | 66 KB | yes | 0 (was 14) |
| `@syntara/audit` | 40 KB | yes | 0 |
| `@syntara/icons` | 39 KB | yes | 0 (was 2) |
| `@syntara/mcp` | 23 KB | yes | 0 |
| `@syntara/codemods` | 5 KB | yes | 0 |

- `@syntara/react`'s published `exports` are rewritten by its `publishConfig` to `./dist/types/index.d.ts` and
  `./dist/index.js`. The source `exports` point at `./src/index.ts`, which is not in the tarball — correct, and
  worth stating because it looks like a fault until you read `publishConfig`.
- `pnpm typecheck` 0 errors · `pnpm test` 2,167 passing, 1 skipped · `pnpm check:meta` exit 0.

**Found by measuring, not fixed**
- **`changeset version` takes every package to 1.0.0.** `rename-to-syntara.md` declares a `major` for all eight
  (ADR-029 changed the token prefix, which breaks every consumer stylesheet), and a major on 0.x goes to 1.0.0. Run
  as a trial and reverted: all eight land on 1.0.0, 8 changelogs are written, 18 changesets are consumed.
- **That collides with the one live deprecation.** `Button variant="danger"` records `since: 0.2.0`,
  `removal: 1.0.0` (RFC-001, ADR-021), and GOVERNANCE §5.3 says a deprecated API keeps working through every 0.x
  release and is removed at 1.0.0. If the *first* public release is 1.0.0 there was never a 0.x release to keep
  working through: the deprecation and its removal would ship in the same instant, and the codemod would migrate an
  API no consumer ever had. Anuj's call; put to him with options.

**Decided (after the entry above was written)**
- **The first release is 0.x, not 1.0.0 — Anuj.** `.changeset/rename-to-syntara.md` is rewritten from `major` to
  `minor` for all eight packages, and says why in the changeset itself. The rename does break every consumer
  stylesheet, but nothing was ever published under `@strata/*`, so there is no consumer to break; declaring it major
  would spend 1.0.0 — the version GOVERNANCE §5.3 reserves for removing deprecated APIs that have lived through a
  0.x window — on a release with no 0.x window behind it. `Button variant="danger"` keeps its 1.0.0 removal, and
  real consumers now get a genuine window before it goes.
- With that change a release produces: `react`, `icons`, `theme-engine`, `tokens` at **0.2.0**; `audit`, `codemods`,
  `mcp` at **0.1.0**. Run as a trial and reverted — the version bump is not committed, because the scope is not
  claimed and one question below is open.

**Decided (third pass)**
- **`@syntara/sdui`'s peer dependencies are pinned to `^0.2.0` — Anuj.** They were `workspace:*`, and changesets
  cannot read the workspace protocol as a range, so it treated every peer bump as out of range and forced a major.
  A real semver range fixes it, and the experimental `onlyUpdatePeerDependentsWhenOutOfRange` option is not needed —
  it was tried and reverted rather than left as config that does nothing. Four forms were run through
  `changeset version`:

  | sdui peer range | option set | sdui lands on |
  |---|---|---|
  | `workspace:*` | no | **1.0.0** |
  | `workspace:^` | yes | **1.0.0** |
  | `^0.2.0` | yes | 0.1.0 |
  | `^0.2.0` | no | **0.1.0** |

  With the pin, a release is consistently 0.x: `react`, `icons`, `theme-engine`, `tokens` at **0.2.0**; `audit`,
  `codemods`, `mcp`, `sdui` at **0.1.0**. sdui's changelog heading reads `## 0.1.0` above its Minor Changes instead
  of `## 1.0.0`.
- The range is ahead of the tree on purpose: `@syntara/react` is 0.1.0 today and becomes 0.2.0 in the release this
  is written for. Nothing breaks in the meantime — sdui carries both packages as devDependencies, so the workspace
  still links them. `pnpm install` is clean with no peer warnings, `pnpm --filter @syntara/sdui typecheck` passes
  and its 150 tests pass.

**Found by measuring, not fixed (second pass)**
- **A pinned range needs maintenance that `workspace:*` did not.** When `@syntara/react` next takes a minor, sdui's
  `^0.2.0` goes stale and consumers get a peer warning until someone widens it. That is the cost of the fix, and
  nothing checks it yet — a rule in `pnpm check:meta`, or a release step, would.
- **`@syntara/sdui` lands on 1.0.0 whatever the changesets say.** It is the only package that declares
  `@syntara/react` and `@syntara/icons` as **peer** dependencies, at `workspace:*`. Changesets bumps a package major
  when a peer dependency takes a minor, so sdui goes major on *every* react or icons minor — not just this release.
  Its changelog then reads "## 1.0.0" with nothing but a Minor Changes section under it, which looks like a fault.
  `onlyUpdatePeerDependentsWhenOutOfRange` does not help: changesets cannot evaluate `workspace:*` as a range, so it
  treats every bump as out of range. Tried and reverted. Three ways out — accept 1.0.0 for sdui, pin the peers to a
  real range like `^0.2.0`, or set sdui's version by hand after each bump — and it is Anuj's call which.

**Next**
- Anuj: the npm scope. That is the last thing between this and a release.

## 2026-09-30 (hero) — the demo is the argument, so it moves above the fold

**Changed**
- **The hero is now a caption for the demo rather than a screen in front of it.** 751px of a 900px viewport went to
  words before the live showcase appeared; it starts at **550px** now.
- **The headline drops from 78px to 54px** (`5xl × 1.625` → `5xl × 1.125` at ≥1280, and `5xl × 1.375` → `5xl` at
  ≥768). At 78px it was 4.3× the lead, for a line — "One design system. Every brand." — that could head any design
  system's page. The specific claim is the line under it.
- **The lead is one sentence:** "Six brand inputs become a light and dark theme that passes WCAG 2.2 AA." The half
  that was cut ("one React library renders every brand") is what the demo underneath shows rather than tells, and
  the agents claim already has its own section.
- **The `npm install` block is gone from the hero.** It had the full "run this" treatment — bordered, monospace, a
  copy button — for a package that does not exist, with a line under it taking that back. What is left is the honest
  half, one line: "Not on npm yet — it publishes in Phase 6. Copy a component's source." Nothing is promised, so
  nothing needs retracting, and the command still lives on `/docs/installation`, where someone installing looks.
- "Browse components" goes from `outline` to `ghost`, so there is one primary action rather than two of a weight.
- Hero bottom padding `space-16` → `space-8`, and the gap `space-5` → `space-4`.

**Decided**
- **Demo-first — Anuj.** Three options were put up: trim the hero but keep its shape, restructure so the demo is the
  hero, or fix only the copy. Anuj chose the restructure. The live showcase is the page's argument — six brands, any
  hex, contrast re-solved in front of you — and it was the last thing on the page.
- **The site shell's 64px top padding stays.** It is shared by every page, and cutting it for the homepage alone
  would buy 64px at the cost of the site's one consistent frame.

**Results**
Measured in the browser against the static export (build `1SH2qzr0MpmjwnY2VQgm0`).

| | before | after |
|---|---|---|
| demo starts at | 751px | **550px** |
| visible at 1280×800 | 49px (3.1%) | **250px (15.9%)** |
| visible at 1440×900 | 149px (9.7%) | **350px (22.7%)** |
| visible at 1512×982 | 231px (15.0%) | **432px (28.0%)** |
| headline | 78px | 54px |

- `pnpm typecheck` 0 errors · `pnpm test` 2,167 passing, 1 skipped · `check-override-weight` 0 ·
  `check-ssr-tabs` 81 pages, 326 tab lists, 0 · `check-hydration` 113 × 2, 0 · `check-theme-links` 5, 0 ·
  `check-narrow-overflow` 113 routes at 320px, 0 · `check-csp` 113, 0 · **`axe-sweep` 113 × 2 schemes, 0 violation
  nodes** · `check-overlay-exit` 108 tooltips, 4 overlays, 0 failures.

**Found by measuring, not fixed**
- **This work was first built on a `main` five commits stale.** `git checkout main` picked up a local branch left at
  `ee4fe24`, so the first round of measurements and a screenshot were taken against a homepage without #9, #10, #11,
  #7 or #12 in it. The tell was in the screenshot: the toolbar showed the old detached swatch instead of the single
  field that had merged an hour earlier. Rebasing onto `origin/main` applied cleanly — the hero files and the
  toolbar files do not overlap — and every number above is from the rebased build. `git checkout origin/main`, or
  checking `git log origin/main -1`, is the habit that would have caught it before the build rather than after.
- The toolbar still has no label saying it drives the grid below. It is adjacent to the demo now, which carries
  most of the meaning, but "switch brand and watch" is not said anywhere.

**Next**
- Anuj: at 390px the demo is still only 5.6% visible (227px of 4,090), because the grid itself is four times taller
  when it stacks. Worth deciding whether the phone layout should show a shorter demo rather than the whole grid.

## 2026-09-30 (toolbar) — the colour field shows the colour you picked

**Changed**
- **The homepage's colour field follows the selection.** It held one colour whatever was selected: picking Qamar
  left it reading the default sky blue, next to the chips, looking like the active colour and not being it. It now
  shows the selected brand's own primary, so it cannot say something untrue.
- **Editing it from any brand starts "Your colour" at that brand's hex.** The control reads as "remix this one"
  rather than as a slot that ignores the row above it. "Your colour" keeps its own last value, so its chip dot still
  marks what you typed rather than mirroring whatever is selected.
- **The homepage now uses `/themes`' control instead of its own barer copy.** `ColorControl` is one field with the
  native picker as its swatch prefix, a visible label, `validationBehavior="aria"` and "Use a hex like #3D45D6" when
  the draft is malformed. The homepage had two sibling controls, `aria-label`s only and no error message. It gains
  an optional `className` so a caller can size it for its own row; nothing else about it changed.
- The label "Brand colour" is rendered inline and passed as `labelledBy`, so the toolbar stays one row on a wide
  screen. Dead `.swatch` and `.hex` rules are gone.

**Decided**
- **The field follows the selection, rather than being scoped to "Your colour" — Anuj.** Three options were put up:
  follow the selection, show the picker only when "Your colour" is selected, or keep the two-control layout and just
  fix the labelling. Following the selection makes the field true at every moment and turns the page's best
  interaction into "remix any of the six brands", which demonstrates the engine better than an isolated custom slot.
  Hiding it behind the chip would have put the most interesting control on the page behind a click.
- **The native `<input type="color">` stays.** There is no colour component among the 53, and the same native input
  is used identically here and on `/themes`. Replacing it is component 54 and an RFC under GOVERNANCE §4, not a
  change to make while fixing a layout.

**Results**
Measured in the browser against the static export (build `SpqeaYwg-VCQEJaSFBIKs`).

- The field tracks the chips: Vela **#3D45D6**, Care **#0E63FF**, Qamar **#F2A516**, Haat **#B5179E**, and the
  swatch with it. Before this it read `#0ea5e9` for all four.
- Remix: with Haat selected, typing `#FF6600` moves the selection to **"Your colour"**, the field keeps `#FF6600`
  and the chip's dot becomes `rgb(255, 102, 0)`.
- Invalid draft `#zz`: `aria-invalid=true` and "Use a hex like #3D45D6" is shown. The old field had neither.
- Toolbar height 50px → **58px** at 1280 (the inline label), one row; at 390 the field takes its own row under the
  chips. **0px of sideways scroll** at 1280 and 390, and `check-narrow-overflow` passes 113 routes at 320px.
- `pnpm typecheck` clean · `pnpm test` 2,167 passing, 1 skipped · `check-override-weight` 0 ·
  `check-ssr-tabs` 81 pages, 326 tab lists, 0 · `check-hydration` 113 × 2, 0 · `check-theme-links` 5, 0 ·
  `check-csp` 113, 0 · **`axe-sweep` 113 × 2 schemes, 0 violation nodes** · `check-overlay-exit` 108 tooltips,
  4 overlays, 0 failures.

**Found by measuring, not fixed**
- **The first version of this clipped the "#".** The field kept the width it had when the swatch was a sibling
  outside it; with the swatch moved inside as a prefix the input measured `scrollWidth 74` in a `clientWidth 50`
  box, and the leading `#` was cut. A screenshot showed it and `scrollWidth > clientWidth` confirmed it. The width
  now adds the swatch's own 24px. Worth remembering that moving a control inside a field changes what the field's
  width has to cover.

**Next**
- Anuj: "Brand colour" as the label, and whether remixing from a tenant should say so anywhere — right now the only
  sign you have left Qamar is the chip selection moving to "Your colour".

## 2026-09-30 — the homepage says when the headline isn't your colour

**Changed**
- **The hero's fallback is no longer silent.** The homepage sets "Every brand." in the selected brand's `text.brand`,
  but only when that reads 4.5:1 on the hero's glow; otherwise it quietly swapped in the house ink and said nothing.
  A reader typed a colour, watched the grid re-skin, read "all 118 contrast checks pass" — and the one word their eye
  went to was not their colour. The solver line now finishes the sentence: *"the headline above keeps the house
  colour: this one reads 4.41:1 on the hero in light, and AA needs 4.5."*
- `brandTextPassesOnHero` became `heroBrandTextContrast` and returns the ratios per scheme rather than a verdict,
  because the shortfall is now shown rather than acted on in private. The note names the worse of the two schemes.
- The note sits inside the existing `aria-live="polite"` region, so it is announced on the same change that
  announces the counts, not as a second interruption. Ratios are floored, never rounded: 4.49 reads as 4.49.

**Decided**
- **Say it rather than hide it — Claude recommended, Anuj accepted.** Anuj asked how the "passes WCAG 2.2 AA" claim
  in the hero is conveyed when a visitor types an arbitrary colour. It is conveyed, and honestly: the colour is not
  used raw — it seeds the ramps and the solver moves roles until every pair passes, which the line reports as "N
  automatic adjustments". The gap was the hero, where a failing colour was replaced without a word. Naming the
  shortfall turns a hidden substitution into the clearest demonstration on the page that the system measures rather
  than asserts.
- **The shield icon stays.** A fallback is the system working, not a fault, and the theme genuinely passes all 118
  checks. An alert icon would report a problem that is not there.

**Results**
Measured against the static export on this branch (build `Y8EKI-zFiku7KC3jQXgdB`, `serve out` on :60492).

- The fallback is real and reaches shipped brands: **Care reads 4.41:1** on the hero in light and falls back;
  the custom default `#0ea5e9` reads **4.34 light / 4.88 dark** and falls back. Vela (5.18), Harbor (4.82),
  Qamar (4.52), Haat (4.61) and house (11.97) carry it. Confirmed in the browser: with Care selected the headline
  computes to `rgb(26, 27, 38)`, the house ink, and with Haat to `rgb(161, 36, 142)`, its own.
- **81 of 180 colours on a hue sweep (45.0%) fall back** — every 6° of hue at three chroma/lightness pairs.
- The note itself: `#5a5a5d` on `#f7f7f9` = **6.42:1** light, `#b7b7ba` on `#0d0d0e` = **9.70:1** dark, at 13px/400
  (needs 4.5). Rendered in light and dark at 1280, 390 and 320, and with `dir="rtl"`: shown in all, **0px of
  sideways scroll** in all.
- `pnpm typecheck` clean · `pnpm test` 2,167 passing, 1 skipped · `pnpm check:meta` 53/53 ·
  `node scripts/check-override-weight.mjs` 0 · `check-ssr-tabs` 81 pages, 326 tab lists, 0 missing a panel ·
  `check-hydration` 113 × 2, 0 failures · `check-theme-links` 5, 0 · `check-narrow-overflow` 113 at 320px, 0 ·
  `check-csp` 113, 0 · **`axe-sweep` 113 × 2 schemes, 0 violation nodes** · `check-overlay-exit` 108 tooltips,
  4 overlays, 0 failures.

**Found by measuring, not fixed**
- **A number in this session's own first answer was wrong.** The fallback rate was first quoted as 29.7%, measured
  against a house canvas of `#6366f1` — a colour invented for the script rather than read from `tenants/house`.
  Against the real house brand it is 45.0%. The tell was there to see: the same script put `#0ea5e9` at 4.37 while
  the browser showed 4.34. Reading the tenant file rather than typing a plausible hex is the whole of the fix.
- The `GLOW_TINT` model the check depends on is calibrated against pixel measurements of the rendered hero and errs
  toward falling back. So some colours near the line are shown the note although they would have passed. That is the
  safe direction, and the note states the modelled ratio, not a measured screen pixel.

**Next**
- Anuj: the copy is the part to read as a writer — "the headline above keeps the house colour" is doing the work of
  explaining a substitution in half a line, and it appears for Care, a shipped tenant, not only for typed colours.

## 2026-09-29 — a duotone twin for every icon

**Changed**
- **`@syntara/icons` has a third style: duotone.** Every one of the 237 outline icons now has an `Icon<Name>Duotone` twin — the same drawing, untouched, with a tint layer painted behind it. New `src/icons/duotone.ts` (237 twins) and `src/icons/duotone-kit.ts` (how one is built). `filled.ts`'s six status shapes are already solid, so they get no twin.
- **A twin never redraws its outline, and never copies a path string.** `createIcon` now keeps the drawing on the component as `Icon.node`, and each twin composes `base.node`, deriving its tint from the outline's own subpaths: `body` fills one as it is, `closed` fills one the outline leaves open, `holed` cuts a window with even-odd, `untinted` adds no tint. `tint()` draws a body by hand and is the escape hatch — used 11 times, commented at each. Counts: 186 `body`, 21 `closed`, 6 `holed`, 54 `untinted`.
- **One token makes the second tone:** `--syntara-icon-tint`, defaulting to `color-mix(in oklab, currentColor 16%, transparent)`. Duotone therefore still follows the text colour, works on any surface and inside a solid button with no setup, and a theme, a tenant or one component can set the token. Opt-in with a fallback like `--syntara-icon-on`, so no tenant token file and no theme-engine role changed.
- The icons page gains a Duotone section and the gallery a tenth group; both read their numbers from the source (`getDuotoneFacts` in `apps/docs/components/icons/icon-data.ts`), so the page can't quote a stale default.
- Two other readers of the icon source learned about the layer, because a twin is a `duotone(` call rather than a `createIcon(` one: the docs gallery and the MCP server's `iconExports`. `find_icon` now returns both styles with their group, outline first.
- **`packages/sdui` SCHEMA_VERSION 1.0.0 → 1.1.0**, and `src/validator.generated.js` regenerated with it. The wire enumerates icon names, and the evolution guard classified 237 additions as a minor bump. Its test derived the expected version from the constant rather than hard-coding it, so it stops breaking on every real bump. Since ADR-034 the generator also emits the precompiled validator, so adding names to the enum without regenerating it would publish a schema that accepts a duotone icon and a validator that rejects it.
- Two new scripts: `pnpm --filter @syntara/icons sheet:batch <file>` (a review sheet for one source file, for work in progress) and `check:tints`, below.

**Decided**
- **Duotone returns as an opt-in layer — Anuj.** ADR-014 rejected a duotone set as working against "minimal" but left the door open for exactly this. [ADR-036](adr/036-duotone-icon-layer.md) records the reversal and every call below.
- **The tint is a token with a default, not two opacities and not a semantic role — Anuj chose from three options.** Opacity alone can't see the background and a brand could never own the tint; a semantic role bakes a colour in and breaks on a solid button, against ADR-014's currentColor rule.
- **All 237, not a curated subset — Anuj.**
- **Marks that enclose no area get a twin with no tint — Anuj, from a rendered A/B.** A wash behind the mark was built first so there was something to look at; at any weight it reads as a drop shadow, worst at 16px. 54 of 237 twins carry no tint and render exactly like their outline, which keeps the set 1:1 so a product can move its whole icon layer in one import change.
- **A tenth gallery group rather than a style switch on the toolbar — Anuj**, matching how Filled already reads. The page is about twice as long; the switch is the fix if that becomes a problem.
- **`closed()` is a marker, not a transform — Claude.** SVG's fill operation closes every open subpath, so it paints exactly what `body()` paints. Kept because it tells review that a mass the outline leaves open was closed deliberately, and its doc comment now says so rather than implying the `Z` does work.
- **`power` keeps its mouth open — Anuj, from the rendered options.** Closing the ring across its mouth tinted the slot the stem passes through, and the icon read as a filled button rather than a ring: beside `stopwatch`, a genuinely closed circle, the two carried identical weight. The disc is still derived from the outline; only the window is hand-written, the way `printer`'s paper tray is. A traced tint that stopped short of the stem was built first and rejected — it read as a bump on the tint's edge rather than a break.
- **Small nodes are tinted when they are the icon's masses, not when they read as a hole — Claude.** `share`, `git-branch`, `git-merge`, `git-pull-request` and `route` tint their nodes (visible from ~24px); `anchor`'s shackle eye stays clear because filling it closes the one gap the mark needs.

**Results**
- `pnpm typecheck`: clean, 11 packages. `pnpm test`: 2,164 passing and 1 skipped (959 icons · 471 components · 309 engine and the 1 skipped · 193 MCP · 150 schema · 74 auditor · 8 codemods).
- Duotone's own tests (`packages/icons/test/duotone.test.tsx`): the layer is **1:1 with the outline set, 237 twins**; every twin's node list **ends with its outline's nodes, identical and in order**; every tint part paints only the token, never a literal colour.
- `pnpm --filter @syntara/icons check:tints`: **29 twins have more than one tint part, 0 overlap by more than 2%** of their tinted area. The tint is semi-transparent, so overlapping parts would double to ~29%. The detector proves itself on two synthetic shapes first (41.32% on overlapping discs, 0.00% on abutting ones) and exits non-zero if that self-test stops holding.
- `pnpm test:themes`: 118,000 / 118,000, adjustments per brand median 4 (unchanged). `pnpm check:meta`: 53 / 53. `pnpm registry`: 73 items. `node scripts/check-override-weight.mjs`: 0.
- `pnpm --filter @syntara/docs build`: all pages generated (81). `node scripts/check-ssr-tabs.mjs`: 81 pages, 326 tab lists, 0 missing a panel.
- `node scripts/axe-sweep.mjs`: 113 routes × 2 schemes, **0 violation nodes**. `node scripts/check-overlay-exit.mjs`: 108 tooltips, 4 menus and popovers, 0 failures.
- Every number above was measured on this branch's base (`bf30a2c`), not on the branch it was written on, and against a build proved to contain this change — not merely proved to be ours. See the two entries below.
- Reviewed by eye: all 237 twins on a contact sheet at 40px, light and dark; the 11 hand-drawn tints and the flagged icons at 150px; the icons page at 1280 light and dark and at 390.
- RTL costs nothing: Button, Link and ToggleGroup flip arrows and chevrons with prefix selectors (`[data-syntara-icon^='arrow']`), and a twin's name is its outline's plus `-duotone`.

**Found by measuring, not fixed**
- The icons page's hero said "480 icons" once the twins landed. A twin reuses its outline's drawing, so it is another component but not another drawing; the page now says **243 drawings, 480 React components**, which is the claim ADR-036 commits to.
- Jumping to any gallery group from the table of contents leaves the group's heading under the sticky toolbar. Pre-existing — `#icons-status` does the same — and not introduced here.
- **CI never runs the accessibility sweep, and the pull request template asks for its number anyway.** `grep -cE "axe-sweep|check-overlay-exit" .github/workflows/ci.yml` returns 0: the bundled job runs typecheck, test, check:meta, drift, override-weight, test:themes, tokens, build, check-ssr-tabs, hydration, check-theme-links, check-narrow-overflow and check-csp, and neither browser sweep is among them. They are `/verify` step 9, on a developer's machine only. So a green pull request says the code is sound and says nothing about the a11y figure asserted in its own description — which is the same shape as the two findings below: a guard that covers less than it looks like it covers. Found by claiming CI was the authority on that number and being corrected.
- **A sweep passed its build-id guard while measuring a build that did not contain the change.** Renumbering the ADR edited `apps/docs/app/docs/icons/page.tsx` (`AdrLink n="030"` → `n="036"`) *after* the docs build, and the commit was amended and pushed without rebuilding. `grep -c 036 apps/docs/out/docs/icons.html` gave 0 and `grep -c ADR-030` gave 1, while `scripts/served-build.mjs` passed throughout — correctly, because the build was ours. A matching build id answers "whose build did you measure", not "is the change in it". The second question needs a grep of the built output for something from the diff. Rebuilt and re-ran: axe 113 routes × 2 schemes / 0 violation nodes and overlay 108 / 4 / 0, both unchanged, but not known to be unchanged until they were re-run.
- **`AdrLink` fails quietly on a number with no file.** `apps/docs/components/mdx/data.tsx:448` resolves `n` against `docs/adr` and falls back to `githubBlob('docs/adr')` when nothing matches, so a wrong number ships a link to the directory listing rather than a 404, and the build stays green. The fallback is correct for the case it was written for — renamed files keep their links — and silent for the case it wasn't. That is why the ADR-030 collision would have shipped without complaint had the file not existed. Main has 23 `AdrLink` call sites across 13 numbers, all resolving; nothing in `scripts/` checks it.
- `serve out -l <port>` can fall back to a random port rather than fail when the port is taken, and says so only in its own log. A `curl` returning 200 then proves something is answering, not that it is yours: one sweep here ran against a server that was not the one just started. `scripts/served-build.mjs` is what catches it, because a build id cannot match by accident — which is the argument for every script that drives the site calling `assertServedBuild` before it measures anything. Worth a line in CLAUDE.md's Gotchas next to the existing note about killing servers by PID.

**Next**
- Anuj reviewed the four flagged calls on a rendered sheet. `power` was changed (above); `shield-lock`, `layout-sidebar` and `news` were kept, with reasons: the lock is a glyph drawn over the tint like `shield-check`'s tick, not a window; the rail is what distinguishes a sidebar layout, so tinting it says what the icon means even though `layout-rows` tints its whole card; and `news` reads correctly, with its drift risk recorded rather than hidden.
- Anuj: whether any component should adopt duotone by default. Nothing in `packages/react` uses a twin yet — this ships the layer, not a change to any component.
## 2026-09-29 (CI) — the accessibility sweeps run in CI, and the axe sweep can now fail

**Changed**
- **New CI job `a11y` (`axe · overlay exit`)** in `.github/workflows/ci.yml`: builds the docs export, serves it, and
  runs `scripts/axe-sweep.mjs` and `scripts/check-overlay-exit.mjs` against it. Until now both were `/verify` step 9
  only — run locally by whoever remembered, and asserted in the PR description by hand.
- **`scripts/axe-sweep.mjs` now exits non-zero.** It printed `violation nodes: N` and exited 0 whatever N was, so
  putting it in CI unchanged would have bought a green tick and nothing else. It now fails on a violation node, and
  on a route it could not measure — `load-failed`, `pageerror`, `not-hydrated` — so an unmeasured route cannot read
  as a clean one. `check-overlay-exit.mjs` already exited non-zero and was left alone.
- **`.github/PULL_REQUEST_TEMPLATE.md`** gains an accessibility line that points at the job rather than asking for a
  number: "There is no violation count to paste here by hand; CI is what asserts it."
- The job reads the port from serve's own output instead of assuming 3000, because `serve out -l 3000` falls back to
  a random port when 3000 is taken and still exits 0. Both scripts then assert the served build id
  (`scripts/served-build.mjs`), which is what proves they measured this build.

**Decided**
- **Add the sweeps to CI rather than drop the claim — Claude recommended, pending Anuj.** The choice was between
  enforcing the accessibility claim and deleting it. Enforcing it costs nothing on the critical path: the sweeps run
  as their own job beside `verify`, not inside it, so a PR's feedback time stays whatever `verify` takes. The two
  jobs are independent — `a11y` needs only `pnpm install` and the docs build, since every workspace package's
  `exports` resolves to its own source.
- **A separate job, not a step in `verify` — Claude.** Locally the two sweeps take 10m56s together, and adding that
  to `verify` would lengthen the wait on every PR, including ones that touch no UI. The first run on a runner
  settles what beside-it actually costs: `a11y` 16.4 min against `verify`'s 11.8, started together, so a PR's wait
  went from about twelve minutes to about sixteen. **Not free, as a draft of this entry claimed** — `a11y` is the
  critical path now; it is simply cheaper than the ~28 minutes it would have cost inside `verify`. It also keeps a
  failure legible: a red `axe · overlay exit` names what broke without reading a log.
- **An unmeasured route fails the sweep — Claude.** The 2026-09-27 entry is the precedent: the 8 nodes once seen on
  `/blocks` appeared only when axe ran ahead of hydration. A route that did not load or did not hydrate tells you
  nothing about its accessibility, and a gate that treats silence as success is the fault this whole entry is about.

**Results**
Measured on this branch against the static export, 113 routes.

- `pnpm --filter @syntara/docs build`: 81 pages, 27s.
- `node scripts/axe-sweep.mjs`: 113 routes × 2 schemes, **0 violation nodes**, empty summary, **9m04s**.
- `node scripts/check-overlay-exit.mjs`: 108 tooltips, 4 menus and popovers, 0 failures, **1m52s**.
- **The new gate was tested in both directions, not just written.** Against a page with a missing `alt`, an empty
  button and an empty link: `6 violation node(s), 2 not-hydrated`, **exit 1**. Against two real routes: `0 violation
  nodes`, **exit 0**. Before the change the same broken page printed its 6 nodes and exited 0.
- **On a runner** (run `36595744517`, the first): `a11y` **16.4 min**, `verify` **11.8 min**, both green, both
  started 16:10:21Z. The axe sweep found 0 violation nodes there too. Well inside the 45-minute ceiling.
- The serve block was run verbatim from the workflow. Port 3000 was already taken by another session, serve fell back
  to **58738** and exited 0 as documented, and the block read 58738 from serve's output; `check-overlay-exit.mjs`
  then passed against it. That is the CLAUDE.md gotcha reproduced live, and the reason the port is not assumed.

**Found by measuring, not fixed**
- The existing hydration step in `verify` still assumes port 3000 (`curl ... http://localhost:3000/`). On a fresh
  GitHub runner nothing else binds 3000, and all six step-9 scripts assert the build id before measuring, so a wrong
  port fails loudly rather than silently. Left alone rather than risk a working job; the `a11y` job shows the pattern
  to copy if it ever does bite.
- `a11y` is now the slowest job in CI, so it sets how long a PR waits. 16.4 minutes against a 45-minute ceiling
  leaves room, but the margin is worth watching as routes are added: the sweep is 113 routes × 2 schemes today.

**Next**
- Anuj: this closes the CI gap recorded under "Found by measuring, not fixed" in the 2026-09-29 icons entry. The
  runtime question it raised is answered above — 16.4 minutes, comfortably inside the ceiling. If route growth ever
  brings it near 45, sharding by scheme across two jobs is the next move and the script needs no change for it.
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

**Changed — the icons gallery lands on its headings**

- **Jumping to a group from "On this page" left the heading under the toolbar.** The offset was on the wrong element:
  `scroll-margin-block-start` sat on `.group`, the `<section>`, while the id the table of contents links to is on the
  `<h3>` inside it — so the browser read 0 and landed the grid's first row under the sticky search/size/stroke bar.
  The offset moves to `.groupTitle`, where the id is. Pre-existing, and equal for all ten groups; it is just more
  visible the more groups there are.
- **The offset is the toolbar's measured height, not a number written down.** The toolbar wraps: 73.5px at 1280px,
  125.5px at 768px and below. A `ResizeObserver` in `icon-gallery.tsx` publishes it as `--_toolbar-block-size` on the
  gallery, and the heading's scroll-margin reads it. `:root`'s `scroll-padding-block-start` already clears the site
  header, so this clears only the toolbar and leaves the header's own `space-6` of air above the heading. The CSS
  fallback — the toolbar's own padding plus one control row, both tokens — covers the frame before hydration.
- **A deep link needed one more step.** The browser jumps to `#icons-<group>` before the gallery hydrates, so it uses
  that fallback, which is a row short once the toolbar wraps: at 390px the heading was still hidden. The first
  `ResizeObserver` callback now re-lands the fragment, but only if the heading is still about where the browser left
  it, so a reload that restored some other scroll position is untouched.
- **The table of contents highlight follows.** `toc.tsx` picked the last heading above a line derived from
  `scroll-padding` alone, so with the heading now sitting lower the spy highlighted the group above it. It subtracts
  each heading's own `scroll-margin-block-start` before comparing — a heading counts from where clicking its link
  would land it. Headings with no scroll-margin, which is every MDX page, are unaffected.

**Results — the icons gallery anchors** (build `V3e65Klx-BPhQGpPzPgeT`, served by `serve out -l 3210`)

- Clicking each of `icons-navigation`, `icons-status`, `icons-objects`, `icons-health` at 1280 / 768 / 390px: heading
  top **24.5px below the toolbar's bottom in all 12 cases**, and the right entry marked `aria-current="location"`.
  Was 0 of 12 — the heading sat 56px *above* the toolbar's bottom at 1280px. Measured in the page with Playwright
  against the served export.
- `node scripts/shoot.mjs "http://localhost:3210/docs/icons#icons-status" out.png --width=1280 --height=420` and the
  same for `#icons-travel` and `#icons-objects`, light and dark, at 1280px and 390px: heading visible in all six.
- The `toc.tsx` edit is a no-op everywhere but this page, measured rather than argued: every route that renders the
  shared `Toc` — the MDX docs pages, `/docs/components`, a component page, `/docs/icons` — **72 anchors clicked, and
  only 10 have a non-zero `scroll-margin-block-start`**, the ten group headings at 73.5px. Every other anchor computes
  0px, where the new expression is character-for-character the old one. All 72 highlight the entry that was clicked;
  the one "mismatch" per page is `#main`, the skip link, which is not a table-of-contents entry.
- `/colors` and `/blocks` do set `scroll-margin` (136px on `.tenant`, 80px on `.viewer`) but neither renders `DocsPage`,
  so neither has this spy on it at all — `aria-current` appears nowhere on either page. Their offsets are for the plain
  fragment jump and are untouched.
- Re-run on `bf30a2c` — the component-stills merge, which makes `/docs/components` about three times taller — with this
  change applied, by the session that built it: **45 anchors, 0 non-zero, 0 mismatches** beyond `#main` on each of
  `/docs/components`, `/docs/components/button`, `/docs/components/select` and `/docs/accessibility` as an untouched
  control. It matched the prediction made before the run. The build was proved to contain the change rather than
  assumed to: 4 chunks in `out/_next/static` carry `scrollMarginBlockStart`. A build id alone would not have shown
  that — it says whose build was served, not what was in it.
- `node scripts/axe-sweep.mjs`: 113 × 2, 0 violation nodes. `node scripts/check-hydration.mjs`: 226 loaded, 0 failures.
  `node scripts/check-narrow-overflow.mjs`: 113 routes at 320px, 0 scrolling sideways. `node scripts/check-csp.mjs`:
  113 routes, 0 failures. `node scripts/check-ssr-tabs.mjs`: 81 pages, 326 tab lists, 0 missing a panel.
  `node scripts/check-theme-links.mjs`: 0 / 5. `node scripts/check-override-weight.mjs`: 0.
  `pnpm drift apps/docs --min-score 95`: 98.5. `pnpm typecheck`: clean, 11 packages.
- Not fixed: the **last** group cannot clear the toolbar on a short viewport, because the page has already scrolled to
  its end — at 390 × 620 `#icons-filled` lands 16px short. Nothing but bottom padding on the gallery would move it,
  and that would leave dead space under every other group.

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

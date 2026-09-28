# ADR-033: Compact numbers are pinned to the build, and the figure renders as one node

- **Status:** Accepted — **Anuj** chose to pin to the build; Claude found the cause and decided the node-merging that makes it work.
- **Date:** 2026-09-28
- **Principles:** 7

## Context

- React error #418 was reported on `/`, `/blocks`, `/themes` and `/docs/components/amount`, in both schemes. It did not reproduce on a Mac — clean worktree, clean install, fresh build, 226 page loads, nothing — and was written up in the previous entry as a stale-port artifact. **That was wrong.** It reproduces on the Linux CI runner, exactly those four routes and both schemes.
- The cause is `Intl.NumberFormat` with `notation: 'compact'`. It is the one part of Intl whose output is not stable across ICU versions, and the runtime that prerenders the page is not the runtime that hydrates it. Measured on the runner: Node wrote `₹18.0K`, `$5.0K`, `£240k`; its own Chromium rendered `₹18T`, `$5K`, `£240K`. On this Mac the two agree, which is why it looked clean — and why the earlier elimination of Intl was not wrong about what it tested, only about what it covered. Plain currency formatting was compared across the runtimes and matches; compact was not tested.
- Three call sites use it: `chart.tsx` (the default value format, which reaches the y-axis labels, the data table and the summary — all prerendered), `amount.tsx` (`compact`), and the homepage's `compactMoney`. That is exactly the four routes.
- This is not a CI-only fault. On Cloudflare, any visitor whose browser data differs from the build machine's makes React discard the server HTML and re-render the page on the client.

## Decision

- **The build's string is what everyone sees.** `suppressHydrationWarning` on the elements that carry compact output: Amount's figure, currency, fraction and screen-reader text (only when `compact` — plain formatting is left alone, because suppressing more than necessary would hide a real mismatch later), and the chart's y-axis labels, table cells, caption and summary. Output is then identical in every browser, which for a design system is closer to a feature than a compromise, and `₹18K` reads better than the `₹18T` one CLDR produces.
- **Amount merges neighbouring plain parts into one text node.** This is what makes the above work, and it was found by measurement, not foresight: suppression alone did **not** fix the simulated fault. Intl returns as many parts as it likes, and how many depends on the value and the runtime — compact `18K` is two parts where `18.0K` is four. One node per part made that a difference in the *shape* of the DOM, which hydration cannot reconcile and `suppressHydrationWarning` does not cover; React reported `#418 args[]=HTML` rather than `args[]=text`. Merged, it is a difference in text, which suppression does cover.
- **`scripts/check-hydration.mjs` reports the text that differs**, as a multiset diff of the server HTML against the hydrated DOM. Without it this was invisible: the production error names nothing, and the only machine that reproduces it is a CI runner.

## Alternatives considered

- **Own the compact suffix** — derive `K`/`L`/`Cr`/`k`/`M` from our own per-locale table and stop asking Intl. Fully deterministic, correct in the HTML, no suppression anywhere, and the better end state. Rejected for now because the docs advertise "locale-correct ₹1.8L" and owning that data means being right for every locale the system supports, with tests to match. Worth an RFC.
- **Format after mount only.** Guaranteed to match, no suppression. Rejected: a visible jump on every load, and the compact figure would be absent from the HTML — including the hero numbers on the homepage.
- **Do nothing and let React recover.** It does recover, by throwing away the server render and rebuilding the page on the client. That is the cost being avoided.

## Consequences

- **Good:** the four routes hydrate, and compact figures read the same for every visitor regardless of their browser's data. Amount also renders fewer nodes.
- **Bad:** the figure is pinned to whatever ICU the build machine had, so a Linux deploy and a Mac deploy of the same commit can ship different strings. The build is reproducible; which string it produces is not, across machines.
- **Bad:** if a suppressed element re-renders for its own reasons after hydration, React replaces the text with the browser's version and it visibly changes. Compact figures in this system are static, so nothing does that today.
- **Bad:** `suppressHydrationWarning` on those elements will also hide a genuine mismatch in the same text later.
- **Revisit when:** the RFC for owning the compact suffix is written; or a compact figure becomes part of something that re-renders.

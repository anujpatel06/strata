---
'@syntara/react': patch
---

Compact figures no longer fail hydration

`Intl.NumberFormat` with `notation: 'compact'` is not stable across ICU versions, and the runtime that prerenders a
page is not the one that hydrates it. Measured on a Linux runner: Node produced `₹18.0K`, `$5.0K`, `£240k` where its
own Chromium produced `₹18T`, `$5K`, `£240K`. Any page with a compact figure — `Amount compact`, or a chart, whose
y-axis labels, data table and summary are all prerendered — threw React error #418, and React discarded the server
HTML and re-rendered the whole page on the client.

The build's string now stands, identically for every reader (ADR-033). Two changes make that work:

- `suppressHydrationWarning` on the elements that carry compact output, and only those. Plain currency formatting is
  untouched — it matches across runtimes, and suppressing more than necessary would hide a real mismatch later.
- **`Amount` renders the figure as one text node** instead of one per Intl part. Intl returns as many parts as it
  likes and the count depends on the value and the runtime (`18K` is two parts, `18.0K` is four), which made the
  difference structural rather than textual — and `suppressHydrationWarning` does not cover a change in the shape of
  the DOM. If you query inside `Amount`'s figure by child index, that index has changed; the currency and fraction
  spans still carry their own classes.

Compact figures are now pinned to whatever ICU built the site, so they read the same in every browser, and a Linux
build and a macOS build of the same commit can ship different strings.

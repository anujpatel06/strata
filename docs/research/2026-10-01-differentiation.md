# Research: how Syntara differs — re-run before publishing

- **Date:** 2026-10-01
- **Asked by:** Anuj ("merge the PR and do the differentiation research")
- **Supersedes:** [`2026-09-27-differentiation.md`](2026-09-27-differentiation.md), which asked for exactly this re-run before Phase 6. That file stays as the record; where the two disagree, this one is current.
- **Method:** primary pages read directly in a browser on 2026-10-01. Where a claim is a count, the count was taken from the live page text, and the expression that produced it is written next to it.

## How to read this

- **[V]** read on a primary or official page today · **[S]** search snippet or secondary source · **[U]** could not be verified.
- "Not found" is **absence of evidence**, not proof of absence.
- No number here was produced by a Syntara script. **None of them may appear on the site as a Syntara metric.**

## 1. What changed since 2026-09-27

**RTL has stopped being a differentiator.** This is a retraction: the previous file's "Where Syntara stands" table said shadcn's RTL was "an opt-in transform with manual exceptions. Syntara's is by default." That is no longer a fair contrast.

- **shadcn/ui** now opens its RTL page with "first-class support for right-to-left (RTL) layouts". With `rtl: true` in `components.json` the CLI converts `left-*`/`right-*` to `start-*`/`end-*`, updates directional props, and flips supported icons with `rtl:rotate-180`. The one real limit: automatic transformation "is only available for projects created using `shadcn create` with the new styles (`base-nova`, `radix-nova`, etc.)" — other styles go through a migration guide. [V] https://ui.shadcn.com/docs/rtl
- **Untitled UI React** — flagged last time as the closest stack to Syntara and left unchecked — ships RTL by **logical properties on the components themselves**, documents `I18nProvider` for React Aria's portalled overlays, and has `npx untitledui@latest migrate` to convert physical classes. That is the same mechanism and the same portal fix as Syntara's (ADR-012, `locale` on `ThemeScope`). [V] https://www.untitledui.com/react/docs/rtl

**Syntara may no longer claim RTL as a point of difference.** Doing RTL properly is now the floor among serious React libraries, not the ceiling.

## 2. What survived: generated, contrast-guaranteed theming

Every theming page checked today tells the user to supply the colours and says nothing about whether they are legible.

| Page | "contrast" | "WCAG" | "accessib*" | "multi-brand" |
|---|---|---|---|---|
| ui.shadcn.com/docs/theming | **0** | **0** | **0** | **0** |
| untitledui.com/react/docs/theming | **0** | **0** | **0** | — |

Counts from each live page's own text, via `(t.match(/contrast/gi)||[]).length` and the same for the others, run in the browser on 2026-10-01. [V]

- **shadcn/ui** gives semantic `--primary` / `--primary-foreground` pairs in OKLCH and leaves the values to you. Pairing is a naming convention, not a checked relationship. [V]
- **Untitled UI React** asks you to pick a Tailwind palette or hand-write eleven shades, and its own FAQ states the burden: *"Just make sure to define all the necessary color shades (from 50 to 950) for a consistent look."* Multi-brand is "create multiple theme files and apply them to different parts of your application using CSS scoping techniques" — hand-rolled, exactly as the previous research predicted for everyone else. [V]
- **tweakcn** advertises a "Contrast Checker — Ensure designs meet accessibility standards with built-in contrast ratio checking", and on its landing page says nothing about solving, auto-fixing or guaranteeing: `/guarantee|solve|auto-?fix/gi` → **0 matches**. It still checks rather than fixes. [V] https://tweakcn.com

**So the honest differentiator has narrowed to one sentence:** everyone lets you theme; nobody generates a theme that is guaranteed to pass, from a handful of inputs, with the failures fixed rather than reported. Syntara's contrast solver and its 1,000-brand fuzz report are the claim. Not React Aria, not RTL, not tokens, not an MCP server.

## 3. 21st.dev — upgraded from [U] to [V]

The previous file marked 21st's review process and payouts unverified. Read first-hand on 2026-10-01:

- **Submissions are reviewed by a person.** The pipeline is `on_review` → `posted` → `featured`, and the maintainer states he personally reviews each component before featuring it. [V] https://github.com/serafimcloud/21st
- **Two separate lists.** 143 libraries "On 21st" (uploaded by authors) and ~360 registries in a **shadcn directory crawled from public repos** and ranked by GitHub stars. React Aria sits in the crawled directory (154 components, ★16k) having never published. An auto-indexed author page carries a banner saying 21st created it and that the person has not signed up. [V]
- **Templates:** open-source ones are rehosted pinned to one commit with the licence intact, installed via `npx @21st-dev/cli@latest template add <slug>`; paid ones run $19–$99. [V]
- **What that market rewards.** Category sizes: Buttons 2043, Cards 1780, Forms 1522, Heroes 1152 — against Sign Ins 103, Toasts 79, Empty States 77. The popular list is scroll animations, shaders and liquid-glass buttons at 6–10k bookmarks. **Documentation templates: 11**, out of roughly 700. [V]

**Reading for Syntara.** The empty Documentation shelf is real, and so is the reason it is empty: this audience buys marketing spectacle, not accessible primitives or governance. Nothing in the popular lists rewards what Syntara is good at. Listing there is cheap and harmless, but it should be treated as a backlink, **not** as evidence that design-engineer registries are Syntara's audience. On the current evidence they are not.

## 4. Where Syntara stands — revised

| Area | Status |
|---|---|
| Components | Commodity. Concede it. |
| React Aria as the behaviour layer | **Matched.** Untitled UI React and HeroUI v3 both use it. |
| RTL by logical properties | **Matched, as of this re-run.** shadcn and Untitled UI React both ship it. **Stop claiming it.** |
| Theme from a seed colour | Material does this. Not new in kind. |
| **Theme that is *solved* to pass, not merely checked** | **Unmatched in everything read today.** This is the claim. |
| Multi-brand from data, not hand-rolled theme files | Unmatched: competitors say "write more theme files". |
| MCP server | Table stakes. |
| Governance (RFCs, deprecation, codemods) | Still not documented by any component library surveyed. |
| Published, reproducible evidence | Still not found anywhere. Still the opening. |

## 5. Claims Syntara must not make

Carried over, plus one new:

- **New: "RTL by default, unlike the others."** False as of 2026-10-01. shadcn calls its RTL first-class; Untitled UI React uses logical properties throughout.
- "shadcn has no RTL" or "no AI tooling". Both shipped in 2026.
- "First to guarantee contrast." Material is a precedent.
- APCA or WCAG 3 conformance.
- Any "first" or "only" without a fresh check on the day it is published.
- Anything about a company's internal design system.

## 6. Follow-ups

Closed by this pass:

- [x] Check Untitled UI React's theming and RTL in depth — §1 and §2.
- [x] 21st.dev review process and payouts — §3.
- [x] Re-run this research before Phase 6 (publish).

Still open:

- [ ] Reproduce the shadcn focus-ring contrast claim with a script before citing it. Still uncited, still carried from 2026-09-27, and the source sells a competing kit.
- [ ] Read live job descriptions on the companies' own career pages (Anuj).
- [ ] Read the Supreme Court judgment and the SEBI and RBI circulars at source.
- [ ] HeroUI v3 and coss ui were not re-read today; their rows above are carried from 2026-09-27 and are now [S] at best.

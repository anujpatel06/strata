# ADR-040: One figure per brand card, and both actions on one line

- **Status:** Accepted — **Anuj** (he asked for the cards to be shorter, chose this option from four measured ones,
  and then asked for the two buttons side by side after seeing them wrapped).
- **Date:** 2026-10-01
- **Scope:** `apps/docs` homepage only — the "One card. Five brands." rail. No component, token or tenant data changes.
- **Principles:** 1, 4

## Context

- The brand rail's cards were the tallest thing on the homepage. Measured on the dev build at a 1440px window:
  the tallest card **700px**, the rail row (card + caption) **781px**. At that height the section below never
  appears without scrolling, and the cards read as portrait panels rather than as one card shown five ways.
- The height came from the two figures stacking. Each card is **342px** wide inside its 384px rail slot
  (`brand-rail.module.css`, `flex-basis: calc(var(--syntara-space-16) * 6)`), and `.tenantStats` will not let a tile
  go below **160px** before its figure starts breaking. Two tiles plus the gap need 332px against roughly 300px of
  free width, so `auto-fit` dropped them into one column: **261–293px** of card for two tiles that were meant to sit
  side by side.
- The 160px floor is not arbitrary. The comment above `.tenantStats` records why: fixed at two columns, a 320px
  phone gave each tile an 86px column and Vela's `₹1,84,250` at display size — which has no break opportunity —
  overflowed by 71px and scrolled the whole page sideways.

## Decision

- **Each brand card shows one figure, not two.** `getTenantOverviews` slices the tenant's `overview.stats` to the
  first entry instead of the first two (`apps/docs/components/home/home-data.ts`).
- **Which figure survives is content, not code**: it is whichever is first in that tenant's `content.json`. Today
  that is Available balance (Vela), Active policies (Harbor), رصيد النقاط (Qamar), OPD wallet left (Care) and
  इस महीने की कमाई (Haat) — the headline number in every case. Re-ordering the file is how a tenant changes it.
- **The data keeps both figures.** Nothing is deleted from any `content.json`, so the second number stays available
  to `/themes`, the playground and anything built on the same content later.
- **Both actions sit on one line**, which Anuj asked for after seeing the first result. They are made to *fit*
  rather than forced: the two buttons are `size="sm"`, and `CardFooter` keeps its own wrapping, so a card that is
  too narrow for the pair still wraps instead of clipping.
- **Care's primary action is "Book a visit"**, shortened from "Book a consultation". At `sm` the pair fits in four
  of the five brands; Care's was 39px too wide, and its label is the longest on the page. English demo copy, so the
  change is ours to make — the Hindi and Arabic labels were left alone and fit as they are.

## Consequences

- Measured on the same build, same 1440px window, before and after:

  | | tallest card | rail row |
  |---|---|---|
  | two figures, wrapped footers | 700px | 781px |
  | one figure, wrapped footers | 543px | 622px |
  | one figure, both actions on one line | 512px | 590px |

  **−188px on the card, −191px on the row** (24%). The section below the rail is now in view with the cards.
- Nothing is clipped: `scrollWidth − clientWidth` is **0** for every figure and every footer in all five cards at
  1440px, all five footers are one row, and the narrow-overflow sweep reports **0** pages scrolling sideways at
  320px. At 375px the footers wrap to two rows again, still with 0 overflow — which is the point of leaving
  `CardFooter`'s wrapping alone.
- **Vela's buttons are exactly 24px tall**, the floor in WCAG 2.2 § 2.5.8 and in this repo's rules: it is the one
  tenant whose density is Compact, and `sm` takes `--syntara-control-height` down by `space-2`. It passes, with
  nothing to spare. Anything that shrinks these controls further fails, so `sm` is the smallest size this card can
  use.
- The rail demonstrates one `StatTile` per brand rather than a pair of them. The pair is still shown on the homepage
  — the live showcase above renders whole examples — so the component is not hidden from the page.

## Alternatives rejected

- **Widen the card until two tiles fit** (384 → 432px): 781 → 606px, about the same saving, but Care's `₹10,600`
  was clipped by **11px** and fewer cards fit across the rail before scrolling. Trading one overflow for another.
- **Squeeze two columns in at today's width** (tile floor 160 → 136px): 781 → 660px, and **three of five** cards
  clipped their figure — Vela by 6px, Haat by 16px, Care by 35px. This is the bug the `.tenantStats` comment warns
  about, re-introduced for 121px.
- **`flex-wrap: nowrap` on the footer**, the first attempt at putting the actions on one line, and the wrong tool:
  it does not squeeze the buttons. `Button` sets `flex-shrink: 0` and `white-space: nowrap` with nothing to
  truncate it, so the second button is pushed past the card's edge and clipped by the scope — Care by **48px** at
  1440px, and at 375px **every** card overflowed (Qamar 9px to Care 139px). Making the pair fit, and leaving the
  wrapping in place for the widths where it cannot, gets the same line without any of that.
- **Keeping the default button size and shortening every label instead**: it would have meant rewriting the Hindi
  and Arabic calls to action, which fit as they are, to solve an English layout problem. One English label moved;
  the rest of the copy stands.
- **Drop the alert strip** (another 72px per card): not needed once the figures stopped stacking, and it would take
  `Alert` out of the only place on the homepage that shows it inside a real card.

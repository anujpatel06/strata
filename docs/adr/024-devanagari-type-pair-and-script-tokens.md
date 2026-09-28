# ADR-024: Mukta for Devanagari, and type tokens set by measurement

- **Status:** Proposed — **Claude recommended, pending Anuj**. The tenant (Haat, reseller commerce, `#B5179E` and `#F48C06`) and who reviews the Hindi are **Anuj's** decisions (2026-09-28).
- **Date:** 2026-09-28
- **Principles:** 1, 2, 3

## Context

- ADR-020 asked for a Hindi tenant whose type tokens come from measurement. A tenant still has six inputs.
- Devanagari has a headline and marks above and below it. Line heights tuned for Latin can clip it.
- Six open-licence fonts were measured with `node scripts/check-script-clipping.mjs`: every size from 12 to 48px, two weights, two screen densities, four sub-pixel positions.

## Decision

- **The type pair carries the script.** New pair `bilingual-devanagari`: Mukta for headings and body, JetBrains Mono for code. Components read the same tokens as before; the pair sets their values.
- **Mukta, not Noto Sans Devanagari.** Noto's Latin sits better beside the Devanagari and was the first pick. Measurement changed it: with Noto, the browser's ellipsis ended on a half letter in 11 of 160 cuts. With Mukta it did in 0 of 152, and Mukta needs the lowest line height of the six (1.44).
- **Line height:** tight 1.44, snug 1.44, normal 1.5. At 1.43 the top marks clip in 11 cases at 12–14px. Tight and snug are equal because both Latin values clip.
- **Caps tracking is 0.** At 0.08em it breaks the headline. Minimum size is 12px, which changes nothing today.
- **The fuzz keeps its original eight pairs.** Adding the ninth would give 487 of the 1,000 brands a different pair. A test checks the inputs' hash and that a type pair never changes colour output.
- **Latin output is unchanged** in CSS, DTCG and shadcn, checked by hash. Figma gains `font/lineHeight` for every pair; it had none before.
- **Haat's Hindi is a draft** until Anuj has read it. `content.json` says so in `copyReview`, and the docs show it wherever the copy is shown.

## Alternatives considered

- **Noto Sans Devanagari:** better Latin, but the truncation fault changes how a word reads.
- **A seventh brand input for script:** explicit, but it breaks "six inputs" and lets a brand pick a script its font can't draw.
- **Read the script from the tenant's locale:** the locale lives in `content.json`, and the engine only sees `brand.json`.

## Consequences

- **Good:** no Devanagari clipping across 5,616 measured cases. Haat passes 118 of 118 contrast checks and ships both brand colours exactly.
- **Bad:** Mukta's Latin is small (x-height 0.47em against Inter's 0.546), so prices and SKUs read about 14% smaller than in Vela. Nine components set `line-height: 1` themselves and ignore the token; they weren't measured. The same script found clipping in existing pairs: descenders in four Latin pairs at the tight line height, and both Arabic pairs even at normal. None of those were changed.
- **Revisit when:** Anuj has reviewed the pair and the copy; the clipping in the existing pairs is decided; a second Indic script is added.

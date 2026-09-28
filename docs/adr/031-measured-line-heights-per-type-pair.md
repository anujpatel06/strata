# ADR-031: Line heights belong to the type pair, and every value is measured

- **Status:** Accepted — **Anuj** asked for the clipping to be fixed; Claude measured and chose the values.
- **Date:** 2026-09-28
- **Principles:** 7

## Context

- `scripts/check-script-clipping.mjs` had been reporting clipped glyphs since Phase 5a, recorded under "Found by measuring, not fixed": both Arabic pairs clipped at the normal line height by up to 12px, and four Latin pairs clipped descenders at the tight one, Care's pair in 269 cases.
- Foundations shipped one line-height scale for every pair — `tight: 1.2, snug: 1.35, normal: 1.5` — chosen for Latin. ADR-020 had already added a per-pair `script` override, but only the Devanagari pair used it, and its type was literally `name: 'devanagari'`.
- A clipped descender or a cut Arabic vowel is not a taste question. It is text the reader cannot fully see, on a system whose whole claim is that a brand is data and every brand renders correctly.

## Decision

- **Six of the nine pairs carry their own measured line heights.** `ScriptTypeTokens.name` widens to `'devanagari' | 'arabic' | 'latin'`, and `minFontSize` and `capsTracking` become optional so a pair can override line height alone.

  | Pair | tight | snug | normal | Was clipping |
  |---|---|---|---|---|
  | bilingual-round (Qamar) | 1.8 | 1.8 | 1.9 | 2,486 cases, to 12px |
  | bilingual-classic | 1.8 | 1.8 | 1.9 | 2,413 cases, to 10px |
  | friendly (Care) | 1.35 | 1.4 | 1.5 | 269 cases, to 2px |
  | editorial | 1.3 | 1.35 | 1.5 | 28 cases, to 1px |
  | calm (Harbor) | 1.3 | 1.35 | 1.5 | 9 cases, to 0.5px |
  | technical | 1.3 | 1.35 | 1.5 | 4 cases, to 1px |

- **`precise` (Vela) and `modern` (the site) are untouched.** They clipped nothing and keep the shared scale. Their exporter hashes are byte-identical to every earlier recording, which is how the test proves the change is confined.
- **Every value was measured, never interpolated.** `node scripts/check-script-clipping.mjs --pairs=<id> --lh=<value>`, sweeping until nothing clips at any size, weight, DPR or sub-pixel offset, then verified again with no `--lh` so the script reads the real tokens. The result is **0 clipped in 42,768 cases**, down from 5,209, and the script now exits 0.
- **Clipping is not monotonic in line height,** so a value is only known good once measured at exactly that value. `editorial` clips 10 cases at 1.22 and 31 at 1.25, then none at 1.3: the line box rounds to device pixels, so a larger line height can move ink onto the wrong side of a boundary. This is written into the type's doc comment, because the obvious instinct — "raise it a bit more to be safe" — is wrong here.

## Alternatives considered

- **Raise the shared Latin default from 1.2.** One change instead of four, and arguably 1.2 was always too tight. Rejected because it would loosen every Latin brand, including the two that clip nothing and the house theme the whole site is set in, to fix four that do. The per-pair override already existed for exactly this.
- **Leave the Arabic pairs and document it.** That is what Phase 5a did, and it left Qamar shipping cut vowels for a month. Arabic is 93% of the fault and the worst of it.
- **A per-size line-height curve** rather than one value per step name, so 48px headings need not be as loose as 12px body. Better typography, and worth an RFC, but it changes the shape of the token contract for every consumer and every exporter. Not something to introduce while fixing a defect.

## Consequences

- **Good:** no glyph's ink leaves its line box in any pair, at any size, weight or DPR the script tests. The check now exits 0, so a regression fails CI instead of being logged.
- **Bad:** Arabic is visibly airier. 1.8 is a large tight line height, and Qamar's headings and table rows are taller than before. Fully vowelled Arabic genuinely needs that room — the test strings include harakat — but if Qamar's real copy is never vowelled, a tighter value would look better and still be safe for that content. Anuj should look at Qamar and say whether he wants the safe value or one measured against unvowelled copy only.
- **Bad:** `tight` and `snug` are now equal for the Arabic pairs, as they already were for Devanagari, so those two steps of the scale no longer differ there.
- **Revisit when:** Anuj reviews Qamar's density; or a per-size curve is specified in an RFC.

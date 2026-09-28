# ADR-032: Initials take the letter, date placeholders come from Intl, and a clip box gets room

- **Status:** Accepted — **Claude** (pending Anuj's review). The initials rule is a judgement about how Hindi names read and is the one to overrule if he disagrees.
- **Date:** 2026-09-28
- **Principles:** 7

## Context

Four faults were recorded in Phase 5a under "Found by measuring, not fixed". Measuring them again first changed what three of them were.

- **"Nine components set `line-height: 1` and ignore the per-script token."** True as written, but only one of them cut anything. `line-height: 1` is only a clipping risk where the same element also clips its overflow; everywhere else the ink simply renders outside the line box. Checking every element on seven blocks in Hindi, Arabic and Latin for `overflow-y: hidden` with content taller than its box found exactly one: `PersonChip`'s `.name`, losing 4px off Hindi names in four places. Arabic and Latin were clean.
- **Avatar turned "रेखा यादव" into "रेया".** A grapheme cluster in a Brahmic script is a consonant plus its vowel signs — a whole syllable. One syllable per word, run together, reads as a word rather than as initials, and a lone "रे" is easily taken for ₹, which is built on the same letter.
- **The date field showed "dd / mm / yyyy" under hi-IN.** React Aria ships segment placeholders for 34 locales. `ar-AE` is one; `hi-IN` is not, so it fell back to the English strings.
- **The ellipsis ended on a half letter:** "बच्चों के स्पोर्ट्स जूते" became "…स्पोर्ट्…" at 390px — a dead consonant with a trailing virama, which is not a word.

## Decision

- **PersonChip's name gets room inside its clip box, not a new line height.** `margin-block: -0.3em; padding-block: 0.3em` — the box grows, the layout does not. Raising its line height to the token would have made Arabic chips much taller to fix a Hindi fault, and Arabic was not clipping.
- **Initials take the base letter in Brahmic scripts:** marks dropped, and for a conjunct the consonant it starts with. "रेखा यादव" → "रय", "क्षमा शर्मा" → "कश", "अंजलि" → "अ". Latin, Arabic and emoji are untouched. Devanagari, Bengali, Gurmukhi, Gujarati, Oriya, Tamil, Telugu, Kannada, Malayalam and Sinhala.
- **Date placeholders fall back to Intl, for every locale, not to Hindi strings we ship.** `Intl.DisplayNames(locale, {type: 'dateTimeField'})` gives "दिन", "माह", "वर्ष". Only where React Aria has nothing: the test is that the locale's script is not Latin and the placeholder came back as plain ASCII, which is what the English fallback looks like. Where React Aria has strings they are kept, because a date input wants the shape of the value ("dd") over the name of the field ("day") — which is also why this is not applied to Latin locales at all.
- **The activity table's title wraps on a phone instead of truncating.** CSS has no grapheme-aware truncation, and the title missed fitting by 11px. The meta line under it still truncates; it cuts at an order number.

## Alternatives considered

- **Give all eleven `line-height: 1` rules a token.** Ten of them were not cutting anything, and the ones on icon boxes are right as they are. It would have made every pill taller in Arabic to fix one Hindi chip.
- **Ship Hindi date strings.** Fixes Haat and no one else. Intl fixes every locale React Aria has not got to.
- **Transliterate initials to Latin** ("रेखा" → "R"). Roman initials on a Hindi name are a different kind of wrong.
- **Grapheme-aware truncation in JavaScript.** The general fix, and the only one that would work at every width. It needs per-element measurement and a ResizeObserver, which is a feature to specify, not something to add while fixing a defect. Worth an RFC if truncated Indic text shows up anywhere else.

## Consequences

- **Good:** nothing on the Hindi or Arabic blocks is cut, the date field reads in its own language, and initials read as initials.
- **Bad:** the truncation fix is one block's CSS, not a system-wide answer. Any other component that truncates Indic text can still stop inside a cluster. `scripts/check-script-clipping.mjs` already reports this per type pair ("renders matched no prefix"), so the measurement exists; the fix does not.
- **Bad:** the Intl fallback is keyed on a heuristic — non-Latin script, ASCII placeholder. If React Aria adds Hindi strings, ours stop being used, which is the right outcome but is not obvious from the code alone.
- **Revisit when:** React Aria ships more locales; or truncated Indic text appears outside the activity table.

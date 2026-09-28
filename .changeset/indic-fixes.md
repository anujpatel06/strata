---
'@syntara/react': patch
---

Avatar initials, date placeholders and PersonChip no longer break in Indic scripts

- **Avatar** takes the base letter in Brahmic scripts instead of the whole syllable. A grapheme cluster there is a
  consonant plus its vowel signs, so one per word ran together as a word: "रेखा यादव" gave "रेया", and a lone "रे"
  reads as ₹. Now "रय"; a conjunct gives the consonant it starts with ("क्षमा शर्मा" → "कश"). Covers Devanagari,
  Bengali, Gurmukhi, Gujarati, Oriya, Tamil, Telugu, Kannada, Malayalam and Sinhala. Latin, Arabic and emoji initials
  are unchanged.
- **DatePicker** fills in segment placeholders from `Intl.DisplayNames` for locales React Aria has no strings for. A
  Hindi field read "dd / mm / yyyy"; it now reads "दिन / माह / वर्ष". Only where React Aria fell back to English on a
  non-Latin locale — its own strings are kept where it has them, because a date input wants "dd" over "day".
- **PersonChip** no longer shaves the top and bottom off names in scripts with marks above and below the letters. The
  ellipsis needs `overflow: hidden`, which made the name a clip box exactly as tall as its line; Hindi names lost 4px.
  The box now has room, and the chip's height is unchanged.

`getInitials` is exported and its output changes for Brahmic-script names — if you snapshot avatar initials, those
snapshots will need updating.

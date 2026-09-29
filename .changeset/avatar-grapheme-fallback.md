---
'@syntara/react': patch
---

Avatar initials keep a grapheme cluster whole where `Intl.Segmenter` is missing

`getInitials` fell back to the first code point when the runtime has no `Intl.Segmenter`, which took half of a flag
(`🇮🇳` → one regional indicator) and dropped a decomposed accent (`e` + U+0301 → `E`). It now approximates a cluster —
a base character with its combining marks, skin tones and zero-width-joiner sequences, or a flag's two regional
indicators. Where `Intl.Segmenter` exists nothing changes.

Initials in Brahmic scripts are unchanged: still the base letter with its marks dropped (ADR-032), `रेखा यादव` → `रय`,
now proven to hold on both the segmenter and the fallback path.

---
'@syntara/react': minor
---

Add `StreamingResponse` (alpha), with `ResponseText`, `ResponseSources` and `ResponseSource`: a model's answer as it
is written, that screen readers can follow (RFC-002, ADR-041).

The visible text is never a live region. A separate polite one speaks "Writing response", then each finished
sentence once (split with `Intl.Segmenter`, so the Hindi danda and the Arabic question mark end sentences), then
"Response complete", "Stopped" or "Couldn't finish". `announce="status"` speaks only the start and the end. Every
spoken and shown word is a prop.

The visual layer: `ResponseText` lets each new word arrive in the brand's text colour and settle into the body
colour (colour and opacity only, so it stays on with reduced motion), with a glowing caret while streaming; the
"Writing…" label carries a sweeping shimmer; `ResponseSources` pops citation chips in one after another.

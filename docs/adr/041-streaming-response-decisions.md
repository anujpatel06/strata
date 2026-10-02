# ADR-041: StreamingResponse's open questions, and the writing shimmer

- **Status:** Accepted — **Anuj** (2026-10-03: answered RFC-002's three open questions "ok" to Claude's
  recommendations, and "yes" to the shimmer's exception to the motion rules).
- **Date:** 2026-10-03
- **Scope:** `packages/react` — `streaming-response.tsx` and its CSS module. RFC-002 moves from Draft to Accepted.
- **Related:** [RFC-002](../rfcs/002-streaming-response.md), research gap 1 in
  [2026-10-02-ai-components.md](../research/2026-10-02-ai-components.md).

## Context

- RFC-002 left three questions for Anuj: the name, the default verbosity, and whether the status line hides once
  a response is complete.
- The visual layer added on 2026-10-03 (`ResponseText`, `ResponseSources`, `ResponseSource`) sweeps a light across
  the "Writing…" label. It animates `background-position`, which CONVENTIONS' motion rules do not list (only
  opacity, transforms, colours and box-shadow).

## Decision

1. **Name:** `StreamingResponse`. Matches "response" in most AI APIs.
2. **Default verbosity:** `announce="sentences"`. `"status"` stays available for long answers.
3. **Status line hides on `complete`.** A finished answer needs no badge; "Response complete" is still spoken.
4. **The shimmer may animate `background-position`**, as a documented exception alongside Toast's `block-size`:
   one short label, nothing reflows, both ends of the sweep are text roles that pass 4.5:1 (so every frame does),
   it runs only under `prefers-reduced-motion: no-preference`, and forced-colours mode drops it for `CanvasText`.

## Consequences

- New text roles or a longer shimmered string would need this exception re-argued, not assumed.
- Still owed before beta: a real screen-reader run (VoiceOver, NVDA), per RFC-002's checklist.

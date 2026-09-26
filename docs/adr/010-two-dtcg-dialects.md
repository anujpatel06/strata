# ADR-010: Two DTCG dialects — canonical and Figma

- **Status:** Proposed — Claude recommended, pending Anuj
- **Date:** 2026-09-26
- **Principles:** 5, 6

## Context

- DTCG Format 2025.10 is the stable spec. Colours are objects (`colorSpace`, `components`, optional `hex`); dimensions are `{ value, unit }`.
- Many Figma variable-import plugins still read the older draft: colours as hex strings, dimensions as plain numbers.
- Figma caps modes per collection by plan (Anuj to confirm his plan's limit). Brand × scheme × density is 12 combinations.

## Decision

- **Canonical export** follows DTCG 2025.10 exactly: `{ "colorSpace": "srgb", "components": [r, g, b], "hex": "#rrggbb" }`, `{ "value": 16, "unit": "px" }`, Strata metadata under `$extensions` (`com.strata.*`).
- **Figma export** uses hex strings and plain numbers.
- Figma modes split across collections: **Brand** (Vela / Harbor / Qamar), **Scheme** (Light / Dark), **Density** (Comfortable / Compact). No collection needs more than 3 modes.
- The **Brand** collection holds the ramps *and* a brand-resolved role layer (`role.light.action.primary.fg` …), because 5–6 roles per scheme land on different ramp steps per brand (e.g. ink vs white labels). **Semantic** Light/Dark only alias into that role layer, so the Semantic files are identical for every tenant — `pnpm tokens` fails if they ever differ.
- Both come from the same engine (ADR-001). The Figma file is a projection — never edited by hand.

## Alternatives considered

- **2025.10 only** — today's plugins fail or mis-import colour objects.
- **Old draft only** — the canonical file would be non-compliant; migrating later touches every consumer.
- **One Figma collection with 12 modes** — exceeds common plan limits and hides the architecture.

## Consequences

- **Good:** the canonical file is spec-valid; Figma import works today; the collection split mirrors the code's modes.
- **Bad:** two formats to test. Values that depend on brand × scheme need aliases across collections — one extra hop for designers.
- **Revisit when:** the main Figma import plugins read 2025.10. Then drop the Figma dialect.

# ADR-010: Two DTCG dialects — canonical and Figma

- **Status:** Accepted — Claude recommended, Anuj accepted (2026-09-27); Anuj is on Figma Starter, so the single-mode layout was added
- **Date:** 2026-09-26 (revised 2026-09-27)
- **Principles:** 5, 6

## Context

- DTCG Format 2025.10 is the stable spec. Colours are objects (`colorSpace`, `components`, optional `hex`); dimensions are `{ value, unit }`.
- Many Figma variable-import plugins still read the older draft: colours as hex strings, dimensions as plain numbers.
- Figma caps modes per collection by plan. Per Figma's "Figma plans and features" page (checked 2026-09-27): Professional up to 10, Organization up to 20, Enterprise more ("unlimited modes with extended collections"). Starter (free) has no variable modes row, and the variables docs say only Education or paid plans can add more mode columns — so a Starter collection has one mode.
- Anuj is on Starter.
- There are 5 tenants (Vela, Harbor, Qamar, Care, house) × 2 schemes × 2 densities = 20 combinations.

## Decision

- **Canonical export** follows DTCG 2025.10 exactly: `{ "colorSpace": "srgb", "components": [r, g, b], "hex": "#rrggbb" }`, `{ "value": 16, "unit": "px" }`, Syntara metadata under `$extensions` (`com.syntara.*`).
- **Figma export** uses hex strings and plain numbers.
- The Figma export has two layouts, chosen with `toFigmaFiles(theme, { modes })`. Both use the same dialect and the same variable names (`color/<role>`, `radius/…`, `font/…`, `density/…`).
- **Multi-mode (default, `modes: 'multi'`; Professional or higher).** Modes split across collections: **Brand**, **Shape** and **Type** (one mode per tenant — 5 today, under Professional's 10), **Semantic** (Light / Dark), **Density** (Comfortable / Compact).
  - The **Brand** collection holds the ramps *and* a brand-resolved role layer (`role.light.action.primary.fg` …), because 5–6 roles per scheme land on different ramp steps per brand (e.g. ink vs white labels). **Semantic** Light/Dark only alias into that role layer, so the Semantic files are identical for every tenant — `pnpm tokens` fails if they ever differ.
- **Single-mode (`modes: 'single'`; Starter).** This is the answer to Anuj's plan. Every collection has exactly one mode, `Value`, and each combination is its own collection: `<Brand> · Light` and `<Brand> · Dark` (every role as a resolved hex, plus that scheme's ramps under `ramp/<name>/<step>`), `<Brand> · Size` (radius, type, the brand's default density) and `<Brand> · Size <other density>`. No aliases: with one mode per collection there is nothing for an alias to switch. You switch brand, scheme or density by swapping libraries or collections, not modes. The docs Themes export and the Brand Generator have a "Figma plan" control (`?figmaPlan=starter`); `pnpm tokens` writes both layouts (`figma/`, `figma-starter/`).
- Both come from the same engine (ADR-001). The Figma file is a projection — never edited by hand.

## Alternatives considered

- **2025.10 only** — today's plugins fail or mis-import colour objects.
- **Old draft only** — the canonical file would be non-compliant; migrating later touches every consumer.
- **One Figma collection with 20 modes** — exceeds Professional's 10 and hides the architecture.
- **Starter: one file per tenant with everything flattened into one collection** — simpler, but light and dark would need different variable names, so a frame couldn't switch scheme by swapping a collection.
- **Starter: keep aliases (roles → ramps in the same collection)** — possible, since both live in one collection, but it mixes aliased and literal roles (the solver's adjusted roles are literals) and adds a hop. Resolved hex equals `theme.schemes[s].roles[r].hex` exactly, which the tests check.

## Consequences

- **Good:** the canonical file is spec-valid; Figma import works today; the collection split mirrors the code's modes.
- **Bad:** two formats and two Figma layouts to test. In the multi layout, values that depend on brand × scheme need aliases across collections — one extra hop for designers. In the Starter layout, switching a frame's brand or scheme means swapping a library or collection by hand, and nothing in Figma links a Light role to its Dark twin except the shared name.
- **Revisit when:** the main Figma import plugins read 2025.10 (then drop the Figma dialect), or Anuj moves to a paid plan (then the Starter layout can stay as an option, not the path he uses).

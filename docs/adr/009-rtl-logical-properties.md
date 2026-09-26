# ADR-009: RTL via CSS logical properties from day one

- **Status:** Proposed — Claude recommended, pending Anuj. Applied in Phase 1's preview screen.
- **Date:** 2026-09-26
- **Principles:** 2, 4

## Context

- Qamar is Arabic, right-to-left. Retrofitting RTL (mirroring `left`/`right`, override stylesheets) is where multi-locale products usually break.
- A tenant differs by tokens + copy only — RTL can't need component forks.

## Decision

- Logical properties only: `margin-inline-start`, `padding-block`, `inset-inline-end`, `border-start-start-radius`, `text-align: start`.
- `dir` and `lang` set on the root from `content.json`. Direction is not a token.
- Directional icons (arrows, chevrons) flip under `[dir="rtl"]`; other icons don't.
- Numbers and dates use `Intl` with the tenant locale.
- Heading tracking is `0` for Arabic-capable type pairs: letter-spacing breaks joined script.
- The drift auditor flags physical properties (Phase 5).

## Alternatives considered

- **Physical properties + an RTL override sheet (rtlcss)** — twice the CSS; overrides drift.
- **Direction as a token mode** — doubles Figma modes; direction is layout, not style.

## Consequences

- **Good:** every component is RTL-ready without extra work; Qamar proves it with real Arabic copy.
- **Bad:** some CSS has no logical form (transforms, `background-position`, shadow x-offsets) — handled case by case. Reviewers must catch physical properties until the auditor lands.
- **Revisit when:** a tenant needs vertical writing modes. Not planned.

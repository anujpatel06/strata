# ADR-002: Headless primitives — React Aria Components

- **Status:** Accepted — decided by Anuj (2026-09-26)
- **Date:** 2026-09-26
- **Principles:** 3, 4

## Context

- Non-goal (BRIEF §2): don't rebuild accessibility primitives — focus traps, roving tabindex, typeahead are solved problems.
- Phase 2 needs Dialog, Tabs, Select, Checkbox, RadioGroup, Switch, Tooltip and a **DataTable with sort and row selection**.
- Qamar is Arabic (RTL). Keyboard behaviour must mirror too (arrow keys in Tabs, Table).

## Decision

- Use **React Aria Components** (Adobe) as the headless layer.
- Strata owns all styling (ADR-003); states are styled through React Aria's data attributes (`[data-focus-visible]`, `[data-pressed]`, `[data-selected]`).
- Locale and direction come from React Aria's `I18nProvider`, driven by the tenant's `content.json`.

## Alternatives considered

- **Radix UI** — popular, lighter API. No Table primitive, so DataTable (the hardest accessible component here) would be hand-built. RTL works via `DirectionProvider`, but locale-aware behaviour is thinner.
- **Build our own** — no. Accessibility primitives are solved problems; our time goes to tokens, theming and governance.

## Consequences

- **Good:** strongest accessibility behaviour available; real accessible Table with sort, selection and keyboard grid navigation; built-in RTL and locale handling for Qamar.
- **Bad:** more verbose API and a data-attribute styling model to learn; likely a larger footprint than Radix — measure gzip per component in Phase 2 (BRIEF §12).
- **When:** components land in Phase 2.

# ADR-003: Styling — CSS Modules + CSS custom properties

- **Status:** Accepted — decided by Anuj (2026-09-26)
- **Date:** 2026-09-26
- **Principles:** 1, 2, 4

## Context

- Tokens are exported as CSS variables (`--syntara-*`, contract in `packages/theme-engine/src/types.ts`).
- Brand, scheme and density switch at runtime in the generator and reference app.
- Consumers may use any stack. Tokens must stay the only styling API (Principle 1).

## Decision

- One CSS Module per component. Values come only from `var(--syntara-*)`.
- Logical properties only (ADR-009). States via React Aria data attributes (ADR-002).
- Brand / scheme / density switch = new variables on a root element. Components don't re-render or know the tenant.
- The library build emits plain CSS so consumers don't need CSS Modules support (Phase 2 task).

## Alternatives considered

- **vanilla-extract** — type-safe and zero runtime. Another build tool and bundler plugin to explain to every consumer.
- **Tailwind v4** — fast to write. Utility classes leak into consumer code and blur "tokens are the API"; the drift auditor would have to police class names as well as values.
- **Plain global CSS** — no scoping; class collisions in consumer apps.

## Consequences

- **Good:** zero runtime cost; tokens map 1:1 to CSS variables; any consumer can read them; raw values are easy to lint.
- **Bad:** CSS has no type-checking — a mistyped `var()` fails silently. Mitigation: drift auditor + a test that every `var(--syntara-*)` used exists (Phase 5).
- **Revisit when:** a consumer needs styles outside the DOM (e.g. React Native).

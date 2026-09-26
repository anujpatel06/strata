# ADR-005: Token tiers and naming

- **Status:** Proposed — Claude recommended, pending Anuj
- **Date:** 2026-09-26
- **Principles:** 1, 2, 5

## Context

- Three tenants, one component set. Components must never know which brand they render (Principles 1, 2).
- Names must survive a rebrand, a dark scheme, a density change and a Figma import.

## Decision

- **Primitive** — colour ramps (12 steps), 4pt space scale, radius, type scale, motion, elevation. Exported, but not for components.
- **Semantic** — role-based: `surface`, `text`, `border`, `action`, `accent`, `focus`, `feedback`. The fixed list is `ROLES` in `packages/theme-engine/src/types.ts`.
- **Component** — only when a semantic token can't express it: `button.*`, `input.*`, `table.row.height.{comfortable,compact}`.
- **Rule:** components never reference primitives.
- **Names:** `color.<category>.<role>.<state>`, e.g. `color.action.primary.hover`. CSS prefix `--strata-`, dots → dashes, camelCase → kebab: `--strata-color-feedback-success-on-solid`.
- **Modes:** brand × scheme × density. Direction is handled by logical CSS, not tokens (ADR-009).

## Alternatives considered

- **Two tiers (primitive → component)** — the contrast solver would have to check every component pair instead of one list of roles; dark mode duplicated per component.
- **Full component tier for every component** — hundreds of alias tokens; slow Figma import, hard to review.
- **Appearance names** (`blue.600`, `brand.dark`) — wrong the moment a tenant's brand is orange, or the scheme is dark.

## Consequences

- **Good:** one short role list is all the solver, the auditor and Figma need; a new tenant changes values, never names.
- **Bad:** role names need judgement (is a table header `surface.sunken` or its own token?); primitives are still exported for Figma, so misuse is possible — the drift auditor flags it (Phase 5).
- **Revisit when:** a component needs a role that doesn't fit; add a component token, not a new semantic category.

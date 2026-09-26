# ADR-007: One `meta.json` per component

- **Status:** Proposed (Phase 2) — Claude recommended, pending Anuj
- **Date:** 2026-09-26
- **Principles:** 5, 6

## Context

- Five consumers need the same facts about a component: docs pages, MCP `get_component`, Figma descriptions, Storybook, the Figma ↔ code parity table.
- Copying facts by hand into each → drift within weeks. Agents then read different rules than humans.

## Decision

- One `packages/meta/<component>.meta.json` per component: name, maturity (alpha / beta / stable), one-line purpose, props schema, variants, states, do / don't, a11y notes, minimal example, `since` / `deprecated`.
- Generated from it: docs props tables, MCP responses, Figma description text, parity table.
- Validated against a JSON Schema in CI. A test fails if a React prop is missing from meta, or meta lists a prop the component doesn't have.

## Alternatives considered

- **Derive from TypeScript types** (react-docgen) — gives props, not purpose, do / don't or a11y notes. Still used to verify meta against code.
- **MDX docs as the source** — prose-first; hard to return compact JSON to agents.
- **Storybook args as the source** — ties agents and Figma to Storybook's format.

## Consequences

- **Good:** one edit updates docs, MCP and Figma; humans and agents read the same rules.
- **Bad:** authoring cost per component; JSON is less pleasant to write than MDX; meta can still drift from code — the props test catches that.
- **Revisit when:** meta files outgrow JSON (then YAML or TS with the same schema).

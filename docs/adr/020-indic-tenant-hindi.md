# ADR-020: Add a Hindi tenant with per-script type tokens

- **Status:** Accepted — decided by **Claude recommended, Anuj accepted**. Tenant name, industry and brand inputs are **pending Anuj**.
- **Date:** 2026-09-27
- **Principles:** 1, 2

## Context

- Strata's Indian tenants (Vela, Care) are en-IN. Nothing in the repo shows an Indic script.
- Research (`docs/research/2026-09-27-differentiation.md`, §5): a Figma case study says Flipkart supports 11 Indian languages. No company-published guidance on Indic line height or truncation was found.
- Devanagari has a headline and stacked marks above and below it. Line heights and truncation tuned for Latin can clip it.
- Qamar already proved that a script and direction change needs no component changes (ADR-009).

## Decision

- Add one tenant in **Hindi (hi-IN, Devanagari)**.
- Add a type pair with Devanagari support to the engine's curated list.
- Add **per-script type tokens** (line height, minimum size, truncation behaviour), chosen by the tenant's locale. Components keep reading the same semantic tokens.
- The rule from BRIEF §1 holds: the tenant differs by tokens and copy only. If a component needs a change to render Hindi correctly, that's a component bug to fix for every tenant.
- Copy is written in Hindi by a person who reads it, not machine-translated and shipped unchecked.
- Values come from measurement: a script renders the test strings and checks for clipping, with the command beside the result.

## Alternatives considered

- **Tamil first:** a stronger stress test for width and line height, but narrower reach than Hindi. A good second script.
- **Hindi copy on an existing tenant:** cheaper, but it hides the type-token work, which is the point.
- **No Indic tenant:** leaves the India pitch resting on en-IN only.

## Consequences

- **Good:** shows the system handles a third script. Fills a gap no target company has published on.
- **Bad:** one more tenant in every screenshot and axe sweep. Hindi copy needs a reviewer; Claude can draft it but can't vouch for tone.
- **Revisit when:** a second Indic script is added, or the per-script tokens turn out to need component-level overrides.

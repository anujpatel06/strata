# ADR-017: Soft-outline fields that still meet WCAG 1.4.11

- **Status:** Accepted — decided by **Anuj** (Claude recommended "soft outline, still AA"; Anuj accepted)
- **Date:** 2026-09-27
- **Principles:** 1, 3

## Context

- Anuj: fields, toggles and buttons "feel AI-generated". Measured: a 40px field with a 1px `border.strong` (#858689) on white, on a near-white page. Buttons next to fields had a different height and radius.
- The soft fields in premium products (Apple, Stripe, Linear) use boundaries of about 1.5:1. That fails WCAG 1.4.11 (non-text contrast 3:1 for the visual information needed to identify a component). Strata claims WCAG 2.2 AA.

## Decision

- **Keep the ≥3:1 boundary, change how it feels:**
  - a subtle fill, so the line sits between two close tones instead of hard white;
  - a radius tuned to control height, and a faint inset top shadow;
  - a stronger boundary on hover, and the 2px ring plus a halo on focus;
  - quieter adornments.
- The boundary's 3:1 against the outside surface is proven per tenant and in the fuzz inputs (see the test added with this change).
- **Fields and buttons in the same row share height and radius. The segmented control's selection is carried by elevation and weight, not colour alone. There's no coloured glow on light-mode feature cards.**

## Alternatives considered

- **Soft fields like Apple/Stripe:** the most premium look, but form boundaries would fail 1.4.11 and Strata would lose its AA claim.
- **Field style as a brand input** (strict or soft per brand): flexible, but it splits the accessibility guarantee per brand.

## Consequences

- **Good:** calmer forms with the AA claim intact.
- **Bad:** fields stay a little more visible than in the Dribbble references. That's the price of the guarantee, and it's explained in the docs.

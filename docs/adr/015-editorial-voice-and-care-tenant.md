# ADR-015: An editorial voice, proven by a Care tenant built from Anuj's KYB work

- **Status:** Accepted. Decided by **Anuj** ("match the level of my KYB prototype so it doesn't feel like generic AI components"); implementation Claude recommended, Anuj accepted.
- **Date:** 2026-09-27
- **Principles:** 1, 2, 7

## Context

- Anuj's KYB prototype (`~/projects/portfolio-site/kyb-prototype.html`) has a clear point of view:
  - Fraunces serif headlines and numbers, with italic emphasis;
  - warm paper neutrals and named muted colours;
  - small-caps eyebrow labels;
  - money set as typography (a raised ₹);
  - domain components: tinted member avatars, member chips, placeholder chips, usage meters, tags.
- Strata v0.3 was polished but generic: Inter, brand blue, and general-purpose components only.

## Decision

- **Engine:** an `editorial` type pair (Fraunces / DM Sans / DM Mono), with italics loaded through `italicFamilies`, and a `paper` neutral (h 85, c 0.022). Both are in the fuzz: all brands pass (`pnpm test:themes`).
- **New components** (tokens only, so every tenant gets them): `Eyebrow`, `Amount` (locale-correct grouping, raised currency), `Meter`, `Tag`, `PersonChip`/`PersonChipGroup`, and an `Avatar` `tint="auto"` drawn only from engine-checked pairs. An `<em>` in headings becomes the heading font's italic.
- **Proof:** a 4th tenant, **Care** (sage `#2D5F4F`, coral `#C2664A`, paper, round, editorial, comfortable; 86/86 checks), and a `benefits-home` block that rebuilds the KYB home screen from Strata components only, shown next to the original.
- **Not copied:** client names, photos and copy from the shipped product. Care is a neutral stand-in brand.

## Alternatives considered

- **Restyle the house brand as editorial:** it would change Strata's own identity rather than prove that multi-brand works.
- **Capabilities without a tenant:** there would be no side-by-side proof.

## Consequences

- **Good:** Strata can now carry a real product voice, and the portfolio story becomes "my shipped design, rebuilt on my own system".
- **Bad:** more components to maintain. Fraunces with italics adds font weight to editorial tenants.

## Revision (2026-09-27, later): Care is based on the KYB **web** prototype — Anuj

- Anuj: "whenever I talk about KYB case study, always use the web prototype" (`~/projects/portfolio-site/kyb-web-prototype.html`). The first Care tenant and its `benefits-home` block came from the mobile prototype by mistake.
- Care now uses the web prototype's own values: primary `#0E63FF`, accent `#F27F00` (reimburse orange), neutral, soft, the `friendly` pair (Plus Jakarta Sans is the closest free match to the prototype's licensed Euclid Circular A), comfortable. 98/98 checks.
- `benefits-home` is replaced by `benefits-overview`: the filter rail, the benefit rows in every state, the expanded row and the wallet.
- The editorial capabilities stay: the `editorial` pair, `paper` neutral, Eyebrow, Amount, Meter, Tag, PersonChip. Any tenant can use them; Care simply no longer does.


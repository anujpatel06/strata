# @syntara/theme-engine

Six brand inputs in, a complete light and dark theme out — every colour pair checked against WCAG 2.2 AA. Part of [Syntara](https://github.com/anujpatel06/strata).

**Zero runtime dependencies.**

## Install

```sh
npm install @syntara/theme-engine
```

## What it does

Given six inputs — primary, accent, neutral temperature, shape, type pair and density — the engine builds OKLCH ramps, derives the semantic roles that components reference, and runs a contrast solver over every foreground/background pair the system can produce.

The solver keeps the brand's primary hex exact wherever it can, and where a pair would fail it adjusts the lighter side and records why, in plain English. Ratios are never rounded up: 4.49 fails.

A theme that fails AA cannot be generated. That is the point of the package.

## Exporters

The same theme can be written out as:

- CSS custom properties (`--syntara-*`)
- DTCG 2025.10 design tokens JSON
- Figma variables JSON (Brand / Scheme / Density collections)
- shadcn-compatible variables

## Verifying it

The engine is fuzzed over randomly generated brands in both schemes, checking every contrast pair and chart palette. Run `pnpm test:themes` in the repository; results land in `packages/theme-engine/reports`, and the reproduced figures are listed in the repository's [numbers table](https://github.com/anujpatel06/strata#numbers).

MIT © Anuj Patel

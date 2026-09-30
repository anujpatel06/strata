# @syntara/theme-engine

Turns six brand inputs into a light and dark theme that passes WCAG 2.2 AA. **Zero runtime dependencies.**

```ts
import { generateTheme, toCSS } from '@syntara/theme-engine';

const theme = generateTheme({
  name: 'Vela',
  primary: '#3D45D6',
  neutral: 'neutral',
  shape: 'soft',
  typePair: 'modern',
  density: 'comfortable',
});

theme.summary; // { checks: 118, passed: 118, failed: 0, adjustments: 3, ... }
toCSS(theme, { selector: '[data-syntara-theme="vela"]' });
```

## What it does

A brand colour is a seed, not an answer. The engine builds OKLCH ramps from it, resolves **48 semantic roles** per
scheme, and then runs a solver: where a role's preferred ramp step fails its contrast check, the solver moves it
until it passes. Every theme is checked — **118 contrast pairs**, light and dark — and `theme.checks` carries each
one with its ratio. Ratios are never rounded up: 4.49 fails.

`theme.adjustments` records what the solver moved and why, so a theme can explain itself rather than assert.

## Exporters

| Function | Output |
|---|---|
| `toCSS` / `toCssVariables` | CSS custom properties, `--syntara-*` |
| `toDTCG` | W3C Design Tokens (DTCG 2025.10) |
| `toFigmaFiles` | Figma variables, one file per collection mode |
| `toShadcnCSS` / `toShadcnCssVars` | shadcn/ui theme variables |
| `toCompose` / `toSwiftUI` | Kotlin and Swift token sources |

## Verifying the claim

The fuzz test generates 1,000 random brands and checks every pair in both schemes:

```sh
pnpm --filter @syntara/theme-engine fuzz   # or: pnpm test:themes
```

It writes `reports/fuzz-report.md` and exits non-zero if any brand fails.

The role contract is `src/types.ts`. Components read only `var(--syntara-*)`; see `@syntara/tokens` for built files.

# @strata/tokens

Built token files for every Strata tenant, generated from `tenants/<id>/brand.json` by `@strata/theme-engine`. Never edit `dist/` by hand — run `pnpm tokens` (= `pnpm --filter @strata/tokens build`; exits 1 if any contrast check fails).

| File | What it is |
|---|---|
| `dist/strata.css` | Every tenant, scoped to `[data-strata-theme="<id>"]` |
| `dist/<id>/tokens.css` | One tenant on `:root` |
| `dist/<id>/<id>.tokens.json` | W3C DTCG 2025.10 (primitives, semantic light/dark, foundations, density) |
| `dist/<id>/figma/*.tokens.json` | Figma variables, one file per collection mode: `Brand.<Name>` (ramps + brand-resolved roles), `Semantic.Light/Dark` (identical for every tenant — import once), `Density.*`, `Shape.<Name>`, `Type.<Name>` |
| `dist/<id>/figma-starter/*.tokens.json` | The same variables for Figma Starter (free), which allows one mode per collection: `<Name> · Light`, `<Name> · Dark` (roles as hex + ramps), `<Name> · Size` (radius, type, default density), `<Name> · Size <other density>`; each has one mode, `Value` |
| `dist/<id>/contrast-report.json` | Every contrast check, plus a plain-English reason for each solver adjustment |
| `dist/manifest.json` | Tenant ids, names and summaries |

Mode attributes go on the **same element** as `data-strata-theme` (they are appended to its selector, not nested):

```html
<html data-strata-theme="vela" data-strata-scheme="auto" data-strata-density="compact">
```

`data-strata-scheme`: omit/`light`, `dark`, or `auto` (follows `prefers-color-scheme`). `data-strata-density`: omit for the tenant default, or `comfortable`/`compact`. Components read only `var(--strata-*)`; the contract is in `packages/theme-engine/src/types.ts`.

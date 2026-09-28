# @syntara/tokens

Built token files for every Syntara tenant, generated from `tenants/<id>/brand.json` by `@syntara/theme-engine`. Never edit `dist/` by hand — run `pnpm tokens` (= `pnpm --filter @syntara/tokens build`; exits 1 if any contrast check fails).

| File | What it is |
|---|---|
| `dist/syntara.css` | Every tenant, scoped to `[data-syntara-theme="<id>"]` |
| `dist/<id>/tokens.css` | One tenant on `:root` |
| `dist/<id>/<id>.tokens.json` | W3C DTCG 2025.10 (primitives, semantic light/dark, foundations, density) |
| `dist/<id>/figma/*.tokens.json` | Figma variables, one file per collection mode: `Brand.<Name>` (ramps + brand-resolved roles), `Semantic.Light/Dark` (identical for every tenant — import once), `Density.*`, `Shape.<Name>`, `Type.<Name>` |
| `dist/<id>/figma-starter/*.tokens.json` | The same variables for Figma Starter (free), which allows one mode per collection: `<Name> · Light`, `<Name> · Dark` (roles as hex + ramps), `<Name> · Size` (radius, type, default density), `<Name> · Size <other density>`; each has one mode, `Value` |
| `dist/<id>/contrast-report.json` | Every contrast check, plus a plain-English reason for each solver adjustment |
| `dist/manifest.json` | Tenant ids, names and summaries |

Mode attributes go on the **same element** as `data-syntara-theme` (they are appended to its selector, not nested):

```html
<html data-syntara-theme="vela" data-syntara-scheme="auto" data-syntara-density="compact">
```

`data-syntara-scheme`: omit/`light`, `dark`, or `auto` (follows `prefers-color-scheme`). `data-syntara-density`: omit for the tenant default, or `comfortable`/`compact`. Components read only `var(--syntara-*)`; the contract is in `packages/theme-engine/src/types.ts`.

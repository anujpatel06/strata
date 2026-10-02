# @syntara/react

**54 components** built on [React Aria Components](https://react-spectrum.adobe.com/react-aria/), themed entirely by
`var(--syntara-*)` tokens. One library renders every brand.

```tsx
import { Button, ThemeScope } from '@syntara/react';
import '@syntara/tokens/dist/syntara.css';
import '@syntara/react/styles.css';

<ThemeScope theme="vela" scheme="dark">
  <Button variant="primary">Save</Button>
</ThemeScope>
```

Peer dependencies: React 19 and React DOM 19. `@syntara/tokens` supplies the token CSS the components read.

## The rules the components follow

- **Tokens only.** No raw colours, sizes, radii or weights in component CSS, and no tenant ids in component code. A
  brand is data, not code — so a component cannot know which brand it is rendering.
- **React Aria for behaviour.** Focus, overlays, collections and keyboard handling are never hand-rolled.
- **Logical properties only**, so right-to-left works. Pass `locale` to `ThemeScope` for RTL — React Aria reads
  direction from the locale, not from `dir`.
- **WCAG 2.2 AA.** Visible focus, targets ≥ 24px, and status never shown by colour alone.
- **Overlays portal to `<body>`** and copy `data-syntara-*`, `dir` and `lang` from the nearest scope when they open
  (ADR-012), so a menu opened inside a themed scope stays in that theme.

## Importing

```ts
import { Button } from '@syntara/react';        // everything
import { Button } from '@syntara/react/ui/button'; // one component
import '@syntara/tokens/dist/syntara.css';      // the tokens — required once
import '@syntara/react/styles.css';             // the component styles — required once
```

`styles.css` reads `var(--syntara-*)` 3,472 times — 118 distinct tokens — and defines none of them, so the token file is not optional (`grep -o 'var(--syntara-' dist/styles.css | wc -l`):
without it the components render unthemed. `dist/syntara.css` holds every tenant, each scoped to
`[data-syntara-theme="<id>"]`; import `@syntara/tokens/dist/<id>/tokens.css` instead to ship one brand on `:root`.

## Theming

Components read the 48 semantic roles that `@syntara/theme-engine` resolves; `@syntara/tokens` ships built files for
each tenant. Mode attributes go on the **same element** as `data-syntara-theme`:

```html
<html data-syntara-theme="vela" data-syntara-scheme="auto" data-syntara-density="compact">
```

## Component metadata

Every component has a `meta.json` — props, maturity, examples, and any deprecation record with its removal version,
replacement and codemod. `pnpm check:meta` checks each one against its files. `@syntara/mcp` serves the same
metadata to agents.

Deprecations follow GOVERNANCE.md §5: a deprecated API keeps working through every 0.x release, is removed at
1.0.0, and ships with a codemod in `@syntara/codemods`.

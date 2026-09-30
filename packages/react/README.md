# @syntara/react

53 React Aria components themed entirely by CSS custom properties. Part of [Syntara](https://github.com/anujpatel06/strata), a multi-brand design system.

Every component works in light and dark, both densities, and right-to-left. Behaviour — focus, overlays, collections, keyboard — comes from [React Aria](https://react-spectrum.adobe.com/react-aria/); Syntara supplies the structure and the tokens.

## Install

```sh
npm install @syntara/react @syntara/tokens
```

React 19 and React DOM are peer dependencies. React Aria and the icon set come with the package.

## Use

Import the token CSS and the component styles once, at your app root:

```tsx
import '@syntara/tokens/dist/syntara.css';
import '@syntara/react/styles.css';
```

Then wrap your app — or any part of it — in a `ThemeScope`:

```tsx
import { Button, ThemeScope } from '@syntara/react';

export default function App() {
  return (
    <ThemeScope theme="vela" scheme="dark">
      <Button>Continue</Button>
    </ThemeScope>
  );
}
```

Each component also has its own entry point: `import { Button } from '@syntara/react/ui/button'`.

For right-to-left locales, pass `locale` rather than `dir` — React Aria reads direction from the locale:

```tsx
<ThemeScope theme="qamar" locale="ar-AE">…</ThemeScope>
```

## Theming

Components reference semantic tokens (`--syntara-*`) and never raw colours, sizes or radii. A brand is data: one `brand.json` of six inputs becomes a full light and dark theme via [`@syntara/theme-engine`](https://github.com/anujpatel06/strata/tree/main/packages/theme-engine#readme). Swapping brands changes no component code.

Token CSS keys off three attributes, which `ThemeScope` writes for you:

```html
<html data-syntara-theme="vela" data-syntara-scheme="auto" data-syntara-density="compact">
```

## Accessibility

Syntara targets WCAG 2.2 AA: visible focus, targets ≥ 24px, and status never carried by colour alone. Contrast ratios are never rounded up. Generated themes are contrast-checked, and the docs routes are swept with axe in both schemes — see the [numbers table](https://github.com/anujpatel06/strata#numbers), which lists the command that reproduces each figure.

## Maturity

Pre-1.0. Components carry a maturity level in their `meta.json` (`pnpm check:meta` prints the split). Breaking changes follow [GOVERNANCE.md](https://github.com/anujpatel06/strata/blob/main/GOVERNANCE.md) §5 and ship with a codemod in [`@syntara/codemods`](https://github.com/anujpatel06/strata/tree/main/packages/codemods#readme).

## Copying instead of installing

Every component is a `.tsx` and a `.module.css` that import siblings by relative path, so you can copy the files into your own project instead of taking the dependency. Each component page in the docs has the full source.

MIT © Anuj Patel

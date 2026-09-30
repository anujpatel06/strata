# @syntara/icons

Syntara's own icon set (ADR-014). **480 React components: 243 outline drawings and 237 duotone twins.**

```tsx
import { IconArrowRight, IconShieldCheckDuotone } from '@syntara/icons';

<IconArrowRight aria-hidden />
<IconShieldCheckDuotone aria-hidden />
```

Peer dependency: React 19.

## The drawings

One stroke weight, one corner treatment, one grid — the style spec lives in `src/create-icon.tsx`, beside the code
that enforces it. Icons are `currentColor` and size to the text around them, so they inherit from the type they sit
in rather than carrying their own colour or size.

## Duotone

A twin is the same drawing with a tint layer painted behind it. **A twin never redraws its outline and never copies
a path string** — `createIcon` keeps the drawing on the component as `Icon.node` and each twin composes it, so the
two layers cannot drift apart. A test asserts the outline's nodes are the tail of every twin's, identical and in
order.

The tint defaults to `color-mix(in oklab, currentColor 16%, transparent)`, so duotone follows the text colour and
works on any surface with no setup. Set `--syntara-icon-tint` on a theme, a tenant or one component to make it a
real colour.

**54 of the 237 carry no tint.** A check, an arrow, a chevron, `plus`, `menu-2` and the other bare strokes enclose
no area, so there is nothing to fill; their twins exist and render exactly like the outline, which keeps the set 1:1
so a product can move its whole icon layer in one import change.

## Scripts

```sh
pnpm --filter @syntara/icons sheet        # render the review sheet
pnpm --filter @syntara/icons check:tints  # find tint parts that overlap
```

RTL: icons flip through prefix selectors on the components that use them (`[data-syntara-icon^='arrow']`), and a
twin's name is its outline's plus `Duotone`, so every twin flips exactly like the icon it copies.

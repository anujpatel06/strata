# @syntara/icons

Syntara's own icon set: curvy, minimal outline icons on a 24px grid, as React components. Part of [Syntara](https://github.com/anujpatel06/strata).

237 outline icons, each with a duotone twin, plus 6 filled variants. Every export is `Icon`-prefixed
(`IconCheck`, `IconArrowRight`), so autocomplete on `Icon` lists the set. Drawn for this system rather than borrowed — the style spec lives in [`src/create-icon.tsx`](https://github.com/anujpatel06/strata/blob/main/packages/icons/src/create-icon.tsx) (ADR-014).

## Install

```sh
npm install @syntara/icons
```

React 19 is a peer dependency. `@syntara/react` already bundles what it needs; install this directly when you copy component source by hand, or want the icons on their own.

## Use

```tsx
import { IconArrowRight, IconCheck } from '@syntara/icons';

<IconCheck />
<IconArrowRight size={20} />
```

Colour follows `currentColor`, so an icon takes the text colour of whatever it sits in. Stroke width follows the `--syntara-icon-stroke` token, so it moves with the theme rather than being fixed per icon.

Icons carry no direction logic of their own. Where a direction-bearing icon needs to flip under right-to-left — a breadcrumb chevron, a calendar's next/prev — the component that uses it flips it in CSS with `:dir(rtl)`. Do the same in your own components rather than shipping a mirrored icon.

## Duotone

Every outline icon has a duotone twin, suffixed `Duotone`:

```tsx
import { IconArrowRightDuotone } from '@syntara/icons';
```

The second tone is a tinted fill derived from the theme, not a hard-coded grey.

MIT © Anuj Patel

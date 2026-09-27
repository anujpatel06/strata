# Eval app

A small product app that uses the Strata design system.

- `@strata/react` (components), `@strata/icons` (icons) and `@strata/tokens` (CSS variables) are installed.
- `src/main.tsx` is the app shell. It wraps the screen in Strata's `ThemeScope`, which sets the brand, the colour scheme, the locale and the density. Don't edit it.
- Build the screen in `src/screens/Screen.tsx`, as the default export. Put its styles in `src/screens/Screen.module.css`. You may add more files under `src/screens/`.
- The same screen is shown in several brands, in light and dark, and in a right-to-left locale.
- Use mock data written in the file. There is no backend.

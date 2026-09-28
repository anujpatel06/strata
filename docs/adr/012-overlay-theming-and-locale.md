# ADR-012: Overlays copy their scope; ThemeScope owns the locale

- **Status:** Accepted — Claude recommended (C3's approach); **Anuj delegated the call** ("do whatever is correct", 2026-09-27). Accepted because it is built and tested in every overlay
- **Date:** 2026-09-26
- **Principles:** 1, 4

## Context

- React Aria portals dialogs, popovers, menus, tooltips and toasts to `<body>`, outside any `ThemeScope`. Scoped tokens (a Harbor-dark preview beside a Vela-light one) didn't reach them.
- React Aria reads text direction and date formats from its locale (`I18nProvider`), not from the DOM `dir` attribute, so RTL regions behaved LTR for arrow keys, placement and calendars.

## Decision

- **Overlays copy the scope.** When an overlay opens, it copies `data-syntara-theme`, `data-syntara-scheme`, `data-syntara-density`, `dir` and `lang` from the element that opened it onto its own root. It looks up **each attribute on its own**, because a single-tenant app themes `:root` and scopes only the scheme.
- **ThemeScope takes `locale`.** It wraps children in `I18nProvider` and sets `lang`/`dir` unless you pass them.

## Alternatives considered

- **Portal into the scope element:** a Select inside a modal breaks, because React Aria marks the page region inert. Preview frames with `overflow`/`transform` also clip overlays.
- **`UNSAFE_PortalProvider`:** lives in `react-aria`, not `react-aria-components`. It would add a dependency, and it has the same inert/clipping issues.

## Consequences

- **Good:** overlays match the region they came from, including nested overlays, and there's no new dependency.
- **Bad:** the same small helper is copied into each overlay file, because registry installs need self-contained files. Attributes are read at open time, so a scope that changes theme while an overlay is open won't update it (toasts do watch for this).

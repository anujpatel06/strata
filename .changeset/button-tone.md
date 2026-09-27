---
"@strata/react": minor
"@strata/theme-engine": minor
"@strata/codemods": minor
---

Button gets `tone`, and `variant="danger"` is deprecated (RFC-001, ADR-021).

- react: `<Button tone="danger">` on the `primary`, `outline` and `ghost` variants. `variant="danger"` keeps working and renders the same until 1.0.0; it warns once in development. Migrate with `npx @strata/codemods button-variant-danger-to-tone <path>`. CSS that targets `[data-variant='danger']` keeps working until 1.0.0; change it to `[data-tone='danger']` before then.
- theme-engine: the four `feedback.*.fg` roles are now solved against `surface.canvas` and `surface.raised` as well (118 contrast checks per brand, was 102). No token value changed: the new pairs already passed in every tenant.
- codemods: new package, with `button-variant-danger-to-tone`.

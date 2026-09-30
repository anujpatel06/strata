# @syntara/codemods

## 0.1.0

### Minor Changes

- 9ee91af: Button gets `tone`, and `variant="danger"` is deprecated (RFC-001, ADR-021).

  - react: `<Button tone="danger">` on the `primary`, `outline` and `ghost` variants. `variant="danger"` keeps working and renders the same until 1.0.0; it warns once in development. Migrate with `npx @syntara/codemods button-variant-danger-to-tone <path>`. CSS that targets `[data-variant='danger']` keeps working until 1.0.0; change it to `[data-tone='danger']` before then.
  - theme-engine: the four `feedback.*.fg` roles are now solved against `surface.canvas` and `surface.raised` as well (118 contrast checks per brand, was 102). No token value changed: the new pairs already passed in every tenant.
  - codemods: new package, with `button-variant-danger-to-tone`.

### Patch Changes

- Packaging for the first release.

  - Every package carries its own `LICENSE` (npm does not hoist a monorepo root one), `repository` with its
    `directory`, `homepage`, `bugs` and `keywords`, so npm can show a source link and the packages are findable.
  - `@syntara/react`, `@syntara/icons` and `@syntara/theme-engine` have READMEs, which are what npm renders as the
    package page.
  - `@syntara/icons` and `@syntara/theme-engine` are built packages rather than TypeScript source: ESM with
    `preserveModules` plus declarations, mapped through `publishConfig.exports`. They previously exported
    `./src/index.ts`, which Node cannot load and Next.js will not transpile without `transpilePackages`. Neither
    declared `files`, so npm had also been packing their test suites — 2 files and 14 respectively, including the
    native token snapshots; both now ship `dist` alone.
  - `@syntara/react` and `@syntara/tokens` build on `prepack`, so a tarball can no longer ship a stale `dist`.
  - `@syntara/sdui`'s peer ranges on `@syntara/react` and `@syntara/icons` are real ranges instead of `workspace:*`,
    which publishes as an exact pin and would make every later release a peer conflict.

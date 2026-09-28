# Changesets

Versioning and changelogs for Syntara's packages ([Changesets](https://github.com/changesets/changesets)).

- **Add one** for every change to a published package: `pnpm changeset` → pick packages, pick the bump, write one line a consumer understands.
- **Bumps:** patch = fix · minor = new feature or a deprecation · major = removal or breaking change (ships with a codemod, Phase 4).
- **Ignored:** `@syntara/generator` (an app, never published).
- **Release:** `pnpm changeset version` writes versions + CHANGELOG.md; `pnpm changeset publish` publishes (Phase 6).

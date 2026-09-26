# Contributing

Phase 0 version. Read `BRIEF.md` first.

## Setup

Node 22 (`.nvmrc`) and pnpm 10 (`corepack enable`), then `pnpm i && pnpm dev`.

## Before you push

```sh
pnpm typecheck && pnpm test && pnpm test:themes && pnpm tokens && pnpm build
```

After UI changes: `pnpm screenshots` and attach the tenant × scheme images to the PR.

## Commits

[Conventional Commits](https://www.conventionalcommits.org): `feat(theme-engine): …`, `fix(generator): …`, `docs(adr): …`. One PR per phase or feature; small commits.

## Changesets

Any change to a published package (`packages/*`) needs a changeset: `pnpm changeset`. Pick the bump (patch / minor / major) and write one line a consumer understands. Apps are ignored.

## Decisions (ADRs)

A change with a design trade-off needs an ADR:

1. Copy `docs/adr/000-template.md` to `docs/adr/NNN-short-title.md`.
2. Fill Context / Decision / Alternatives / Consequences. One page max.
3. Status names who decided: Anuj, or Claude recommended + Anuj accepted / pending.
4. Add a line to `docs/log.md` under **Decided**.

## Governance

Governance (RFC flow, deprecation policy) lands in Phase 4 — see BRIEF.md §7.

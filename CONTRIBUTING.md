# Contributing

Read `BRIEF.md` first, then `GOVERNANCE.md`. Component rules are in `packages/react/CONVENTIONS.md`.

## Setup

Node 22 (`.nvmrc`) and pnpm 10 (`corepack enable`), then `pnpm i && pnpm dev`.

## Before you push

```sh
pnpm typecheck && pnpm test && pnpm test:themes && pnpm check:meta && pnpm tokens && pnpm build
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

## RFCs

A new component, a breaking change, a deprecation or a token-tier change needs an RFC before it's built:

1. Copy `docs/rfcs/000-template.md` to `docs/rfcs/NNN-short-title.md`.
2. Open a pull request with the RFC alone and mark it "In review".
3. Build after it's accepted. `docs/rfcs/001-button-tone.md` is a worked example.

## Deprecating something

Follow `GOVERNANCE.md` §5. In short: the old API keeps working and renders the same, `meta.json` gets a deprecation record, the component warns once in development, and a codemod ships in `packages/codemods` with fixture tests. `pnpm check:meta` fails if the record points at a codemod or RFC that doesn't exist.

## Governance

Who decides what, the four outcomes for a request, versioning and agent trust levels are in `GOVERNANCE.md`.

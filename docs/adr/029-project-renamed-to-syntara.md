# ADR-029: The project is called Syntara; the package scope and token prefix change with it

- **Status:** Accepted — **Anuj**.
- **Date:** 2026-09-28
- **Principles:** 1, 6

## Context

- The project was called Strata from its first commit. Anuj asked for it to be Syntara everywhere.
- The name is not only prose. It is the npm scope (`@strata/*`), the CSS custom property prefix (`--strata-*`), the
  DOM attributes the theme scope writes (`data-strata-*`), the environment variables the scripts read (`STRATA_*`),
  the MCP server's name and so its tool prefix, the `urn:strata:sdui:v1:*` schema ids, the resource URIs
  (`strata://agents`, `strata://governance`), the exported Kotlin and Swift symbols (`StrataTokens`, `StrataColors`
  and 20 more) and the CLI names (`strata-audit`, `strata-mcp`, `strata-codemods`).
- Nothing has been published to npm. There are no per-package changelogs and all 11 changesets are unreleased, so no
  released artifact carries the old scope.
- `evals/runs/` holds 803 files of recorded output from runs that actually happened, including the screens the agents
  wrote and the scores derived from them. They are the evidence behind every number in `evals/results.md`.

## Decision

- **The name changes everywhere it is the project's own**, in one mechanical, case-preserving pass: 11,063
  occurrences across 747 files, two of which are also renamed on disk
  (`vela.StrataTokens.kt`, `vela.StrataTokens.swift`). Counts from
  `git grep -I -o -i syntara -- . ':!evals/runs' | wc -l` and `git diff --name-only | wc -l`.
- **The token prefix changes with it.** `--strata-*` becomes `--syntara-*` (8,405 occurrences) and `data-strata-*`
  becomes `data-syntara-*` (319). A design system's tokens carry its name; leaving them would be a half rename that
  every consumer would see. This breaks every consumer stylesheet, which is the point of doing it before 1.0.
- **The wire contract changes with it.** Schema ids become `urn:syntara:sdui:v1:*`. Any stored screen document
  written against the old ids has to be re-issued. `@syntara/sdui` shipped the same day and has no users.
- **The GitHub repository keeps its name.** 20 links in the docs, ADRs and RFCs point at
  `github.com/anujpatel06/strata`. They are left exactly as they are, because renaming the repository breaks every
  clone, every link anyone already has, and the eval records that cite it. That rename is Anuj's to make, and when he
  makes it GitHub's redirect keeps these links working.
- **The eval records are not rewritten.** Everything under `evals/runs/` is left byte-identical, and so are the
  generated `evals/results.md`, `results.json` and `results.svg`, which record the literal tarball names and
  workspace paths of the runs (`packs/strata-react-0.1.0.tgz`). Rewriting them would say the runs installed a package
  they did not install. `evals/score.mjs` now accepts either scope so archived runs still score, and
  `evals/README.md` says what re-scoring them needs.

## Alternatives considered

- **Rename the prose only, keep `@strata/*` and `--strata-*`.** No consumer breakage, and the smaller diff. Rejected:
  a design system whose every token reads `--strata-` is still called Strata in the only place that matters to the
  people using it, and the second rename would cost the same as the first with users attached.
- **Keep `--strata-*` as aliases that forward to `--syntara-*`.** Every theme would emit both, roughly doubling the
  custom properties on every scope element, and the auditor would have to accept a name the docs tell people not to
  use. Worth revisiting only if there are consumers to migrate at 1.0, and then as a codemod, which is the policy
  GOVERNANCE.md already sets for deprecations.
- **Rewrite the eval records too, for a repository with one name in it.** Rejected outright: they are measurements,
  and the published numbers rest on them.

## Consequences

- Any consumer upgrading past this commit rewrites `@strata/*` imports, `--strata-*` custom properties and
  `data-strata-*` selectors. There is no codemod for it yet; the changeset marks it breaking.
- Anyone re-scoring `iter-1` or `iter-2` has to point `SOURCE_ROOT` at a pre-rename checkout, because the auditor no
  longer knows `--strata-*`.
- The repository directory and the GitHub remote still read `strata`. Docs links keep working either way.

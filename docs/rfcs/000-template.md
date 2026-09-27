# RFC-NNN: <the change in a few words>

- **Status:** <Draft | In review | Accepted | Rejected | Withdrawn> — decided by <Anuj | Claude recommended, Anuj accepted>
- **Date:** YYYY-MM-DD
- **Kind:** <New component | New variant | API change | Token change | Deprecation>
- **Trust level:** Hard gate (GOVERNANCE.md §6). Agents may draft an RFC; a person decides it.
- **Issue:** <link>

<!--
When you need an RFC (GOVERNANCE.md §3): a new component, a breaking change, a deprecation, or a token-tier change.
A fix, a new prop that fits a component's purpose, or a docs change doesn't need one.

Rules
- Two pages at most. Bullets over paragraphs.
- Show the screen that needs it. A change with no screen waits until there is one.
- Numbers only with the command that produces them.
- An accepted RFC isn't rewritten. A change of mind is a new RFC that supersedes it.
- File name: NNN-kebab-title.md. If the decision has a design trade-off, it also gets an ADR.
-->

## The need

Who needs this, on which screen, and what they do today instead.

## Proposal

The API, as code. States, tokens and accessibility behaviour.

## Extend, vary, add or override?

Which of the four outcomes this is (GOVERNANCE.md §4), and why it isn't a cheaper one.

## Alternatives

- **Option A:** why not.
- **Option B:** why not.

## Cost

- **Every tenant:** does it hold in each brand, light and dark, right to left, both densities?
- **Consumers:** what changes for code that uses the system today?
- **Maintenance:** new tokens, contrast pairs, tests, docs.

## Migration

Only for breaking changes and deprecations.

- Deprecated in: <release>. Removed in: <release>.
- Codemod: <name>. What it rewrites, and what it reports instead of rewriting.
- What a consumer sees before they migrate (warning text, editor hint).

## Checklist before release

- [ ] `meta.json` updated, with the deprecation record if there is one
- [ ] Tests, including a contrast proof for any new colour pair
- [ ] Examples and docs
- [ ] Codemod with fixture tests, run on this repo
- [ ] Changeset
- [ ] ADR, if there was a design trade-off

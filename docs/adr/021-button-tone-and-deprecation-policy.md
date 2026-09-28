# ADR-021: Button's status moves to `tone`; deprecated APIs are removed at 1.0 only

- **Status:** Accepted — decided by **Claude recommended, Anuj accepted**. Review times in GOVERNANCE.md §3: Claude proposed, **Anuj accepted** (2026-09-27).
- **Date:** 2026-09-27
- **Principles:** 1, 3, 7
- **RFC:** [RFC-001](../rfcs/001-button-tone.md)

## Context

- BRIEF §7 asks for one real deprecation with a codemod, and names `Button variant="danger"` → `tone="critical"`.
- Twelve components use `tone` with the value `danger`, and the tokens are `feedback.danger.*`. `critical` appears nowhere.
- Button was the only component with a status inside `variant`, which left one destructive button: the loud one.
- Packages are at 0.x, where semver allows a minor release to break things.

## Decision

- **Rename target:** `variant="danger"` → `tone="danger"`. Claude pushed back on `critical`; Anuj accepted.
- **Scope:** `tone` applies to `primary`, `outline` and `ghost`. It's ignored, with a development warning, on the others.
- **No observable change for old code:** `variant="danger"` renders as before, `data-variant="danger"` included.
- **Removal:** at 1.0.0 only. Syntara doesn't use the 0.x allowance to break in a minor.
- **Guarantee widened:** the four `feedback.*.fg` roles are now solved on `surface.canvas` and `surface.raised` too, so tone-coloured text is proven wherever a ghost button can sit. 118 checks per brand, was 102; 118,000 of 118,000 pass — `pnpm test:themes`.
- **A deprecation is a record, not a comment:** `meta.json` holds since, removal, replacement, reason, codemod and RFC. `pnpm check:meta` fails if the codemod or RFC is missing, or if removal isn't a later major release.
- **Outline danger keeps a danger-coloured border at rest**, so it reads as destructive before hover. Anuj accepted it at the Phase 4 review.
- **Codemods never guess.** They rewrite literals on components imported from Syntara, and report the rest with file and line.

## Alternatives considered

- **`tone="critical"`:** one component would use a word the rest of the system doesn't.
- **Rename danger to critical everywhere:** a breaking token change in every tenant, for no user need.
- **Remove two minors later:** clears old APIs sooner, but early adopters would break on a minor. A rule with no exceptions is easier to trust.
- **Map the old prop to the new attributes** (`data-variant="primary" data-tone="danger"`): simpler CSS, but it changes output that consumers may target, which is a breaking change by GOVERNANCE.md §5.

## Consequences

- **Good:** Button matches the system's vocabulary, screens get quiet destructive actions, and the process has been run once for real.
- **Bad:** Button carries two selectors for one style until 1.0. Ghost danger on glass is ruled out by a documented rule, not by code, until the drift auditor exists. The repo had few usages, so the migration diff is small; the fixture tests carry the edge cases.
- **Revisit when:** a second tone is wanted on Button (success, warning), or a deprecation blocks a fix that can't wait for 1.0.

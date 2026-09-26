# ADR-008: Agent trust levels

- **Status:** Proposed (Phase 5) — levels defined by Anuj (BRIEF §7); enforcement Claude recommended, pending Anuj
- **Date:** 2026-09-26
- **Principles:** 6, 7

## Context

- Agents will change this repo and consumer code through the MCP server.
- Unlimited agent writes → silent drift or breaking changes. A blanket ban → we lose the cheap wins (raw hex → token).
- Anuj's AI Trust Patterns framework: friction should match blast radius and reversibility.

## Decision

Three levels, published in `AGENTS.md` and served as an MCP resource:

| Level | Agents may | Human role | Example |
|---|---|---|---|
| **Ambient** | auto-fix token drift | none; visible in the diff | `#1f56e0` → `var(--strata-color-action-primary-bg)` |
| **Soft gate** | open PRs for docs, meta, stories | approves | add a missing story |
| **Hard gate** | propose only | RFC + design review + merge | new component, token-tier change, breaking change |

- Agents can't merge. Enforced with CODEOWNERS and branch protection (Phase 5).

## Alternatives considered

- **No agent access** — loses drift auto-fix, the most frequent and safest change.
- **Human approves everything** — review fatigue; approvals become rubber stamps.
- **Full autonomy** — a token-tier change ripples to every tenant with no design review.

## Consequences

- **Good:** friction sits where blast radius is high; the eval (Phase 5) measures whether it works.
- **Bad:** ambient fixes depend on nearest-token matching (`find_token`), which can pick the wrong token; enforcement lives in GitHub settings, outside the repo.
- **Revisit when:** eval results show agents breaking a gate, or gates blocking safe work.

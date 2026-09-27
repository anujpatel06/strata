# ADR-018: Position Strata on published evidence, and widen Phase 5 to match

- **Status:** Accepted — decided by **Claude recommended, Anuj accepted**
- **Date:** 2026-09-27
- **Principles:** 3, 6, 7

## Context

- Anuj asked how Strata differs from shadcn/ui, 21st.dev and similar. Research: `docs/research/2026-09-27-differentiation.md`.
- Components are a commodity. Material already generates a contrast-safe role set from a seed colour. A July 2026 survey found an MCP server in 20 of 21 design systems. shadcn ships a raw-colour lint.
- Not found anywhere: a reproducible public agent eval for a design system, a brand fidelity metric, or a drift tool that checks native elements, physical CSS properties and accessible names. These are absence-of-evidence findings.

## Decision

- **Pitch:** Strata publishes reproducible proof that any brand gets an accessible theme and that AI agents build correctly with it, across brands and RTL. It doesn't claim better components or a new kind of theme generator.
- **Agent eval (BRIEF §10) widens:**
  - scores reported per model, with the harness, prompts and run command public;
  - prompts tagged for accessibility, RTL and multi-brand, each with its own score;
  - every condition run more than once, with the spread reported;
  - a context ablation: none / AGENTS.md / llms.txt / MCP.
- **Brand fidelity metric (BRIEF §5):** the colour distance between each brand input and the colour the solver shipped, per scheme, in the contrast report and the fuzz report.
- **Drift auditor (BRIEF §9):** autofix for findings with one safe answer, and the same engine behind the MCP `audit_snippet` tool. The ambient trust level (ADR-008) is limited to those autofixes.
- **Claims:** no "first" or "only" without a check on the day it's published. The list of claims to avoid is in the research file, §6.

## Alternatives considered

- **Compete on components** (more of them, more polish): one person can't out-build shadcn's ecosystem, and it isn't the lead-level story.
- **Keep Phase 5 as written:** an MCP server and a single-model A/B eval are now table stakes (Razorpay's Blade ships an MCP).
- **Add APCA as a second guarantee:** WCAG 3 has no settled algorithm. It could be an extra report later, not a claim.

## Consequences

- **Good:** the differentiator is evidence that already fits the "no invented metrics" rule. Most of it extends planned work.
- **Bad:** Phase 5 grows. More eval runs cost more time and tokens, so the run cap in BRIEF §10 rises and is set in the Phase 5 plan. Results may be unflattering; they're published anyway.
- **Revisit when:** another system publishes a reproducible eval or fidelity metric, or the research is re-run before Phase 6.

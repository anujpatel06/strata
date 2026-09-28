# ADR-027: Tooltips swap instantly, and stay open through the scroll that focus causes

- **Status:** Accepted — instant swap: **Claude**, delegated by Anuj (2026-09-28, "whatever you feel is best"). Focus scroll: **Anuj**.
- **Date:** 2026-09-28
- **Principles:** craft, accessibility

## Context

- React Aria 1.21.1 leaves a tooltip mounted at 0,0 when Tab leaves a `ToggleButtonGroup` (`docs/upstream/react-aria-tooltip-stays-mounted.md`). The fix in `Tooltip` takes React Aria off its skip-animation path, so Strata now decides how a swap between two tooltips looks.
- React Aria also closes a tooltip on any scroll. Keyboard focus scrolls its control into view, so a tooltip opened by focus closed as soon as it opened.

## Decision

- **A tooltip that replaces another appears and disappears with no animation** (`data-instant`). The first tooltip in a sequence still animates in, and the last one still fades out.
- **A tooltip that closes before its first frame doesn't fade out.** It never appeared.
- **While the trigger has keyboard focus, only a scroll the person made closes the tooltip** (wheel, touch, pointer or key). Blur and Escape close it as before.

## Alternatives considered

- **Fade every tooltip out, also in a swap:** two tooltips overlap for 120ms on each Tab or hover along a toolbar. The Tactile rules say tooltips should never feel slow, and the references (Linear, Raycast, macOS) swap at once.
- **Cross-fade or slide the tooltip between triggers:** needs a shared element across separate overlays, which React Aria doesn't offer. Too much for a label.
- **Never close on scroll while focused:** simpler, but a tooltip in a nested scroll area would drift away from its control when the person scrolls.

## Consequences

- **Good:** swapping looks the same as React Aria intends. Keyboard users see every tooltip, which WCAG 1.4.13 expects of content shown on focus.
- **Bad:** `Tooltip` overrides React Aria's trigger state for its own subtree, which a later React Aria release could break. `node scripts/check-overlay-exit.mjs` would catch it.
- **Revisit when:** React Aria fixes the fault. Then remove the state override and keep `data-instant` only if it's still needed.

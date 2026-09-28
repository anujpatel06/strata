# ADR-028: Segmented controls wrap, `Key` is exported, and good or bad is never colour alone

- **Status:** Accepted — **Anuj delegated the call** ("fix all of these, do what is correct", 2026-09-28); Claude decided. Anuj reviews the visuals.
- **Date:** 2026-09-28
- **Principles:** 3, 7

## Context

Three faults, each found by measuring and not by review:

- **ToggleButtonGroup** overflowed its container. The agent eval found it: five one-word options at 390px scrolled the page sideways. Measured across six tenants, segments spilled by up to 145px, and in right-to-left they were clipped off the edge and couldn't be reached.
- **`Key`** was the eval's most common type error. Selection props take React Aria's `Key`; consumers don't have that package as a direct dependency, and React's own `Key` includes `bigint` and doesn't fit.
- **StatTile** showed whether a change was good or bad by colour only. In greyscale, "Revenue +6.4%" (good) and "Refunds +3.1%" (bad) were identical. The component's own meta said "never colour alone".

## Decision

- **ToggleButtonGroup wraps onto more rows inside the same track.** A label longer than the track wraps inside its segment. CSS only, no new prop. Nothing changes when the options fit: 240 of 240 screenshots of the existing examples are pixel-identical.
- **`@strata/react` exports the type `Key`.** Type-only and additive. It sits beside `Selection`, which was already exported the same way.
- **StatTile marks bad news with a shape.** A filled alert mark replaces the trend arrow on a bad change; good news keeps its arrow; no change has no mark. The sign always shows direction. Screen readers hear a word after the number, from two new props, `betterLabel` and `worseLabel`, so it can be translated.
- **The new glyphs are proven:** 5.43:1 and 6.18:1 against the pill, across tenants and 1,000 fuzz brands — `pnpm --filter @strata/react exec vitest run test/stat-tile.test.tsx`.

## Alternatives considered

- **Shrink and truncate the segments:** hides text. Reading it needs a tooltip, which touch users can't open.
- **Scroll inside the track:** needs script to bring the selected option into view, a cue that more exists which isn't colour, and right-to-left scroll handling. Options stay hidden until someone scrolls.
- **A check for good and a mark for bad:** a check on every rise is noise on a dense dashboard.
- **Re-export the `useLocale` hook too:** agents imported it in 11 eval screens. It's behaviour, not a type, so it's left for Anuj to decide.

## Consequences

- **Good:** no page overflow from the component at 320px in any tenant. Targets stay at 24px or more. The most common type error has a one-line answer.
- **Bad:** in a tight row the group now wraps where it used to overflow, so some layouts get taller. On the homepage the tenant chips wrap into two rows at 390px; a comment in that stylesheet says they were meant to scroll. Bad-news pills lose their arrow. `Key` lives in `toggle-group.tsx`, an arbitrary home.
- **Revisit when:** Anuj has looked at the bad-news pill and the homepage chips; `useLocale` is decided.

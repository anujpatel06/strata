# ADR-036: A duotone layer, derived from the outlines rather than drawn again

- **Status:** Accepted — **Anuj** (direction and both open questions); drawings by Claude, reviewed by Anuj.
- **Date:** 2026-09-29
- **Principles:** 1, 7
- **Supersedes part of:** [ADR-014](014-own-icon-set.md), which rejected a duotone set and said "it can return later as an opt-in layer".

## Context

- ADR-014 chose "curvy and minimalist" for `@syntara/icons` and rejected a duotone signature as working against
  "minimal", while leaving the door open for it as an opt-in layer. Anuj asked for that layer on 2026-09-29.
- The set already has one style layer beside the outlines: `filled.ts`, six status shapes with the glyph knocked
  out, used by Toast, Alert and StatTile where an outline is too light at 20px. Filled is loud on purpose. There was
  nothing between the two.
- **237 outline icons** need a twin. The six in `filled.ts` are already solid, so they get none.
  (`grep -c '^export const Icon' packages/icons/src/icons/*.ts`.)

## Decision

- **A duotone icon is its outline twin with a tint layer painted behind it, and the outline is never redrawn.**
  Each twin composes `base.node` — the drawing the outline component is built from, now kept on the component —
  so no path string is ever copied. Change an outline and its tint follows. A test asserts that the outline's nodes
  are the tail of every twin's, identical and in order.
- **The tint is derived from the outline's own subpaths.** `body(Base, i)` fills subpath i as it is; `closed(Base, i)`
  fills it with a `Z` appended, for a body the outline leaves open (a bin, a tray, a pair of shoulders);
  `holed(Base, i, hole)` cuts a window with even-odd, for a gear centre or a lens. `tint(d)` draws a body by hand and
  is the escape hatch, used **11 times** and commented at each. The tint's edge sits on the outline's
  centreline, so the 1.5 stroke covers it and there is no halo at any size.
- **`closed` is a marker, not a transform.** SVG's fill operation closes every open subpath, so `closed(Base, i)`
  paints exactly what `body(Base, i)` paints. It is kept because it says in one word that a mass the outline leaves
  open was deliberately closed, which is what review needs to see; the kit's doc comment says so rather than implying
  the appended `Z` does work. What still has to be checked by eye is where the closing edge lands — a chord that cuts
  across the drawing instead of running along the body's edge means the helper is wrong for that icon.
- **One token: `--syntara-icon-tint`**, defaulting to `color-mix(in oklab, currentColor 16%, transparent)`.
  The default means duotone follows the text colour like every other icon (ADR-014) and needs no setup, on any
  surface and inside a solid button. A theme, a tenant or one component sets the token to make the tint a real
  colour. It is one token with a fallback, not a generated role: the engine computes contrast-checked colours, and a
  wash of whatever colour the text happens to be is not something it can compute. So, like `--syntara-icon-on`, it is
  opt-in and no tenant token file changes. No mask and no `id`, so it survives SSR, repeated ids and registry copies.
- **Marks that enclose no area get a twin with no tint** (`untinted`), **54 of 237**: a check, an
  arrow, a chevron, `plus`, `menu-2`, the density and text-direction marks. They render exactly like the outline.
  The set stays 1:1 so a product can move its whole icon layer to duotone in one import change without hitting a
  missing export, and the docs say plainly that these have no second tone rather than claiming 237 duotone
  drawings.
- **The gallery gains a tenth group, Duotone**, after Filled, read from the source like every other group.

## Alternatives considered

- **A wash behind the bare strokes** — the mark repeated underneath at stroke 4.5, so every twin differs visibly from
  its outline. Built, rendered and rejected by Anuj on sight: at any weight it is a grey halo behind a dark mark,
  which reads as a drop shadow or a misregistered print, and it is worst at 16px where those marks are mostly used.
- **Leave the bare strokes out of the layer**, shipping the 183 that carry a tint. Cleanest as a style statement, but the set stops
  being 1:1, so a blanket swap breaks on a missing export and every consumer needs a fallback.
- **Two opacities of `currentColor`** (`fill-opacity: 0.16`, no token). Simplest and impossible to break, but opacity
  cannot see the background, so the wash goes muddy on a tinted surface, and a brand can never make the tint its own.
- **A semantic role for the fill** (accent muted bg). The most "designed" result, but it bakes a colour in, so the
  icon stops following text colour and breaks on a solid button — against ADR-014's currentColor rule.
- **A `variant="duotone"` prop instead of separate exports.** One name per icon, and the gallery gets a style switch
  rather than a group. Rejected for now: every icon would carry its tint geometry whether or not it is used, which
  costs every consumer bundle, and Anuj asked for a category. The prop can be added later over the same twins.
- **A style switch on the gallery toolbar** instead of a tenth group, which would keep the page one screen long.
  Anuj chose the group, matching how Filled already reads.

## Consequences

- **Good:** a middle weight between outline and filled; one token to brand it; the tint provably cannot drift from
  the drawing; `Icon.node` is now public, which any future style layer can build on the same way.
- **Bad:** the icons page is roughly twice as long, and a search for "user" returns both twins. If the gallery gets
  unwieldy, the style switch above is the fix.
- **The compiled validator is regenerated with the schema.** ADR-034 made `pnpm --filter @syntara/sdui generate`
  emit `src/validator.generated.js` as well as the schema files, so adding icon names to the wire enum is only half
  the change: without the regenerated validator the published schema accepts a duotone name and the validator
  rejects it at runtime. Caught by rebasing onto that ADR; `test/generate.test.ts` fails on stale output.
- **RTL costs nothing.** Button, Link and ToggleGroup flip arrows and chevrons with prefix selectors
  (`[data-syntara-icon^='arrow']`), and a twin's name is its outline's plus `-duotone`, so every twin flips exactly
  like the icon it copies. The naming test in `test/duotone.test.tsx` is what keeps that prefix true.
- **Bad:** `color-mix()` in an SVG presentation attribute is checked in Chromium only, like `filled.ts`'s `var()`.
  It is well inside the baseline the docs site already needs for `light-dark()` and `:dir()`.
- **Honest claim:** the set is 237 outline icons, 237 duotone twins of which 54 carry no tint,
  and 6 filled. Not "480 icons".

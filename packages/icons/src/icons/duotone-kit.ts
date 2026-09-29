/**
 * How a duotone icon is built (ADR-036). The list of them is ./duotone.ts; the style spec is ../create-icon.tsx.
 * Internal: index.ts does not re-export this, so `body`/`wash` never reach the package's public API.
 *
 * A duotone icon is its outline twin with a tint layer painted behind it. The outline is never redrawn: every
 * duotone composes `base.node`, so if the outline drawing changes, its tint follows. Set --syntara-icon-tint to
 * transparent and a duotone icon is pixel-identical to its outline twin (there is a test for that).
 *
 * Tint   fill = var(--syntara-icon-tint, color-mix(in oklab, currentColor 16%, transparent)).
 *        The default is the text colour at 16%, so duotone works with no setup, on any surface, and inside a solid
 *        button — it still follows currentColor like every other icon (ADR-014). A theme, a tenant or a component
 *        sets --syntara-icon-tint to make the second tone a real colour. One token, no mask and no id, so it
 *        survives SSR, repeated ids and registry copies (the technique filled.ts uses for --syntara-icon-on).
 * Body   The tint is the mass a reader would colour in, derived from the outline's own subpaths (`body`, `closed`,
 *        `holed`) rather than drawn again, so the two layers can't drift apart. `body` and `closed` paint the same
 *        pixels — see `closed` — and differ only in what they tell a reviewer. Its edge sits on the outline's
 *        centreline, so the 1.5 stroke covers it and there is no halo at any size. `tint()` is the escape hatch for
 *        a body the outline doesn't already contain.
 * None   Duotone is a fill style, and 54 marks (a check, an arrow, a chevron, plus, menu) enclose no area, so
 *        there is nothing to fill: `untinted` gives them a twin that renders exactly like the outline. The set
 *        stays 1:1, so a product can move its whole icon layer to duotone in one import change. A wash behind the
 *        mark was tried and rejected (Anuj, 2026-09-29) — at any weight it reads as a drop shadow, worst at 16px.
 * Naming <name>-duotone / Icon<Name>Duotone, matching filled.ts's <name>-filled.
 */
import { createIcon, type Icon, type IconNode } from '../create-icon';

type Part = IconNode[number];

export const TINT = 'var(--syntara-icon-tint, color-mix(in oklab, currentColor 16%, transparent))';

/** The outline's subpath i. Throws at build time if an icon is redrawn with fewer parts than its tint expects. */
const part = (base: Icon, i: number): Part => {
  const p = base.node[i];
  if (!p) throw new Error(`${base.iconName}: no subpath ${i} to derive a tint from`);
  return p;
};

/** Fill the outline's own subpath i. */
export const body = (base: Icon, i = 0): Part => {
  const [tag, attrs] = part(base, i);
  return [tag, { ...attrs, fill: TINT, stroke: 'none' }] as const;
};

/** Fill subpath i, closed — for a body the outline leaves open (a bin, a tray, a pair of shoulders). */
export const closed = (base: Icon, i = 0): Part => {
  const [tag, attrs] = part(base, i);
  if (attrs.d == null) throw new Error(`${base.iconName}: subpath ${i} is a <${tag}>, already closed — use body()`);
  return [tag, { ...attrs, d: `${String(attrs.d)}Z`, fill: TINT, stroke: 'none' }] as const;
};

/** Fill subpath i with `hole` knocked out of it (even-odd), for rings and anything with a window. */
export const holed = (base: Icon, i: number, hole: string): Part => {
  const [tag, attrs] = part(base, i);
  if (attrs.d == null) throw new Error(`${base.iconName}: subpath ${i} is a <${tag}>, which holed() can't cut — pass its shape as a path`);
  return ['path', { d: `${String(attrs.d)}${hole}`, fillRule: 'evenodd', fill: TINT, stroke: 'none' }] as const;
};

/** A hand-drawn tint, for the few bodies that aren't already a subpath of the outline. */
export const tint = (d: string): Part => ['path', { d, fill: TINT, stroke: 'none' }] as const;

/**
 * A twin with no tint, for a mark that encloses no area. Renders identically to its outline twin — deliberate, and
 * marked as such so review can tell it apart from a tint someone forgot.
 */
export const untinted = (base: Icon): Icon => createIcon(`${base.iconName}-duotone`, base.node);

/** An outline icon plus its tint layer, painted first so it sits behind the drawing. */
export const duotone = (base: Icon, ...tints: Part[]): Icon =>
  createIcon(`${base.iconName}-duotone`, [...tints, ...base.node]);

/** A circle as a path, for `holed`. Even-odd turns it into a window. */
export const ring = (cx: number, cy: number, r: number): string =>
  `M${cx + r} ${cy}a${r} ${r} 0 1 1-${r * 2} 0a${r} ${r} 0 1 1 ${r * 2} 0`;

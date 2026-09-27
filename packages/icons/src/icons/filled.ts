/**
 * Batch: filled status icons (Anuj's toast reference, 2026-09-27). Spec: ../create-icon.tsx.
 *
 * Status needs more weight than an outline gives at 20px, so these are solid shapes with the glyph knocked out.
 *
 * Technique  The shape is `fill: currentColor; stroke: none`, so it takes the text colour like every other icon.
 *            The glyph (check, !, i, x) is a stroke, and its dots are fills, in
 *              var(--strata-icon-on, var(--strata-color-surface-default, #fff))
 *            That is a knockout without masks or ids, so it survives SSR, repeated ids and registry copies, and a
 *            theme or component can set it. Components set --strata-icon-on to the colour that pairs with the
 *            shape: Toast and Alert use feedback.<tone>.fg for the shape and feedback.<tone>.bg for the glyph (an
 *            engine-checked 4.5:1 pair). Outside a component, the glyph falls back to the page surface, so it reads
 *            as a hole in both schemes (a plain #fff would vanish into a near-white shape in dark mode), and to
 *            white outside Strata. `var()` in an SVG presentation attribute is checked in Chromium.
 * Weight     The glyph stroke is a fixed 2 (heavier than the 1.5 outline default), because a knocked-out line reads
 *            thinner than a drawn one. The `stroke` prop and --strata-icon-stroke don't change it.
 * Size       Filled shapes look larger than outlines of the same size, so they sit on the keylines themselves
 *            (circle r=9) rather than outside them, and the triangle is status.ts alert-triangle scaled 1.07 about
 *            its centre, to match the circle's optical weight.
 */
import { createIcon } from '../create-icon';

const KNOCK = 'var(--strata-icon-on, var(--strata-color-surface-default, #fff))';
const shape = (d: string) => ['path', { d, fill: 'currentColor', stroke: 'none' }] as const;
const disc = ['circle', { cx: 12, cy: 12, r: 9, fill: 'currentColor', stroke: 'none' }] as const;
const glyph = (d: string) => ['path', { d, stroke: KNOCK, strokeWidth: 2 }] as const;
const dot = (cx: number, cy: number) => ['circle', { cx, cy, r: 1.1, fill: KNOCK, stroke: 'none' }] as const;

// Soft seal: r(θ) = 9.3 + 0.7·cos(8θ), sampled 6× per scallop and joined with Catmull-Rom curves, so scallops and
// the dips between them are all round (no teeth). Peak r = 10, dip r = 8.6.
const SEAL =
  'M22 12C22 12.42 21.79 12.87 21.57 13.26C21.34 13.65 20.92 13.98 20.65 14.32C20.37 14.66 20.09 14.93 19.95 15.29C19.8 15.65 19.8 16.04 19.75 16.48C19.7 16.91 19.77 17.44 19.66 17.87C19.54 18.31 19.37 18.77 19.07 19.07C18.77 19.37 18.31 19.54 17.87 19.66C17.44 19.77 16.91 19.7 16.48 19.75C16.04 19.8 15.65 19.8 15.29 19.95C14.93 20.09 14.66 20.37 14.32 20.65C13.98 20.92 13.65 21.34 13.26 21.57C12.87 21.79 12.42 22 12 22C11.58 22 11.13 21.79 10.74 21.57C10.35 21.34 10.02 20.92 9.68 20.65C9.34 20.37 9.07 20.09 8.71 19.95C8.35 19.8 7.96 19.8 7.53 19.75C7.09 19.7 6.56 19.77 6.13 19.66C5.69 19.54 5.23 19.37 4.93 19.07C4.63 18.77 4.46 18.31 4.34 17.87C4.23 17.44 4.3 16.91 4.25 16.48C4.2 16.04 4.2 15.65 4.05 15.29C3.91 14.93 3.63 14.66 3.35 14.32C3.08 13.98 2.66 13.65 2.43 13.26C2.21 12.87 2 12.42 2 12C2 11.58 2.21 11.13 2.43 10.74C2.66 10.35 3.08 10.02 3.35 9.68C3.63 9.34 3.91 9.07 4.05 8.71C4.2 8.35 4.2 7.96 4.25 7.52C4.3 7.09 4.23 6.56 4.34 6.13C4.46 5.69 4.63 5.23 4.93 4.93C5.23 4.63 5.69 4.46 6.13 4.34C6.56 4.23 7.09 4.3 7.52 4.25C7.96 4.2 8.35 4.2 8.71 4.05C9.07 3.91 9.34 3.63 9.68 3.35C10.02 3.08 10.35 2.66 10.74 2.43C11.13 2.21 11.58 2 12 2C12.42 2 12.87 2.21 13.26 2.43C13.65 2.66 13.98 3.08 14.32 3.35C14.66 3.63 14.93 3.91 15.29 4.05C15.65 4.2 16.04 4.2 16.48 4.25C16.91 4.3 17.44 4.23 17.87 4.34C18.31 4.46 18.77 4.63 19.07 4.93C19.37 5.23 19.54 5.69 19.66 6.13C19.77 6.56 19.7 7.09 19.75 7.52C19.8 7.96 19.8 8.35 19.95 8.71C20.09 9.07 20.37 9.34 20.65 9.68C20.92 10.02 21.34 10.35 21.57 10.74C21.79 11.13 22 11.58 22 12Z';

// The tick: status.ts circle-check's curve, nudged up so it centres optically in a filled shape.
const TICK = 'M8.1 12.55 10.45 14.9C11.85 12.6 13.6 10.8 15.9 9.4';

/** Success, with more ceremony than a circle: a soft scalloped seal with the tick knocked out. */
export const IconSealCheckFilled = createIcon('seal-check-filled', [shape(SEAL), glyph(TICK)]);
export const IconCircleCheckFilled = createIcon('circle-check-filled', [disc, glyph(TICK)]);
// Rounded triangle: every corner a soft quadratic (status.ts alert-triangle × 1.07 about (12, 13)).
export const IconAlertTriangleFilled = createIcon('alert-triangle-filled', [
  shape('M10.63 5.52Q12 3.1 13.37 5.52L19.99 17.27Q21.36 19.69 18.58 19.69H5.42Q2.64 19.69 4.01 17.27Z'),
  glyph('M12 9.6v3.6'),
  dot(12, 16.25),
]);
export const IconAlertCircleFilled = createIcon('alert-circle-filled', [disc, glyph('M12 7.6v4.9'), dot(12, 15.95)]);
export const IconInfoCircleFilled = createIcon('info-circle-filled', [disc, glyph('M12 11.1v4.9'), dot(12, 8.05)]);
export const IconCircleXFilled = createIcon('circle-x-filled', [disc, glyph('M9.4 9.4l5.2 5.2M14.6 9.4l-5.2 5.2')]);

/**
 * Non-colour foundations: 4pt space scale, radius by shape, type scale, motion, density.
 * Everything here is brand-independent except `radius`, which follows the brand's `shape`.
 */
import type { Density, DensityTokens, Foundations, Shape } from './types';

const RADIUS: Record<Shape, Foundations['radius']> = {
  sharp: { button: 2, field: 2, container: 4, badge: 2, pill: 9999 },
  soft: { button: 8, field: 8, container: 12, badge: 6, pill: 9999 },
  round: { button: 9999, field: 14, container: 20, badge: 9999, pill: 9999 },
};

const DENSITY: Record<Density, DensityTokens> = {
  comfortable: { controlHeight: 40, controlPaddingInline: 16, tableRowHeight: 48, cardInset: 24, sectionGap: 24, fieldGap: 16 },
  compact: { controlHeight: 32, controlPaddingInline: 12, tableRowHeight: 36, cardInset: 16, sectionGap: 16, fieldGap: 12 },
};

const SHAPES: readonly Shape[] = ['sharp', 'soft', 'round'];

/** Radius tokens for a shape (a fresh object each call). */
export function radiusForShape(shape: Shape): Foundations['radius'] {
  const r = RADIUS[shape];
  if (!r) throw new Error(`Unknown shape ${JSON.stringify(shape)}. Use one of: ${SHAPES.join(', ')}.`);
  return { ...r };
}

/** Full Foundations for a shape. Returns fresh objects, so callers may mutate the result safely. */
export function foundationsForShape(shape: Shape): Foundations {
  return {
    space: { '0': 0, '1': 4, '2': 8, '3': 12, '4': 16, '5': 20, '6': 24, '8': 32, '10': 40, '12': 48, '16': 64 },
    radius: radiusForShape(shape),
    fontSize: { xs: 12, sm: 13, md: 14, lg: 16, xl: 20, '2xl': 24, '3xl': 32 },
    lineHeight: { tight: 1.2, snug: 1.35, normal: 1.5 },
    fontWeight: { regular: 400, medium: 500, semibold: 600, bold: 700 },
    motion: { durationFast: 120, durationNormal: 200, easing: 'cubic-bezier(0.2, 0, 0, 1)' },
    density: { comfortable: { ...DENSITY.comfortable }, compact: { ...DENSITY.compact } },
  };
}

function deepFreeze<T>(o: T): Readonly<T> {
  if (o && typeof o === 'object') {
    for (const v of Object.values(o)) deepFreeze(v);
    Object.freeze(o);
  }
  return o;
}

/**
 * Shape-independent foundations. `radius` here is the 'soft' set (the default shape);
 * use radiusForShape / foundationsForShape for a specific brand. Frozen.
 */
export const FOUNDATIONS: Readonly<Foundations> = deepFreeze(foundationsForShape('soft'));

/**
 * Non-colour foundations: 4pt space scale, radius by shape, type scale, motion, density.
 * Everything here is brand-independent except `radius`, which follows the brand's `shape`.
 */
import type { Density, DensityTokens, Foundations, ScriptTypeTokens, Shape, TypePair } from './types';

/**
 * v0.3 finesse (ADR-013): even "sharp" is softened. 2px corners read as dated, so sharp now means crisp
 * rather than square. Containers are always larger than the controls inside them, so nested corners
 * can line up (inner radius = outer radius − inset; see CONVENTIONS "Finesse").
 */
const RADIUS: Record<Shape, Foundations['radius']> = {
  // Rounder again after Anuj's review (2026-09-27): "make roundness to the components".
  sharp: { button: 8, field: 8, container: 12, badge: 6, pill: 9999 },
  soft: { button: 12, field: 12, container: 20, badge: 8, pill: 9999 },
  round: { button: 9999, field: 18, container: 28, badge: 9999, pill: 9999 },
};

/**
 * Letter-spacing that follows size: slightly open at small sizes, tighter as text grows, the way
 * optical sizing works in system UI fonts. Curve: Inter's published "dynamic metrics"
 * (tracking = -0.0223 + 0.185·e^(-0.1745·px) em, rsms.me/inter/dynmetrics). Arabic-capable pairs get 0:
 * letter-spacing breaks joined Arabic script.
 */
export function trackingForSize(px: number, supportsArabic: boolean): string {
  if (supportsArabic) return '0';
  const em = -0.0223 + 0.185 * Math.exp(-0.1745 * px);
  return `${Math.round(em * 1000) / 1000}em`;
}

const DENSITY: Record<Density, DensityTokens> = {
  // Card inset and section gap opened up in the finesse pass (Anuj, 2026-09-27: "room like 21st.dev").
  comfortable: { controlHeight: 40, controlPaddingInline: 16, tableRowHeight: 48, cardInset: 28, sectionGap: 28, fieldGap: 16 },
  compact: { controlHeight: 32, controlPaddingInline: 12, tableRowHeight: 40, cardInset: 20, sectionGap: 20, fieldGap: 12 },
};

const SHAPES: readonly Shape[] = ['sharp', 'soft', 'round'];

/**
 * A damped spring (mass 1) sampled into CSS linear(). Stiffness 400 / damping 28 gives damping
 * ratio 0.70: about 4% overshoot, settled in ~400ms — a press or a menu that lands, not a bounce.
 * Duration is when it stays within 0.5% of rest (the tail after that is invisible). Browsers without linear() fall back to `easing`.
 */
export function springEasing(stiffness: number, damping: number, points = 40): { easing: string; duration: number } {
  const dt = 1 / 1000;
  let x = 0;
  let v = 0;
  const xs: number[] = [0];
  let t = 0;
  let settled = 0;
  while (t < 3) {
    const a = stiffness * (1 - x) - damping * v;
    v += a * dt;
    x += v * dt;
    t += dt;
    xs.push(x);
    if (Math.abs(1 - x) < 0.005 && Math.abs(v) < 0.05) {
      if (!settled) settled = t;
    } else settled = 0;
    if (settled && t - settled > 0.05) break;
  }
  const end = settled || t;
  const n = Math.round(end / dt);
  const samples: string[] = [];
  for (let i = 0; i <= points; i++) {
    const v = i === points ? 1 : xs[Math.round((i / points) * n)]!;
    samples.push(String(Math.round(v * 1000) / 1000));
  }
  return { easing: `linear(${samples.join(', ')})`, duration: Math.round(end * 1000) };
}

const SPRING = { ...springEasing(400, 28), stiffness: 400, damping: 28 };

/** Radius tokens for a shape (a fresh object each call). */
export function radiusForShape(shape: Shape): Foundations['radius'] {
  const r = RADIUS[shape];
  if (!r) throw new Error(`Unknown shape ${JSON.stringify(shape)}. Use one of: ${SHAPES.join(', ')}.`);
  return { ...r };
}

/** --syntara-font-tracking-caps: open for Latin small caps; 0 for Arabic (joins) and scripts that set their own. */
export function capsTracking(pair: Pick<TypePair, 'supportsArabic' | 'script'>): string {
  if (pair.supportsArabic) return '0';
  return pair.script?.capsTracking ?? '0.08em';
}

/**
 * Applies a script's type tokens (ADR-020) to Foundations in place: its line heights replace the Latin ones, and
 * type-scale steps below its minimum size are raised to it. Latin and Arabic pairs have no `script`, so their
 * foundations are unchanged.
 */
export function applyScriptTokens(f: Foundations, script: ScriptTypeTokens): Foundations {
  f.lineHeight = { ...script.lineHeight };
  for (const k of Object.keys(f.fontSize) as (keyof Foundations['fontSize'])[]) {
    f.fontSize[k] = Math.max(f.fontSize[k], script.minFontSize);
  }
  return f;
}

/**
 * Full Foundations for a shape, and for a type pair when it carries script tokens. Returns fresh objects, so callers
 * may mutate the result safely.
 */
export function foundationsForShape(shape: Shape, pair?: Pick<TypePair, 'script'>): Foundations {
  const f: Foundations = {
    space: { '0': 0, '1': 4, '2': 8, '3': 12, '4': 16, '5': 20, '6': 24, '8': 32, '10': 40, '12': 48, '16': 64 },
    radius: radiusForShape(shape),
    // 4xl/5xl are display sizes for hero numbers and page titles (ADR-013 finesse: hierarchy).
    fontSize: { xs: 12, sm: 13, md: 14, lg: 16, xl: 20, '2xl': 24, '3xl': 32, '4xl': 40, '5xl': 48 },
    lineHeight: { tight: 1.2, snug: 1.35, normal: 1.5 },
    fontWeight: { regular: 400, medium: 500, semibold: 600, bold: 700 },
    motion: {
      durationFast: 120,
      durationNormal: 200,
      durationSlow: 320,
      easing: 'cubic-bezier(0.2, 0, 0, 1)',
      easingOut: 'cubic-bezier(0.16, 1, 0.3, 1)',
      spring: { ...SPRING },
    },
    density: { comfortable: { ...DENSITY.comfortable }, compact: { ...DENSITY.compact } },
  };
  return pair?.script ? applyScriptTokens(f, pair.script) : f;
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

/**
 * 12-step OKLCH ramps, per scheme.
 *
 * Brand-type ramps (primary, accent, success, warning, danger, info): hue held from the base,
 * chroma = base chroma × a per-step factor, L from a fixed curve. Step 9 is the base hex EXACTLY
 * in both schemes — that is the "your colour, untouched" promise.
 *
 * The neutral ramp is not brand-type: constant hue/chroma by temperature, no exact base.
 */
import type { NeutralTemperature, Ramp, RampName, ResolvedBrandInput, Scheme } from './types';
import { hexToOklch, normalizeHex, oklchToHex, type Oklch } from './color';

export const RAMP_NAMES = ['primary', 'accent', 'neutral', 'success', 'warning', 'danger', 'info'] as const satisfies readonly RampName[];
export const STEPS = 12;
/** 1-based step that holds the exact base colour of a brand-type ramp. */
export const BASE_STEP = 9;

export type FeedbackName = 'success' | 'warning' | 'danger' | 'info';
export const FEEDBACK_NAMES = ['success', 'warning', 'danger', 'info'] as const satisfies readonly FeedbackName[];

/**
 * Feedback bases in OKLCH; gamut-mapped to hex, then treated as a brand-type base.
 * Tuned so the system palette needs no solver help in either scheme: each solid takes its
 * preferred label (FEEDBACK_LABEL) at ≥ 4.5:1 and step 11 passes as message text.
 *   success #11813c — white 4.9:1   (was L 0.60 / #25984d: white 3.6, ink 4.4 — no label fit)
 *   warning #efa30f — ink ≥ 7.7:1
 *   danger  #d73431 — white 4.7:1
 *   info    #0f74c5 — white 4.8:1   (was L 0.58 / #1f7dcf: white 4.2, ink 3.8 — no label fit)
 */
export const FEEDBACK_BASES: Record<FeedbackName, Oklch> = {
  success: { l: 0.53, c: 0.14, h: 150 },
  warning: { l: 0.77, c: 0.16, h: 75 },
  danger: { l: 0.58, c: 0.2, h: 27 },
  info: { l: 0.55, c: 0.15, h: 250 },
};

/** Preferred label on each feedback solid. A 'choice' adjustment is logged only when the solver has to use the other one. */
export const FEEDBACK_LABEL: Record<FeedbackName, 'white' | 'ink'> = {
  success: 'white',
  warning: 'ink',
  danger: 'white',
  info: 'white',
};

export function feedbackBaseHex(name: FeedbackName): string {
  return oklchToHex(FEEDBACK_BASES[name]);
}

const LIGHT_CHROMA = [0.1, 0.18, 0.3, 0.42, 0.52, 0.62, 0.72, 0.85, 1, 1, 0.9, 0.6] as const;
const DARK_CHROMA = [0.12, 0.16, 0.25, 0.33, 0.4, 0.48, 0.58, 0.72, 1, 1, 0.75, 0.35] as const;

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/** L targets for steps 1–12. Index 8 (step 9) is the base L; it is never used (the base hex is kept verbatim). */
export function brandLightnessTargets(baseL: number, scheme: Scheme, textCapL = 0.52): number[] {
  if (scheme === 'light') {
    const s10 = baseL < 0.32 ? baseL + 0.06 : baseL - 0.05;
    const s11 = Math.min(textCapL, baseL);
    const s12 = clamp(Math.min(0.3, baseL - 0.06), 0.15, 0.3);
    return [0.99, 0.975, 0.95, 0.92, 0.885, 0.845, 0.79, 0.715, baseL, s10, s11, s12];
  }
  const s10 = baseL > 0.8 ? baseL - 0.05 : baseL + 0.05;
  const s11 = Math.min(0.9, Math.max(0.78, baseL + 0.1));
  return [0.17, 0.2, 0.245, 0.28, 0.315, 0.355, 0.41, 0.48, baseL, s10, s11, 0.93];
}

/**
 * Feedback message text (step 11, light) sits a little deeper than a brand's, so it keeps 4.5:1 on every tinted
 * surface it meets — including a selected row, whose tint comes from the brand — without the solver stepping in.
 */
const FEEDBACK_TEXT_CAP_L = 0.48;

/** A brand-type ramp: step 9 === normalizeHex(baseHex). `textCapL` caps step 11's lightness in the light scheme. */
export function brandRamp(baseHex: string, scheme: Scheme, textCapL?: number): Ramp {
  const base = normalizeHex(baseHex);
  const { l, c, h } = hexToOklch(base);
  const targets = brandLightnessTargets(l, scheme, textCapL);
  const factors = scheme === 'light' ? LIGHT_CHROMA : DARK_CHROMA;
  return targets.map((targetL, i) =>
    i === BASE_STEP - 1 ? base : oklchToHex({ l: targetL, c: c * factors[i]!, h }),
  );
}

const NEUTRAL_LIGHT_L = [0.995, 0.978, 0.955, 0.93, 0.905, 0.875, 0.835, 0.76, 0.62, 0.56, 0.47, 0.24] as const;
const NEUTRAL_DARK_L = [0.16, 0.19, 0.225, 0.255, 0.285, 0.32, 0.37, 0.44, 0.6, 0.66, 0.78, 0.95] as const;
const NEUTRAL_CHROMA = [0.5, 0.6, 0.7, 0.8, 0.85, 0.9, 0.95, 1, 1, 1, 1, 1] as const;

/** Below this chroma a primary has no meaningful hue to borrow (greys, black, white). */
const HUELESS_PRIMARY_C = 1e-3;

export function neutralTint(temperature: NeutralTemperature, primaryHex: string): { h: number; c: number } {
  if (temperature === 'cool') return { h: 255, c: 0.012 };
  if (temperature === 'warm') return { h: 75, c: 0.01 };
  if (temperature === 'paper') return { h: 85, c: 0.022 };
  const p = hexToOklch(primaryHex);
  // "neutral" borrows the primary's hue. A grey/black/white primary has no hue (h is a placeholder 0,
  // i.e. pink), so the neutrals stay pure grey instead of picking up an arbitrary tint.
  return p.c < HUELESS_PRIMARY_C ? { h: 0, c: 0 } : { h: p.h, c: 0.004 };
}

export function neutralRamp(temperature: NeutralTemperature, primaryHex: string, scheme: Scheme): Ramp {
  const { h, c } = neutralTint(temperature, primaryHex);
  const ls = scheme === 'light' ? NEUTRAL_LIGHT_L : NEUTRAL_DARK_L;
  return ls.map((l, i) => oklchToHex({ l, c: c * NEUTRAL_CHROMA[i]!, h }));
}

export function buildRamps(input: ResolvedBrandInput, scheme: Scheme): Record<RampName, Ramp> {
  return {
    primary: brandRamp(input.primary, scheme),
    accent: brandRamp(input.accent, scheme),
    neutral: neutralRamp(input.neutral, input.primary, scheme),
    success: brandRamp(feedbackBaseHex('success'), scheme, FEEDBACK_TEXT_CAP_L),
    warning: brandRamp(feedbackBaseHex('warning'), scheme, FEEDBACK_TEXT_CAP_L),
    danger: brandRamp(feedbackBaseHex('danger'), scheme, FEEDBACK_TEXT_CAP_L),
    info: brandRamp(feedbackBaseHex('info'), scheme, FEEDBACK_TEXT_CAP_L),
  };
}

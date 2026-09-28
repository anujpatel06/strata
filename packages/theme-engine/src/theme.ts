/**
 * generateTheme: BrandInput (≤6 inputs) → complete light + dark theme with contrast report.
 * Deterministic: the same input always produces the same output (except summary.generationMs).
 */
import { normalizeHex } from './color';
import { foundationsForShape } from './foundations';
import { buildRamps } from './ramps';
import { solveChart } from './chart';
import { solveGlass } from './glass';
import { checkScheme, resolveRoles } from './roles';
import { TYPE_PAIRS } from './type-pairs';
import {
  ROLES,
  type Adjustment,
  type BrandInput,
  type ContrastCheck,
  type Density,
  type NeutralTemperature,
  type ResolvedBrandInput,
  type Scheme,
  type SchemeTheme,
  type Shape,
  type Theme,
  type TypePairId,
} from './types';

export const SCHEMES: readonly Scheme[] = ['light', 'dark'];

const NEUTRALS: readonly NeutralTemperature[] = ['cool', 'neutral', 'warm', 'paper'];
const SHAPES: readonly Shape[] = ['sharp', 'soft', 'round'];
const DENSITIES: readonly Density[] = ['comfortable', 'compact'];

export const SHADOWS: Record<Scheme, SchemeTheme['shadows']> = {
  // Layered: a tight contact shadow plus a soft ambient one reads as real depth (Linear/Vercel style).
  light: {
    raised: '0 0.5px 1px rgb(16 24 40 / 0.06), 0 2px 8px -2px rgb(16 24 40 / 0.07)',
    overlay: '0 0 0 0.5px rgb(16 24 40 / 0.06), 0 8px 24px -6px rgb(16 24 40 / 0.12), 0 24px 64px -16px rgb(16 24 40 / 0.18)',
    highlight: 'inset 0 1px 0 rgb(255 255 255 / 0.20)',
  },
  // Dark: shadows barely show, so a hairline light ring carries the edge.
  dark: {
    raised: '0 0 0 0.5px rgb(255 255 255 / 0.06), 0 1px 2px rgb(0 0 0 / 0.30), 0 4px 12px -4px rgb(0 0 0 / 0.40)',
    overlay: '0 0 0 0.5px rgb(255 255 255 / 0.10), 0 8px 24px -6px rgb(0 0 0 / 0.40), 0 32px 72px -16px rgb(0 0 0 / 0.60)',
    highlight: 'inset 0 1px 0 rgb(255 255 255 / 0.12)',
  },
};

function oneOf<T extends string>(field: string, value: unknown, allowed: readonly T[]): T {
  if (typeof value === 'string' && (allowed as readonly string[]).includes(value)) return value as T;
  throw new Error(`Invalid ${field} ${JSON.stringify(value)}. Use one of: ${allowed.join(', ')}.`);
}

/** Validates and normalises a BrandInput: lowercase #rrggbb hexes, accent defaults to primary. Throws on invalid input. */
export function normalizeBrandInput(input: BrandInput): ResolvedBrandInput {
  if (!input || typeof input !== 'object') throw new Error('Brand input must be an object.');
  const primary = normalizeHex(input.primary);
  const accentRaw = input.accent;
  const accent =
    accentRaw === undefined || accentRaw === null || (typeof accentRaw === 'string' && accentRaw.trim() === '')
      ? primary
      : normalizeHex(accentRaw);
  return {
    name: typeof input.name === 'string' ? input.name.trim() : '',
    primary,
    accent,
    neutral: oneOf('neutral', input.neutral, NEUTRALS),
    shape: oneOf('shape', input.shape, SHAPES),
    typePair: oneOf('typePair', input.typePair, Object.keys(TYPE_PAIRS) as TypePairId[]),
    density: oneOf('density', input.density, DENSITIES),
  };
}

/**
 * Number of leaf tokens in the DTCG export:
 * primitive colours (2 schemes × 7 ramps × 12) + semantic colours (2 × roles) + shadows (2 × 3)
 * + glass (2 × 2) + chart (2 × 6: series 1–4, grid, axis) + space (11) + radius (5) + font families (3) + font sizes (9) + line heights (3)
 * + font weights (4) + durations (4) + easings (2) + density (2 × 6).
 * The spring's linear() easing is CSS-only (DTCG has no type for it), so it isn't counted.
 */
export function countTokens(): number {
  return 2 * 7 * 12 + 2 * ROLES.length + 6 + 4 + 12 + 11 + 5 + 3 + 9 + 3 + 4 + 4 + 2 + 12;
}

export function generateTheme(input: BrandInput): Theme {
  const t0 = performance.now();
  const resolved = normalizeBrandInput(input);

  const schemes = {} as Record<Scheme, SchemeTheme>;
  const adjustments: Adjustment[] = [];
  const checks: ContrastCheck[] = [];
  for (const scheme of SCHEMES) {
    const ramps = buildRamps(resolved, scheme);
    // Dark is resolved after light and gets its roles, so solid fills keep their labels (ADR-006).
    const { roles, adjustments: adj } = resolveRoles(scheme, ramps, scheme === 'dark' ? schemes.light?.roles : undefined);
    schemes[scheme] = { ramps, roles, shadows: { ...SHADOWS[scheme] }, glass: solveGlass(roles), chart: solveChart(roles, scheme, resolved.primary, resolved.accent) };
    adjustments.push(...adj);
    checks.push(...checkScheme(scheme, roles));
  }

  const src = TYPE_PAIRS[resolved.typePair];
  // A pair's script tokens (ADR-020) replace line heights and raise small sizes, so every exporter reads them here.
  const foundations = foundationsForShape(resolved.shape, src);
  const typePair = {
    ...src,
    googleFamilies: [...src.googleFamilies],
    ...(src.script ? { script: { ...src.script, lineHeight: { ...src.script.lineHeight } } } : {}),
  };
  const passed = checks.filter((c) => c.pass).length;

  return {
    input: resolved,
    schemes,
    adjustments,
    checks,
    foundations,
    typePair,
    summary: {
      checks: checks.length,
      passed,
      failed: checks.length - passed,
      adjustments: adjustments.length,
      tokenCount: countTokens(),
      generationMs: performance.now() - t0,
    },
  };
}

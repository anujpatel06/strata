/**
 * generateTheme: BrandInput (≤6 inputs) → complete light + dark theme with contrast report.
 * Deterministic: the same input always produces the same output (except summary.generationMs).
 */
import { normalizeHex } from './color';
import { foundationsForShape } from './foundations';
import { buildRamps } from './ramps';
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

const NEUTRALS: readonly NeutralTemperature[] = ['cool', 'neutral', 'warm'];
const SHAPES: readonly Shape[] = ['sharp', 'soft', 'round'];
const DENSITIES: readonly Density[] = ['comfortable', 'compact'];

export const SHADOWS: Record<Scheme, SchemeTheme['shadows']> = {
  light: {
    raised: '0 1px 2px rgb(16 24 40 / 0.06), 0 1px 3px rgb(16 24 40 / 0.10)',
    overlay: '0 12px 32px -8px rgb(16 24 40 / 0.18), 0 4px 8px -4px rgb(16 24 40 / 0.08)',
  },
  dark: {
    raised: '0 1px 2px rgb(0 0 0 / 0.40), 0 0 0 1px rgb(255 255 255 / 0.04)',
    overlay: '0 16px 40px -8px rgb(0 0 0 / 0.60), 0 0 0 1px rgb(255 255 255 / 0.06)',
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
 * primitive colours (2 schemes × 7 ramps × 12) + semantic colours (2 × roles) + shadows (4)
 * + space (11) + radius (5) + font families (3) + font sizes (7) + line heights (3)
 * + font weights (4) + durations (2) + easing (1) + density (2 × 6).
 */
export function countTokens(): number {
  return 2 * 7 * 12 + 2 * ROLES.length + 4 + 11 + 5 + 3 + 7 + 3 + 4 + 2 + 1 + 12;
}

export function generateTheme(input: BrandInput): Theme {
  const t0 = performance.now();
  const resolved = normalizeBrandInput(input);

  const schemes = {} as Record<Scheme, SchemeTheme>;
  const adjustments: Adjustment[] = [];
  const checks: ContrastCheck[] = [];
  for (const scheme of SCHEMES) {
    const ramps = buildRamps(resolved, scheme);
    const { roles, adjustments: adj } = resolveRoles(scheme, ramps);
    schemes[scheme] = { ramps, roles, shadows: { ...SHADOWS[scheme] } };
    adjustments.push(...adj);
    checks.push(...checkScheme(scheme, roles));
  }

  const foundations = foundationsForShape(resolved.shape);
  const src = TYPE_PAIRS[resolved.typePair];
  const typePair = { ...src, googleFamilies: [...src.googleFamilies] };
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

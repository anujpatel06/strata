/**
 * Theme → W3C Design Tokens Format Module 2025.10 JSON.
 *
 * Tree (the engine's countTokens() relies on this exact shape — 339 leaf tokens):
 *   primitive.color.<scheme>.<ramp>.<1–12>                 168
 *   semantic.<scheme>.color.<role path>                      96  (alias to a primitive when the role is a ramp step)
 *   semantic.<scheme>.shadow.{raised,overlay,highlight}       6
 *   semantic.<scheme>.glass.{opacity,blur}                    4
 *   semantic.<scheme>.chart.{1–4,grid,axis}                  12  (grid/axis alias border.subtle / text.subtle)
 *   foundation.space / radius / font.* / motion.*            36
 *   density.<density>.<token>                                12
 */
import type { Adjustment, ResolvedColor, Role, Scheme, Theme } from '../types';
import { ROLES } from '../types';
import { CHART_AXIS_ROLE, CHART_GRID_ROLE } from '../chart';
import {
  DENSITY_KEYS,
  FONT_ROLES,
  FONT_SIZE_KEYS,
  FONT_WEIGHT_KEYS,
  GENERATOR_ID,
  LINE_HEIGHT_KEYS,
  RADIUS_KEYS,
  RAMP_NAMES,
  SPACE_KEYS,
  dtcgColor,
  parseCubicBezier,
  parseShadow,
  px,
  rolePath,
  setPath,
  splitFontStack,
} from './util';

const SCHEMES: readonly Scheme[] = ['light', 'dark'];

export type DtcgType =
  | 'color'
  | 'dimension'
  | 'duration'
  | 'cubicBezier'
  | 'fontFamily'
  | 'fontWeight'
  | 'number'
  | 'shadow';

export interface DtcgToken {
  $type: DtcgType;
  $value: unknown;
  $description?: string;
  $extensions?: Record<string, unknown>;
}

const token = ($type: DtcgType, $value: unknown): DtcgToken => ({ $type, $value });

/** "{primitive.color.light.primary.9}" for a role ref "primary.9". */
const primitiveRef = (scheme: Scheme, ref: string): string => `{primitive.color.${scheme}.${ref}}`;

function primitives(theme: Theme): Record<string, unknown> {
  const color: Record<string, unknown> = {};
  for (const scheme of SCHEMES) {
    const ramps = theme.schemes[scheme].ramps;
    const group: Record<string, unknown> = {};
    for (const ramp of RAMP_NAMES) {
      const steps = ramps[ramp];
      if (!steps || steps.length !== 12) {
        throw new Error(`toDTCG: ${scheme} ramp "${ramp}" must have 12 steps (got ${steps?.length ?? 0})`);
      }
      const rampGroup: Record<string, DtcgToken> = {};
      steps.forEach((hex, i) => {
        rampGroup[String(i + 1)] = token('color', dtcgColor(hex));
      });
      group[ramp] = rampGroup;
    }
    color[scheme] = group;
  }
  return {
    $description: 'Raw 12-step OKLCH ramps (step 1 = page background, 12 = highest-contrast text). Components never use these directly.',
    color,
  };
}

function semanticColor(scheme: Scheme, role: Role, c: ResolvedColor, adjustments: ReadonlyMap<string, Adjustment>): DtcgToken {
  const t = token('color', c.ref ? primitiveRef(scheme, c.ref) : dtcgColor(c.hex));
  if (c.adjusted) {
    const adj = adjustments.get(c.adjusted.adjustmentId);
    t.$extensions = {
      'com.syntara.adjusted': {
        id: c.adjusted.adjustmentId,
        from: c.adjusted.fromRef ? primitiveRef(scheme, c.adjusted.fromRef) : c.adjusted.fromHex,
        reason: adj?.message ?? `Adjusted by the contrast solver (${c.adjusted.adjustmentId}) for ${role}.`,
      },
    };
  }
  return t;
}

/** Chart palette: series are solved literals (chart.ts); grid and axis alias the roles they are. */
function chartTokens(scheme: Scheme, chart: Theme['schemes'][Scheme]['chart']): Record<string, unknown> {
  const out: Record<string, unknown> = {
    $description: 'Categorical chart series in fixed order (series 1 = brand hue). Solved to pass the dataviz checks: lightness band, chroma ≥ 0.1, 3:1 on surfaces, CVD and normal-vision ΔE.',
  };
  chart.series.forEach((hex, i) => {
    out[String(i + 1)] = token('color', dtcgColor(hex));
  });
  out.grid = token('color', `{semantic.${scheme}.color.${rolePath(CHART_GRID_ROLE).join('.')}}`);
  out.axis = token('color', `{semantic.${scheme}.color.${rolePath(CHART_AXIS_ROLE).join('.')}}`);
  return out;
}

function semantic(theme: Theme): Record<string, unknown> {
  const adjustments = new Map(theme.adjustments.map((a) => [a.id, a] as const));
  const out: Record<string, unknown> = {
    $description: 'Semantic roles per scheme. Components and product code use these (as CSS variables) and nothing else.',
  };
  for (const scheme of SCHEMES) {
    const s = theme.schemes[scheme];
    const color: Record<string, unknown> = {};
    for (const role of ROLES) {
      setPath(color, rolePath(role), semanticColor(scheme, role, s.roles[role], adjustments));
    }
    out[scheme] = {
      color,
      shadow: {
        raised: token('shadow', parseShadow(s.shadows.raised)),
        overlay: token('shadow', parseShadow(s.shadows.overlay)),
        highlight: token('shadow', parseShadow(s.shadows.highlight)),
      },
      glass: {
        opacity: token('number', s.glass.opacity),
        blur: token('dimension', px(s.glass.blur)),
      },
      chart: chartTokens(scheme, s.chart),
    };
  }
  return out;
}

function foundation(theme: Theme): Record<string, unknown> {
  const f = theme.foundations;
  const tp = theme.typePair;
  const space: Record<string, DtcgToken> = {};
  for (const k of SPACE_KEYS) space[k] = token('dimension', px(f.space[k]));
  const radius: Record<string, DtcgToken> = {};
  for (const k of RADIUS_KEYS) radius[k] = token('dimension', px(f.radius[k]));
  const family: Record<string, DtcgToken> = {};
  for (const k of FONT_ROLES) family[k] = token('fontFamily', splitFontStack(tp[k]));
  const size: Record<string, DtcgToken> = {};
  for (const k of FONT_SIZE_KEYS) size[k] = token('dimension', px(f.fontSize[k]));
  const lineHeight: Record<string, DtcgToken> = {};
  for (const k of LINE_HEIGHT_KEYS) lineHeight[k] = token('number', f.lineHeight[k]);
  const weight: Record<string, DtcgToken> = {};
  for (const k of FONT_WEIGHT_KEYS) weight[k] = token('fontWeight', f.fontWeight[k]);

  return {
    $description: 'Brand-shared scales: 4pt space grid, shape radius, type pair and scale, motion.',
    space,
    radius,
    font: { family, size, lineHeight, weight },
    motion: {
      duration: {
        fast: token('duration', { value: f.motion.durationFast, unit: 'ms' }),
        normal: token('duration', { value: f.motion.durationNormal, unit: 'ms' }),
        slow: token('duration', { value: f.motion.durationSlow, unit: 'ms' }),
        spring: token('duration', { value: f.motion.spring.duration, unit: 'ms' }),
      },
      easing: {
        standard: token('cubicBezier', parseCubicBezier(f.motion.easing)),
        out: token('cubicBezier', parseCubicBezier(f.motion.easingOut)),
      },
    },
  };
}

function density(theme: Theme): Record<string, unknown> {
  const out: Record<string, unknown> = {
    $description: `Density mode tokens. Tenant default: ${theme.input.density}.`,
  };
  for (const d of ['comfortable', 'compact'] as const) {
    const group: Record<string, DtcgToken> = {};
    for (const k of DENSITY_KEYS) group[k] = token('dimension', px(theme.foundations.density[d][k]));
    out[d] = group;
  }
  return out;
}

export function toDTCG(theme: Theme): Record<string, unknown> {
  return {
    $description: `Syntara theme for ${theme.input.name} — W3C Design Tokens Format Module 2025.10. Generated by ${GENERATOR_ID}; do not edit by hand.`,
    $extensions: {
      'com.syntara.theme': {
        input: { ...theme.input },
        generator: GENERATOR_ID,
        headingTracking: theme.typePair.headingTracking,
        typePair: {
          id: theme.typePair.id,
          label: theme.typePair.label,
          googleFamilies: [...theme.typePair.googleFamilies],
          // Script pairs (ADR-020) only: where foundation.font.lineHeight and the smallest size come from.
          ...(theme.typePair.script ? { script: { ...theme.typePair.script, lineHeight: { ...theme.typePair.script.lineHeight } } } : {}),
        },
      },
    },
    primitive: primitives(theme),
    semantic: semantic(theme),
    foundation: foundation(theme),
    density: density(theme),
  };
}

/** Counts leaf tokens (objects with "$value"). Does not descend into $-prefixed keys or into tokens. */
export function countLeafTokens(doc: unknown): number {
  if (doc === null || typeof doc !== 'object' || Array.isArray(doc)) return 0;
  if ('$value' in doc) return 1;
  let n = 0;
  for (const [k, v] of Object.entries(doc)) {
    if (!k.startsWith('$')) n += countLeafTokens(v);
  }
  return n;
}

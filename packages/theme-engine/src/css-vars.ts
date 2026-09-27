/**
 * Theme → CSS custom properties, per the CSS variable contract in types.ts.
 * The Brand Generator spreads toCssVariables() into an inline `style` on the preview
 * container, so it is complete (every contract variable) and allocation-light.
 */
import type { Density, Role, Scheme, Theme } from './types';
import { ROLES, roleToCssVar } from './types';
import { trackingForSize } from './foundations';
import { CHART_AXIS_ROLE, CHART_GRID_ROLE } from './chart';
import {
  DENSITY_KEYS,
  FONT_ROLES,
  FONT_SIZE_KEYS,
  FONT_WEIGHT_KEYS,
  LINE_HEIGHT_KEYS,
  RADIUS_KEYS,
  SPACE_KEYS,
  kebab,
} from './export/util';

export type CssVars = Record<string, string>;

// Names are computed once; only values vary per theme.
const ROLE_VARS: ReadonlyArray<readonly [Role, string]> = ROLES.map((r) => [r, roleToCssVar(r)] as const);
const SPACE_VARS = SPACE_KEYS.map((k) => [k, `--strata-space-${k}`] as const);
const RADIUS_VARS = RADIUS_KEYS.map((k) => [k, `--strata-radius-${k}`] as const);
const FONT_VARS = FONT_ROLES.map((k) => [k, `--strata-font-${k}`] as const);
const FONT_SIZE_VARS = FONT_SIZE_KEYS.map((k) => [k, `--strata-font-size-${k}`] as const);
const LINE_HEIGHT_VARS = LINE_HEIGHT_KEYS.map((k) => [k, `--strata-line-height-${k}`] as const);
const FONT_WEIGHT_VARS = FONT_WEIGHT_KEYS.map((k) => [k, `--strata-font-weight-${k}`] as const);
const DENSITY_VARS = DENSITY_KEYS.map((k) => [k, `--strata-${kebab(k)}`] as const);

const px = (n: number): string => `${n}px`;

/** Colour roles (and the chart palette) for one scheme. */
export function writeColorVars(out: CssVars, theme: Theme, scheme: Scheme): CssVars {
  const roles = theme.schemes[scheme].roles;
  for (const [role, name] of ROLE_VARS) out[name] = roles[role].hex;
  // Chart palette (chart.ts): solved series hexes; grid and axis alias their roles so they follow any override.
  const { chart } = theme.schemes[scheme];
  chart.series.forEach((hex, i) => {
    out[`--strata-chart-${i + 1}`] = hex;
  });
  out['--strata-chart-grid'] = `var(${roleToCssVar(CHART_GRID_ROLE)})`;
  out['--strata-chart-axis'] = `var(${roleToCssVar(CHART_AXIS_ROLE)})`;
  return out;
}

/** Elevation for one scheme. */
export function writeShadowVars(out: CssVars, theme: Theme, scheme: Scheme): CssVars {
  const { shadows } = theme.schemes[scheme];
  out['--strata-shadow-raised'] = shadows.raised;
  out['--strata-shadow-overlay'] = shadows.overlay;
  out['--strata-shadow-highlight'] = shadows.highlight;
  // Decorative edges only (dividers, card and overlay edges). Input borders and focus rings stay ≥ 1px.
  // toCSS halves it on 2× screens; see HAIRLINE_HIDPI.
  out['--strata-hairline'] = '1px';
  // Rim light: the edge colour a surface catches at its top-left, fading along a gradient (see CONVENTIONS "Depth").
  // Built from text.default so it follows the scheme: a whisper in light, clearly visible in dark.
  const dark = scheme === 'dark';
  out['--strata-rim'] = `color-mix(in srgb, var(${roleToCssVar('text.default')}) ${dark ? 18 : 10}%, transparent)`;
  // Brand glow: a soft halo in the primary colour for one hero element per view (active nav, hero card, chart line).
  // Decorative only; never the sole carrier of state.
  // Sheen: a soft diagonal band of light across a raised surface (dark only; on light surfaces white-on-white is
  // invisible, so light gets its depth from shadow). Peak 8% of text.default: text.subtle stays ≥ 6.86:1 on the
  // brightest pixel across the 5 tenants and 1,000 fuzz brands (measured 2026-09-27; see test/exporters.test.ts).
  out['--strata-sheen'] = dark
    ? `linear-gradient(115deg, transparent 6%, color-mix(in srgb, var(${roleToCssVar('text.default')}) 8%, transparent) 20%, transparent 40%)`
    : 'none';
  out['--strata-glow'] = `0 0 0 1px color-mix(in srgb, var(${roleToCssVar('action.primary.bg')}) ${dark ? 40 : 22}%, transparent), 0 12px 40px -12px color-mix(in srgb, var(${roleToCssVar('action.primary.bg')}) ${dark ? 60 : 35}%, transparent)`;
  const { glass } = theme.schemes[scheme];
  out['--strata-glass-opacity'] = String(glass.opacity);
  out['--strata-glass-bg'] = `color-mix(in srgb, var(${roleToCssVar('surface.raised')}) ${Math.round(glass.opacity * 100)}%, transparent)`;
  out['--strata-glass-blur'] = px(glass.blur);
  return out;
}

export function writeSpaceVars(out: CssVars, theme: Theme): CssVars {
  const { space } = theme.foundations;
  for (const [k, name] of SPACE_VARS) out[name] = px(space[k]);
  return out;
}

export function writeRadiusVars(out: CssVars, theme: Theme): CssVars {
  const { radius } = theme.foundations;
  for (const [k, name] of RADIUS_VARS) out[name] = px(radius[k]);
  return out;
}

/** Font stacks, heading tracking and the type scale. */
export function writeTypographyVars(out: CssVars, theme: Theme): CssVars {
  const { typePair } = theme;
  const { fontSize, lineHeight, fontWeight } = theme.foundations;
  for (const [k, name] of FONT_VARS) out[name] = typePair[k];
  out['--strata-font-heading-tracking'] = typePair.headingTracking;
  for (const [k, name] of FONT_SIZE_VARS) out[name] = px(fontSize[k]);
  // CSS-only (DTCG dimensions have no em unit), like the spring easing.
  for (const k of FONT_SIZE_KEYS) out[`--strata-font-tracking-${k}`] = trackingForSize(fontSize[k], typePair.supportsArabic);
  // Small caps (eyebrows, uppercase tags) need open tracking; Arabic has no case and must not be spaced.
  out['--strata-font-tracking-caps'] = typePair.supportsArabic ? '0' : '0.08em';
  // Icon stroke for @strata/icons (ADR-014): one device pixel at 16px.
  out['--strata-icon-stroke'] = '1.5';
  for (const [k, name] of LINE_HEIGHT_VARS) out[name] = String(lineHeight[k]);
  for (const [k, name] of FONT_WEIGHT_VARS) out[name] = String(fontWeight[k]);
  return out;
}

export function writeMotionVars(out: CssVars, theme: Theme): CssVars {
  const { motion } = theme.foundations;
  out['--strata-motion-duration-fast'] = `${motion.durationFast}ms`;
  out['--strata-motion-duration-normal'] = `${motion.durationNormal}ms`;
  out['--strata-motion-duration-slow'] = `${motion.durationSlow}ms`;
  out['--strata-motion-duration-spring'] = `${motion.spring.duration}ms`;
  out['--strata-motion-easing'] = motion.easing;
  out['--strata-motion-easing-out'] = motion.easingOut;
  out['--strata-motion-spring'] = motion.spring.easing;
  return out;
}

export function writeDensityVars(out: CssVars, theme: Theme, density: Density): CssVars {
  const tokens = theme.foundations.density[density];
  for (const [k, name] of DENSITY_VARS) out[name] = px(tokens[k]);
  return out;
}

/** Every contract variable (colour, foundations, elevation, density) with CSS-ready values. Keys include "--". */
export function toCssVariables(theme: Theme, scheme: Scheme, density: Density = theme.input.density): Record<string, string> {
  const out: CssVars = {};
  writeColorVars(out, theme, scheme);
  writeSpaceVars(out, theme);
  writeRadiusVars(out, theme);
  writeTypographyVars(out, theme);
  writeShadowVars(out, theme, scheme);
  writeMotionVars(out, theme);
  writeDensityVars(out, theme, density);
  return out;
}

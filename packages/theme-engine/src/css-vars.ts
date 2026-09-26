/**
 * Theme → CSS custom properties, per the CSS variable contract in types.ts.
 * The Brand Generator spreads toCssVariables() into an inline `style` on the preview
 * container, so it is complete (every contract variable) and allocation-light.
 */
import type { Density, Role, Scheme, Theme } from './types';
import { ROLES, roleToCssVar } from './types';
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

/** Colour roles for one scheme. */
export function writeColorVars(out: CssVars, theme: Theme, scheme: Scheme): CssVars {
  const roles = theme.schemes[scheme].roles;
  for (const [role, name] of ROLE_VARS) out[name] = roles[role].hex;
  return out;
}

/** Elevation for one scheme. */
export function writeShadowVars(out: CssVars, theme: Theme, scheme: Scheme): CssVars {
  const { shadows } = theme.schemes[scheme];
  out['--strata-shadow-raised'] = shadows.raised;
  out['--strata-shadow-overlay'] = shadows.overlay;
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
  for (const [k, name] of LINE_HEIGHT_VARS) out[name] = String(lineHeight[k]);
  for (const [k, name] of FONT_WEIGHT_VARS) out[name] = String(fontWeight[k]);
  return out;
}

export function writeMotionVars(out: CssVars, theme: Theme): CssVars {
  const { motion } = theme.foundations;
  out['--strata-motion-duration-fast'] = `${motion.durationFast}ms`;
  out['--strata-motion-duration-normal'] = `${motion.durationNormal}ms`;
  out['--strata-motion-easing'] = motion.easing;
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

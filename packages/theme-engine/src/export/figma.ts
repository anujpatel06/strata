/**
 * Theme → Figma-variables JSON, one file per collection mode ("<Collection>.<Mode>.tokens.json").
 *
 * Dialect: the older DTCG draft most Figma variable-import plugins still read — colour $value is
 * a hex string, dimensions are plain numbers. The DTCG 2025.10 export lives in dtcg.ts.
 *
 * Collection model (≤3 modes per collection with the three reference tenants):
 *   Brand     one mode per tenant   color/<scheme>/<ramp>/<step>  + role/<scheme>/<role path>
 *                                   (the brand-resolved role layer: the contrast solver's per-brand picks)
 *   Semantic  Light / Dark          color/<role path> → {role.<scheme>.<role path>}
 *                                   identical for every tenant, so switching the Brand mode re-skins
 *   Density   Comfortable / Compact
 *   Shape     one mode per tenant   radius
 *   Type      one mode per tenant   font family / size / weight
 */
import type { Role, Scheme, Theme } from '../types';
import { ROLES } from '../types';
import {
  DENSITY_KEYS,
  FONT_ROLES,
  FONT_SIZE_KEYS,
  FONT_WEIGHT_KEYS,
  RADIUS_KEYS,
  RAMP_NAMES,
  rolePath,
  safeName,
  setPath,
  splitFontStack,
} from './util';

type FigmaColor = { $type: 'color'; $value: string; $description?: string };
type FigmaToken = FigmaColor | { $type: 'number'; $value: number } | { $type: 'string'; $value: string };
type FigmaFile = Record<string, unknown> & { $description: string };

const SCHEMES: readonly Scheme[] = ['light', 'dark'];
const SCHEME_LABEL: Record<Scheme, string> = { light: 'Light', dark: 'Dark' };

/** Shared by every file's root $description. */
const FIGMA_COLLECTIONS_NOTE =
  'Collections → modes: Brand → one mode per tenant (ramps + brand-resolved roles); Semantic → Light / Dark (aliases into Brand role/<scheme>/…, identical for every tenant); ' +
  'Density → Comfortable / Compact; Shape → one mode per tenant; Type → one mode per tenant. ' +
  'With the three reference tenants no collection needs more than 3 modes; a 4th tenant adds a 4th mode to Brand, Shape and Type — check your Figma plan’s mode limit.';

const color = (value: string): FigmaColor => ({ $type: 'color', $value: value });
const num = (n: number): FigmaToken => ({ $type: 'number', $value: n });

/** "Brand.<Name>": raw ramps plus the role layer that aliases into them (or holds the solver's literal). */
function brandFile(theme: Theme, name: string): FigmaFile {
  const messages = new Map(theme.adjustments.map((a) => [a.id, a.message] as const));
  const ramps: Record<string, unknown> = {};
  const roles: Record<string, unknown> = {};
  for (const scheme of SCHEMES) {
    const s = theme.schemes[scheme];
    const group: Record<string, unknown> = {};
    for (const ramp of RAMP_NAMES) {
      const steps: Record<string, FigmaToken> = {};
      s.ramps[ramp].forEach((hex, i) => {
        steps[String(i + 1)] = color(hex);
      });
      group[ramp] = steps;
    }
    ramps[scheme] = group;

    const tree: Record<string, unknown> = {};
    for (const role of ROLES as readonly Role[]) {
      const c = s.roles[role];
      const t = color(c.ref ? `{color.${scheme}.${c.ref}}` : c.hex);
      // Figma shows $description on the variable — surface the solver's explanation there.
      const message = c.adjusted ? messages.get(c.adjusted.adjustmentId) : undefined;
      if (message) t.$description = message;
      setPath(tree, rolePath(role), t);
    }
    roles[scheme] = tree;
  }
  return {
    $description:
      `Figma collection "Brand", mode "${name}". color/<scheme>/<ramp>/<step> are the 12-step ramps; role/<scheme>/… is this brand's resolved role layer ` +
      `(an alias to a ramp step, or the contrast solver's own value — adjusted roles explain why in their description). Import each tenant as another mode of this collection. ` +
      FIGMA_COLLECTIONS_NOTE,
    color: ramps,
    role: roles,
  };
}

/** "Semantic.<Scheme>": brand-independent — every role aliases the Brand collection's role layer. */
function semanticFile(scheme: Scheme): FigmaFile {
  const tree: Record<string, unknown> = {};
  for (const role of ROLES as readonly Role[]) {
    setPath(tree, rolePath(role), color(`{role.${scheme}.${role}}`));
  }
  return {
    $description:
      `Figma collection "Semantic", mode "${SCHEME_LABEL[scheme]}". Semantic colour roles for components; each aliases Brand role/${scheme}/<role path>, ` +
      `so switching the Brand mode re-skins without per-brand semantic files. This file is identical for every tenant — import it once. ` +
      FIGMA_COLLECTIONS_NOTE,
    color: tree,
  };
}

export function toFigmaFiles(theme: Theme): Record<string, Record<string, unknown>> {
  const name = safeName(theme.input.name);
  const f = theme.foundations;

  const radius: Record<string, FigmaToken> = {};
  for (const k of RADIUS_KEYS) radius[k] = num(f.radius[k]);

  const densityFile = (d: 'comfortable' | 'compact', label: string): FigmaFile => {
    const tokens: Record<string, FigmaToken> = {};
    for (const k of DENSITY_KEYS) tokens[k] = num(f.density[d][k]);
    return {
      $description: `Figma collection "Density", mode "${label}". Control, table-row and layout sizes in px. ${FIGMA_COLLECTIONS_NOTE}`,
      density: tokens,
    };
  };

  const family: Record<string, FigmaToken> = {};
  for (const k of FONT_ROLES) family[k] = { $type: 'string', $value: splitFontStack(theme.typePair[k])[0] ?? '' };
  const size: Record<string, FigmaToken> = {};
  for (const k of FONT_SIZE_KEYS) size[k] = num(f.fontSize[k]);
  const weight: Record<string, FigmaToken> = {};
  for (const k of FONT_WEIGHT_KEYS) weight[k] = num(f.fontWeight[k]);

  return {
    [`Brand.${name}.tokens.json`]: brandFile(theme, name),
    'Semantic.Light.tokens.json': semanticFile('light'),
    'Semantic.Dark.tokens.json': semanticFile('dark'),
    [`Shape.${name}.tokens.json`]: {
      $description: `Figma collection "Shape", mode "${name}". Corner radius in px (${theme.input.shape}). ${FIGMA_COLLECTIONS_NOTE}`,
      radius,
    },
    'Density.Comfortable.tokens.json': densityFile('comfortable', 'Comfortable'),
    'Density.Compact.tokens.json': densityFile('compact', 'Compact'),
    [`Type.${name}.tokens.json`]: {
      $description: `Figma collection "Type", mode "${name}". ${theme.typePair.label}; sizes in px. Heading tracking ${theme.typePair.headingTracking}. ${FIGMA_COLLECTIONS_NOTE}`,
      font: { family, size, weight },
    },
  };
}

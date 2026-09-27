/**
 * Theme → Figma-variables JSON, one file per collection mode ("<Collection>.<Mode>.tokens.json").
 *
 * Dialect: the older DTCG draft most Figma variable-import plugins still read — colour $value is
 * a hex string, dimensions are plain numbers. The DTCG 2025.10 export lives in dtcg.ts.
 *
 * Collection model (Brand, Shape and Type get one mode per tenant — 5 with the current tenants; Figma Professional allows 10):
 *   Brand     one mode per tenant   color/<scheme>/<ramp>/<step>  + role/<scheme>/<role path>
 *                                   (the brand-resolved role layer: the contrast solver's per-brand picks)
 *   Semantic  Light / Dark          color/<role path> → {role.<scheme>.<role path>}
 *                                   identical for every tenant, so switching the Brand mode re-skins
 *   Density   Comfortable / Compact
 *   Shape     one mode per tenant   radius
 *   Type      one mode per tenant   font family / size / weight
 *
 * That layout needs a paid Figma plan: Starter (free) allows one mode per collection. So
 * toFigmaFiles(theme, { modes: 'single' }) emits a Starter layout instead (ADR-010): every collection has
 * exactly one mode, "Value", and each combination is its own collection —
 *   "<Brand> · Light" / "<Brand> · Dark"   color/<role path> (resolved hex, no aliases) + ramp/<ramp>/<step>
 *   "<Brand> · Size"                       radius + font family/size/weight + the tenant's default density
 *   "<Brand> · Size <other density>"       the other density only
 * No cross-collection aliases: an alias needs a matching mode on the other side, and with one mode per
 * collection there is nothing to switch, so values are resolved hex. Variable names are the same in every
 * brand's collections, so swapping a library (or collection) re-skins a frame.
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
  'Brand, Shape and Type get one mode per tenant (5 today), so this layout needs a plan with at least that many modes per collection (Professional allows 10). On the Starter plan (one mode per collection) use the single-mode export instead.';

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

export type FigmaModes = 'multi' | 'single';
export interface FigmaExportOptions {
  /**
   * 'multi' (default): the mode-based collections above — needs Figma Professional or higher.
   * 'single': one mode ("Value") per collection, for Figma Starter (free), which allows one mode per collection.
   */
  modes?: FigmaModes;
}

export function toFigmaFiles(theme: Theme, options: FigmaExportOptions = {}): Record<string, Record<string, unknown>> {
  if (options.modes === 'single') return toFigmaStarterFiles(theme);
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

/* ------------------------------------------------------------------ Starter (single-mode) layout */

/** The one mode every Starter collection has. */
export const FIGMA_STARTER_MODE = 'Value';

const STARTER_NOTE =
  'Starter plan: one mode per collection, so each brand × scheme is its own collection. Switch brands by swapping libraries or collections, not modes. ' +
  'Collections: "<Brand> · Light" and "<Brand> · Dark" (colour roles as hex, plus that scheme’s ramps), "<Brand> · Size" (radius, type and the brand’s default density), ' +
  '"<Brand> · Size <other density>" (the other density only). Variable names match across brands. Import only the collections you need.';

const DENSITY_LABEL: Record<'comfortable' | 'compact', string> = { comfortable: 'Comfortable', compact: 'Compact' };

const starterFileName = (collection: string): string => `${collection}.${FIGMA_STARTER_MODE}.tokens.json`;

function toFigmaStarterFiles(theme: Theme): Record<string, Record<string, unknown>> {
  const name = safeName(theme.input.name);
  const f = theme.foundations;
  const messages = new Map(theme.adjustments.map((a) => [a.id, a.message] as const));
  const out: Record<string, Record<string, unknown>> = {};

  for (const scheme of SCHEMES) {
    const s = theme.schemes[scheme];
    const collection = `${name} · ${SCHEME_LABEL[scheme]}`;
    // Roles: the resolved hex, never an alias — there is no other mode-bearing collection to point into.
    const roles: Record<string, unknown> = {};
    for (const role of ROLES as readonly Role[]) {
      const c = s.roles[role];
      const t = color(c.hex);
      const message = c.adjusted ? messages.get(c.adjusted.adjustmentId) : undefined;
      if (message) t.$description = message;
      setPath(roles, rolePath(role), t);
    }
    const ramps: Record<string, unknown> = {};
    for (const ramp of RAMP_NAMES) {
      const steps: Record<string, FigmaToken> = {};
      s.ramps[ramp].forEach((hex, i) => {
        steps[String(i + 1)] = color(hex);
      });
      ramps[ramp] = steps;
    }
    out[starterFileName(collection)] = {
      $description:
        `Figma collection "${collection}", mode "${FIGMA_STARTER_MODE}". color/… are ${name}’s ${scheme} colour roles as hex (adjusted roles explain why in their description); ` +
        `ramp/<ramp>/<step> are the 12-step ${scheme} ramps. ${STARTER_NOTE}`,
      color: roles,
      ramp: ramps,
    };
  }

  const radius: Record<string, FigmaToken> = {};
  for (const k of RADIUS_KEYS) radius[k] = num(f.radius[k]);
  const family: Record<string, FigmaToken> = {};
  for (const k of FONT_ROLES) family[k] = { $type: 'string', $value: splitFontStack(theme.typePair[k])[0] ?? '' };
  const size: Record<string, FigmaToken> = {};
  for (const k of FONT_SIZE_KEYS) size[k] = num(f.fontSize[k]);
  const weight: Record<string, FigmaToken> = {};
  for (const k of FONT_WEIGHT_KEYS) weight[k] = num(f.fontWeight[k]);
  const densityTokens = (d: 'comfortable' | 'compact'): Record<string, FigmaToken> => {
    const tokens: Record<string, FigmaToken> = {};
    for (const k of DENSITY_KEYS) tokens[k] = num(f.density[d][k]);
    return tokens;
  };

  const base = theme.input.density;
  const other = base === 'compact' ? 'comfortable' : 'compact';
  const sizeCollection = `${name} · Size`;
  const otherCollection = `${name} · Size ${other}`;
  out[starterFileName(sizeCollection)] = {
    $description:
      `Figma collection "${sizeCollection}", mode "${FIGMA_STARTER_MODE}". Radius in px (${theme.input.shape}); ${theme.typePair.label}, sizes in px, heading tracking ${theme.typePair.headingTracking}; ` +
      `density/… is ${name}’s default density (${DENSITY_LABEL[base]}) — the other one is in "${otherCollection}". ${STARTER_NOTE}`,
    radius,
    font: { family, size, weight },
    density: densityTokens(base),
  };
  out[starterFileName(otherCollection)] = {
    $description:
      `Figma collection "${otherCollection}", mode "${FIGMA_STARTER_MODE}". The ${DENSITY_LABEL[other]} density only (px), with the same density/… names as "${sizeCollection}", ` +
      `so swapping collections changes density. ${STARTER_NOTE}`,
    density: densityTokens(other),
  };
  return out;
}

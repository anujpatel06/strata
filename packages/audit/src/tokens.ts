/**
 * Token lookup. Themes are generated from tenants/<id>/brand.json by the theme engine, the same way
 * packages/tokens/scripts/build.ts does it, so the auditor needs no build step.
 */
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ROLES, generateTheme, roleToCssVar } from '@syntara/theme-engine';
import type { BrandInput, Theme } from '@syntara/theme-engine';
import { deltaE, parseColor, type ParsedColor } from './color';
import type { TokenMatch } from './types';

export type TokenCategory = 'color' | 'space' | 'radius' | 'font-size' | 'font-weight';
export type Scheme = 'light' | 'dark';

export interface FindTokenOptions {
  tenant?: string;
  scheme?: Scheme;
  /** "font" is also accepted: a bare number is matched as a weight, a length as a size. */
  category?: TokenCategory | 'font';
  /**
   * The CSS property the value sits in, e.g. "background-color". Only used to order tokens that are equally
   * near, so a text colour is offered for `color` and a surface for `background`.
   */
  property?: string;
}

interface ColorToken {
  token: string;
  cssVar: string;
  value: string;
  lab: ParsedColor;
}
interface NumberToken {
  token: string;
  cssVar: string;
  value: string;
  n: number;
}
export interface TenantTokens {
  color: ColorToken[];
  space: NumberToken[];
  radius: NumberToken[];
  'font-size': NumberToken[];
  'font-weight': NumberToken[];
}

const here = dirname(fileURLToPath(import.meta.url));
/** packages/audit/src → the repo root. SYNTARA_TENANTS_DIR overrides the tenants folder. */
export const REPO_ROOT = resolve(here, '../../..');
export const tenantsDir = (): string => process.env.SYNTARA_TENANTS_DIR ?? join(REPO_ROOT, 'tenants');

const themes = new Map<string, Theme>();
const tables = new Map<string, TenantTokens>();

export function loadTheme(tenant = 'house'): Theme {
  const cached = themes.get(tenant);
  if (cached) return cached;
  if (!/^[a-z0-9][a-z0-9-]*$/i.test(tenant)) throw new Error(`Invalid tenant id: ${JSON.stringify(tenant)}.`);
  const file = join(tenantsDir(), tenant, 'brand.json');
  if (!existsSync(file)) throw new Error(`Unknown tenant "${tenant}": ${file} does not exist.`);
  const theme = generateTheme(JSON.parse(readFileSync(file, 'utf8')) as BrandInput);
  themes.set(tenant, theme);
  return theme;
}

export function loadTokens(tenant = 'house', scheme: Scheme = 'light'): TenantTokens {
  const key = `${tenant}/${scheme}`;
  const cached = tables.get(key);
  if (cached) return cached;
  const theme = loadTheme(tenant);
  const roles = theme.schemes[scheme].roles;
  const { space, radius, fontSize, fontWeight } = theme.foundations;
  // Names follow the MCP server (packages/mcp/src/tokens.ts): --syntara-font-size-md is font.size.md.
  const numbers = (group: string, record: Record<string, number>, unit: string): NumberToken[] =>
    Object.entries(record).map(([k, n]) => ({ token: `${group.replace('font-', 'font.')}.${k}`, cssVar: `--syntara-${group}-${k}`, value: `${n}${unit}`, n }));
  const table: TenantTokens = {
    color: ROLES.map((role) => {
      const hex = roles[role].hex;
      return { token: `color.${role}`, cssVar: roleToCssVar(role), value: hex, lab: parseColor(hex)! };
    }),
    space: numbers('space', space, 'px'),
    radius: numbers('radius', radius, 'px'),
    'font-size': numbers('font-size', fontSize, 'px'),
    'font-weight': numbers('font-weight', fontWeight, ''),
  };
  tables.set(key, table);
  return table;
}

/** Which part of a role name fits a property. Lower is better; used only to break ties. */
function propertyRank(token: string, property: string | undefined): number {
  if (!property) return 0;
  const p = property.toLowerCase();
  const role = token.slice('color.'.length);
  const leaf = role.split('.').pop() ?? '';
  const isText = role.startsWith('text.') || leaf === 'fg' || leaf === 'onSolid' || leaf === 'text';
  const isBorder = role.startsWith('border.') || leaf === 'border' || role === 'focus.ring';
  const isFill = role.startsWith('surface.') || leaf === 'bg' || leaf === 'solid' || leaf === 'hover' || leaf === 'pressed' || leaf === 'subtle';
  if (/^(color|fill|stroke|caret-color|text-decoration|-webkit-text-fill-color)/.test(p)) return isText ? 0 : 1;
  if (/^(border|outline|column-rule)/.test(p)) return isBorder ? 0 : 1;
  if (/^background/.test(p)) return isFill ? 0 : 1;
  return 0;
}

const round = (n: number, places: number): number => Math.round(n * 10 ** places) / 10 ** places;

/** px for a length written in px or rem (16px to the rem). Null for anything else. */
export function toPx(text: string): number | null {
  const m = /^([+-]?(?:\d+\.?\d*|\.\d+))(px|rem)?$/i.exec(text.trim());
  if (!m) return null;
  const n = Number(m[1]);
  const unit = (m[2] ?? '').toLowerCase();
  if (unit === 'rem') return n * 16;
  if (unit === 'px' || n === 0) return n;
  return null;
}

const WEIGHT_KEYWORDS: Readonly<Record<string, number>> = { normal: 400, bold: 700 };

function guessCategory(value: string): TokenCategory | null {
  if (parseColor(value)) return 'color';
  if (/^\d+$/.test(value) && Number(value) >= 1 && Number(value) <= 1000) return 'font-weight';
  if (value in WEIGHT_KEYWORDS) return 'font-weight';
  if (toPx(value) !== null) return 'space';
  return null;
}

/**
 * The nearest token for a raw value. Returns null when the value can't be read (a var(), a keyword, a unit
 * other than px or rem). With no category, a colour is matched against colour roles, a bare number from 1 to
 * 1000 against font weights, and a length against the space scale.
 */
export function findToken(value: string, options: FindTokenOptions = {}): TokenMatch | null {
  const text = value.trim().toLowerCase();
  let category: string | null = options.category ?? guessCategory(text);
  // "font" is the MCP server's category for both; the value says which one is meant.
  if (category === 'font') category = /^\d+$/.test(text) || text in WEIGHT_KEYWORDS ? 'font-weight' : 'font-size';
  if (!category || !['color', 'space', 'radius', 'font-size', 'font-weight'].includes(category)) return null;
  const tokens = loadTokens(options.tenant ?? 'house', options.scheme ?? 'light');

  if (category === 'color') {
    const color = parseColor(text);
    if (!color) return null;
    const ranked = tokens.color
      .map((t) => ({ t, d: deltaE(color, t.lab) }))
      .sort((x, y) => x.d - y.d || propertyRank(x.t.token, options.property) - propertyRank(y.t.token, options.property));
    const best = ranked[0]!;
    const ties = ranked.slice(1).filter((r) => Math.abs(r.d - best.d) < 1e-9).map((r) => r.t.token);
    const opaque = color.alpha >= 1;
    const exact = best.d < 1e-9 && opaque;
    const distance = round(best.d, 2);
    const alphaNote = opaque ? '' : `, and the value is ${round(color.alpha * 100, 1)}% opaque, which a role is not`;
    return {
      token: best.t.token,
      cssVar: best.t.cssVar,
      value: best.t.value,
      distance,
      exact,
      reason: `${value.trim()} → ${best.t.token} (ΔE ${distance}${alphaNote})`,
      ...(ties.length > 0 ? { alternatives: ties } : {}),
    };
  }

  const n = category === 'font-weight' ? (WEIGHT_KEYWORDS[text] ?? (/^\d+(\.\d+)?$/.test(text) ? Number(text) : null)) : toPx(text);
  if (n === null) return null;
  const magnitude = Math.abs(n);
  const ranked = tokens[category as Exclude<TokenCategory, 'color'>].map((t) => ({ t, d: Math.abs(t.n - magnitude) })).sort((x, y) => x.d - y.d);
  const best = ranked[0];
  if (!best) return null;
  const ties = ranked.slice(1).filter((r) => r.d === best.d).map((r) => r.t.token);
  const distance = round(best.d, 3);
  const unit = category === 'font-weight' ? '' : 'px';
  return {
    token: best.t.token,
    cssVar: best.t.cssVar,
    value: best.t.value,
    distance,
    exact: best.d === 0,
    reason: `${value.trim()} → ${best.t.token} (${best.d === 0 ? 'exact' : `off by ${distance}${unit}`})`,
    ...(ties.length > 0 ? { alternatives: ties } : {}),
  };
}

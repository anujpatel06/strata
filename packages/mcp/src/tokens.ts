/**
 * Tokens, resolved by running the theme engine on tenants/<id>/brand.json. This is the same call
 * packages/tokens/scripts/build.ts makes, so the values match the built CSS without needing a build.
 *
 * The CSS variable is the contract (packages/theme-engine/src/types.ts). The dotted token name is derived
 * from it with the rules in `tokenName`.
 */
import { existsSync, readdirSync } from 'node:fs';
import { ROLES, generateTheme, roleToCssVar, toCssVariables } from '@strata/theme-engine';
import type { BrandInput } from '@strata/theme-engine';
import { cachedFile } from './cache';
import { ToolError, inside, isSafeName, SAFE_NAME_MESSAGE } from './root';

export type Scheme = 'light' | 'dark';

export const TOKEN_CATEGORIES = [
  'color',
  'chart',
  'space',
  'radius',
  'font',
  'line-height',
  'shadow',
  'glass',
  'effect',
  'motion',
  'density',
  'icon',
] as const;
export type TokenCategory = (typeof TOKEN_CATEGORIES)[number];

export interface Token {
  token: string;
  cssVar: string;
  value: string;
}

const PREFIX = '--strata-';

const ROLE_BY_VAR = new Map<string, string>(ROLES.map((role) => [roleToCssVar(role), `color.${role}`]));

/** CSS variable stem → dotted prefix. Longest first. */
const GROUPS: ReadonlyArray<readonly [stem: string, dotted: string, category: TokenCategory]> = [
  ['font-heading-tracking', 'font.heading.tracking', 'font'],
  ['font-tracking-', 'font.tracking.', 'font'],
  ['font-weight-', 'font.weight.', 'font'],
  ['font-size-', 'font.size.', 'font'],
  ['font-', 'font.', 'font'],
  ['line-height-', 'line-height.', 'line-height'],
  ['motion-duration-', 'motion.duration.', 'motion'],
  ['motion-', 'motion.', 'motion'],
  ['space-', 'space.', 'space'],
  ['radius-', 'radius.', 'radius'],
  ['shadow-', 'shadow.', 'shadow'],
  ['glass-', 'glass.', 'glass'],
  ['chart-', 'chart.', 'chart'],
  ['icon-', 'icon-', 'icon'],
];

const EFFECTS = new Set(['hairline', 'rim', 'glow', 'sheen']);

/** `--strata-font-size-md` → `font.size.md` in category `font`. Names with no group are density tokens. */
export function tokenName(cssVar: string): { token: string; category: TokenCategory } {
  const role = ROLE_BY_VAR.get(cssVar);
  if (role) return { token: role, category: 'color' };
  const stem = cssVar.startsWith(PREFIX) ? cssVar.slice(PREFIX.length) : cssVar;
  for (const [prefix, dotted, category] of GROUPS) {
    if (stem.startsWith(prefix)) return { token: dotted + stem.slice(prefix.length), category };
  }
  if (EFFECTS.has(stem)) return { token: stem, category: 'effect' };
  return { token: stem, category: 'density' };
}

export function tenantIds(root: string): string[] {
  const dir = inside(root, 'tenants');
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true })
    .filter((d) => d.isDirectory() && isSafeName(d.name) && existsSync(inside(root, 'tenants', d.name, 'brand.json')))
    .map((d) => d.name)
    .sort();
}

/** Throws a ToolError that lists the tenants when `tenant` isn't one. */
export function requireTenant(root: string, tenant: string): string {
  if (!isSafeName(tenant)) throw new ToolError(`"${tenant}" is not a tenant id. ${SAFE_NAME_MESSAGE}`);
  const ids = tenantIds(root);
  if (!ids.includes(tenant)) {
    throw new ToolError(`No tenant named "${tenant}". Use one of the tenants listed.`, { tenants: ids });
  }
  return tenant;
}

type ByCategory = Record<TokenCategory, Token[]>;

function resolve(root: string, tenant: string, scheme: Scheme): ByCategory {
  const path = inside(root, 'tenants', tenant, 'brand.json');
  return cachedFile(`tokens:${scheme}`, path, (text) => {
    const theme = generateTheme(JSON.parse(text) as BrandInput);
    const out = Object.fromEntries(TOKEN_CATEGORIES.map((c) => [c, [] as Token[]])) as ByCategory;
    for (const [cssVar, value] of Object.entries(toCssVariables(theme, scheme))) {
      const { token, category } = tokenName(cssVar);
      out[category].push({ token, cssVar, value });
    }
    return out;
  });
}

export function getTokens(
  root: string,
  args: { category?: TokenCategory; tenant?: string; scheme?: Scheme },
): Record<string, unknown> {
  const tenant = requireTenant(root, args.tenant ?? 'house');
  const scheme = args.scheme ?? 'light';
  const all = resolve(root, tenant, scheme);
  if (args.category === undefined) {
    const categories = Object.fromEntries(TOKEN_CATEGORIES.map((c) => [c, all[c].length]));
    return {
      tenant,
      scheme,
      total: Object.values(all).reduce((n, list) => n + list.length, 0),
      categories,
      hint: 'Call get_tokens again with a category to get its tokens.',
    };
  }
  return { tenant, scheme, category: args.category, tokens: all[args.category] };
}

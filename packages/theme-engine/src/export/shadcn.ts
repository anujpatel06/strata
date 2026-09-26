/**
 * Theme → shadcn/ui CSS variables (the "shadcn bridge").
 *
 * Any Strata theme becomes a drop-in palette for an existing shadcn project: the :root / .dark blocks
 * in globals.css, or a `registry:theme` item's `cssVars`. Every shadcn variable is mapped to a Strata
 * semantic role, so the pairs shadcn draws together (foreground on background, primary-foreground on
 * primary, muted-foreground on muted …) inherit the contrast guarantees the solver already checked.
 *
 * Values are `oklch(L C H)` — shadcn's own format since Tailwind v4 — computed from the final 8-bit hex
 * with the engine's colour maths, rounded to 4 decimals (L, C) and 3 (H). Hue is 0 for greys.
 */
import { hexToOklch } from '../color';
import type { Role, Scheme, Theme } from '../types';
import { ENGINE_NAME, ENGINE_VERSION, safeName } from './util';

/** shadcn variable (without "--") → Strata role. Order = output order. */
export const SHADCN_ROLE_MAP: ReadonlyArray<readonly [variable: string, role: Role]> = [
  ['background', 'surface.canvas'],
  ['foreground', 'text.default'],
  ['card', 'surface.raised'],
  ['card-foreground', 'text.default'],
  ['popover', 'surface.raised'],
  ['popover-foreground', 'text.default'],
  ['primary', 'action.primary.bg'],
  ['primary-foreground', 'action.primary.fg'],
  ['secondary', 'action.secondary.bg'],
  ['secondary-foreground', 'action.secondary.fg'],
  ['muted', 'surface.sunken'],
  ['muted-foreground', 'text.subtle'],
  ['accent', 'surface.selected'],
  ['accent-foreground', 'text.default'],
  ['destructive', 'feedback.danger.solid'],
  // Dropped from shadcn's Tailwind v4 themes but still read by older components (v3-era Button, Toast).
  ['destructive-foreground', 'feedback.danger.onSolid'],
  ['border', 'border.default'],
  ['input', 'border.strong'],
  ['ring', 'focus.ring'],
  ['chart-1', 'action.primary.bg'],
  ['chart-2', 'accent.bg'],
  ['chart-3', 'feedback.info.solid'],
  ['chart-4', 'feedback.success.solid'],
  ['chart-5', 'feedback.warning.solid'],
  ['sidebar', 'surface.default'],
  ['sidebar-foreground', 'text.default'],
  ['sidebar-primary', 'action.primary.bg'],
  ['sidebar-primary-foreground', 'action.primary.fg'],
  ['sidebar-accent', 'surface.selected'],
  ['sidebar-accent-foreground', 'text.default'],
  ['sidebar-border', 'border.subtle'],
  ['sidebar-ring', 'focus.ring'],
];

/**
 * Foreground/background pairs shadcn components draw together, with the WCAG ratio each needs.
 * Every one is backed by a check in contrast-pairs.json, so they pass by construction.
 */
export const SHADCN_CONTRAST_PAIRS: ReadonlyArray<{ fg: string; bg: string; required: number }> = [
  { fg: 'foreground', bg: 'background', required: 4.5 },
  { fg: 'card-foreground', bg: 'card', required: 4.5 },
  { fg: 'popover-foreground', bg: 'popover', required: 4.5 },
  { fg: 'primary-foreground', bg: 'primary', required: 4.5 },
  { fg: 'secondary-foreground', bg: 'secondary', required: 4.5 },
  { fg: 'muted-foreground', bg: 'muted', required: 4.5 },
  { fg: 'muted-foreground', bg: 'background', required: 4.5 },
  { fg: 'muted-foreground', bg: 'card', required: 4.5 },
  { fg: 'accent-foreground', bg: 'accent', required: 4.5 },
  { fg: 'destructive-foreground', bg: 'destructive', required: 4.5 },
  { fg: 'sidebar-foreground', bg: 'sidebar', required: 4.5 },
  { fg: 'sidebar-primary-foreground', bg: 'sidebar-primary', required: 4.5 },
  { fg: 'sidebar-accent-foreground', bg: 'sidebar-accent', required: 4.5 },
  { fg: 'ring', bg: 'background', required: 3 },
  { fg: 'input', bg: 'background', required: 3 },
];

export interface ShadcnCssVars {
  /** `:root` — every colour variable plus `radius`. Keys have no leading "--" (shadcn registry `cssVars` format). */
  light: Record<string, string>;
  /** `.dark` — every colour variable. */
  dark: Record<string, string>;
  /** Tailwind v4 `@theme` additions. Font stacks only when `fonts: true`. */
  theme: Record<string, string>;
}

export interface ToShadcnOptions {
  /**
   * Also set `font-sans` / `font-mono` / `font-heading` to the brand's type pair (in `theme`).
   * Off by default: a palette shouldn't silently replace a project's fonts (e.g. Geist) with families it
   * hasn't loaded. Load them with googleFontsHref(theme.typePair) if you turn this on.
   */
  fonts?: boolean;
}

/** Rounds to `dp` decimals and prints without trailing zeros or exponent notation. */
function num(n: number, dp: number): string {
  const r = Number(n.toFixed(dp));
  return Object.is(r, -0) ? '0' : String(r);
}

/** Lowercase #rrggbb → "oklch(L C H)". L, C at 4 decimals, H at 3; H is 0 when C rounds to 0. */
export function hexToOklchString(hex: string): string {
  const { l, c, h } = hexToOklch(hex);
  const cs = num(c, 4);
  if (cs === '0') return `oklch(${num(l, 4)} 0 0)`;
  let hs = num(h, 3);
  if (hs === '360') hs = '0';
  return `oklch(${num(l, 4)} ${cs} ${hs})`;
}

/** px → rem at 16px/rem. Pill radii (≥ 9999px) become 1rem, shadcn's largest sensible base radius. */
export function radiusRem(px: number): string {
  return px >= 9999 ? '1rem' : `${num(px / 16, 4)}rem`;
}

function colours(theme: Theme, scheme: Scheme): Record<string, string> {
  const roles = theme.schemes[scheme].roles;
  const out: Record<string, string> = {};
  for (const [name, role] of SHADCN_ROLE_MAP) out[name] = hexToOklchString(roles[role].hex);
  return out;
}

/** Strata theme → shadcn `cssVars` ({ light, dark, theme }), ready for a `registry:theme` item. */
export function toShadcnCssVars(theme: Theme, opts: ToShadcnOptions = {}): ShadcnCssVars {
  const light = { radius: radiusRem(theme.foundations.radius.field), ...colours(theme, 'light') };
  const dark = colours(theme, 'dark');
  const themeVars: Record<string, string> = {};
  if (opts.fonts) {
    themeVars['font-sans'] = theme.typePair.body;
    themeVars['font-heading'] = theme.typePair.heading;
    themeVars['font-mono'] = theme.typePair.mono;
  }
  return { light, dark, theme: themeVars };
}

function block(selector: string, vars: Record<string, string>): string {
  const lines = Object.entries(vars).map(([k, v]) => `  --${k}: ${v};`);
  return `${selector} {\n${lines.join('\n')}\n}`;
}

/** Strata theme → the `:root { … }` and `.dark { … }` blocks of a shadcn globals.css. */
export function toShadcnCSS(theme: Theme, opts: ToShadcnOptions = {}): string {
  const vars = toShadcnCssVars(theme, opts);
  const name = safeName(theme.input.name);
  const parts = [
    `/* Strata theme "${name}" as shadcn/ui variables — generated by ${ENGINE_NAME} ${ENGINE_VERSION}.\n` +
      `   Replace the :root and .dark blocks in your globals.css.\n` +
      `   WCAG 2.2 AA by construction: every --*-foreground on its own surface, --muted-foreground on --background/--card,\n` +
      `   --ring and --input on --background. Not covered: --primary or --destructive used as a text colour, chart colours. */`,
    block(':root', vars.light),
    block('.dark', vars.dark),
  ];
  if (Object.keys(vars.theme).length) parts.push(block('@theme inline', vars.theme));
  return parts.join('\n\n') + '\n';
}

/**
 * Shared helpers for the exporters (css-vars.ts, export/*).
 * Deliberately free of engine runtime code: exporters only need the Theme shape.
 */
import type { DensityTokens, Foundations, RampName, Role } from '../types';

export const ENGINE_NAME = '@strata/theme-engine';
export const ENGINE_VERSION = '0.1.0';
export const GENERATOR_ID = `${ENGINE_NAME}@${ENGINE_VERSION}`;

/** Ramp order used by every exporter, so outputs are deterministic. */
export const RAMP_NAMES = [
  'primary',
  'accent',
  'neutral',
  'success',
  'warning',
  'danger',
  'info',
] as const satisfies readonly RampName[];

export const SPACE_KEYS = ['0', '1', '2', '3', '4', '5', '6', '8', '10', '12', '16'] as const satisfies readonly (keyof Foundations['space'])[];
export const RADIUS_KEYS = ['button', 'field', 'container', 'badge', 'pill'] as const satisfies readonly (keyof Foundations['radius'])[];
export const FONT_SIZE_KEYS = ['xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl'] as const satisfies readonly (keyof Foundations['fontSize'])[];
export const LINE_HEIGHT_KEYS = ['tight', 'snug', 'normal'] as const satisfies readonly (keyof Foundations['lineHeight'])[];
export const FONT_WEIGHT_KEYS = ['regular', 'medium', 'semibold', 'bold'] as const satisfies readonly (keyof Foundations['fontWeight'])[];
export const DENSITY_KEYS = [
  'controlHeight',
  'controlPaddingInline',
  'tableRowHeight',
  'cardInset',
  'sectionGap',
  'fieldGap',
] as const satisfies readonly (keyof DensityTokens)[];
export const FONT_ROLES = ['heading', 'body', 'mono'] as const;

/** camelCase → kebab-case ("controlPaddingInline" → "control-padding-inline"). */
export function kebab(s: string): string {
  return s.replace(/[A-Z]/g, (m) => '-' + m.toLowerCase());
}

/** "surface.canvas" → ["surface", "canvas"]. camelCase segments are kept. */
export function rolePath(role: Role): string[] {
  return role.split('.');
}

/** Sets obj[a][b][c] = value, creating plain-object groups on the way. */
export function setPath(obj: Record<string, unknown>, path: readonly string[], value: unknown): void {
  let node = obj;
  for (let i = 0; i < path.length - 1; i++) {
    const key = path[i]!;
    let next = node[key];
    if (next === undefined) {
      next = {};
      node[key] = next;
    }
    node = next as Record<string, unknown>;
  }
  node[path[path.length - 1]!] = value;
}

/** Splits on `sep` outside (), [] and quotes. */
export function splitTopLevel(input: string, sep: string): string[] {
  const out: string[] = [];
  let depth = 0;
  let quote: string | null = null;
  let start = 0;
  for (let i = 0; i < input.length; i++) {
    const ch = input[i]!;
    if (quote) {
      if (ch === quote) quote = null;
    } else if (ch === '"' || ch === "'") {
      quote = ch;
    } else if (ch === '(' || ch === '[') {
      depth++;
    } else if (ch === ')' || ch === ']') {
      depth--;
    } else if (ch === sep && depth === 0) {
      out.push(input.slice(start, i));
      start = i + 1;
    }
  }
  out.push(input.slice(start));
  return out.map((s) => s.trim()).filter((s) => s.length > 0);
}

/** CSS font-family stack → family names without quotes. */
export function splitFontStack(stack: string): string[] {
  return splitTopLevel(stack, ',').map((f) => f.replace(/^(["'])(.*)\1$/, '$2').trim());
}

/* ---------------------------------------------------------------- colour */

export interface Rgba {
  /** 0–255 */
  r: number;
  g: number;
  b: number;
  /** 0–1 */
  a: number;
}

const round4 = (n: number): number => Math.round(n * 10000) / 10000;

/** "#rgb" / "#rrggbb" / "#rrggbbaa" → 8-bit channels. Throws on anything else. */
export function parseHex(hex: string): Rgba {
  let h = hex.trim().replace(/^#/, '').toLowerCase();
  if (!/^([0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/.test(h)) {
    throw new Error(`Invalid hex colour: "${hex}"`);
  }
  if (h.length <= 4) h = [...h].map((c) => c + c).join('');
  const n = (i: number) => parseInt(h.slice(i, i + 2), 16);
  return { r: n(0), g: n(2), b: n(4), a: h.length === 8 ? round4(n(6) / 255) : 1 };
}

export function toHex6({ r, g, b }: Rgba): string {
  const c = (v: number) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0');
  return `#${c(r)}${c(g)}${c(b)}`;
}

/** Parses the colour formats the engine emits in shadows: hex, rgb()/rgba() (modern or legacy syntax), transparent/black/white. */
export function parseCssColor(input: string): Rgba {
  const s = input.trim().toLowerCase();
  if (s.startsWith('#')) return parseHex(s);
  if (s === 'transparent') return { r: 0, g: 0, b: 0, a: 0 };
  if (s === 'black') return { r: 0, g: 0, b: 0, a: 1 };
  if (s === 'white') return { r: 255, g: 255, b: 255, a: 1 };
  const m = /^rgba?\(([^)]*)\)$/.exec(s);
  if (!m) throw new Error(`Unsupported colour in shadow: "${input}" (expected hex or rgb())`);
  const parts = m[1]!.split(/[\s,/]+/).filter(Boolean);
  if (parts.length < 3 || parts.length > 4) throw new Error(`Malformed rgb() colour: "${input}"`);
  const channel = (p: string) => (p.endsWith('%') ? (parseFloat(p) / 100) * 255 : parseFloat(p));
  const alpha = (p: string | undefined) => (p === undefined ? 1 : p.endsWith('%') ? parseFloat(p) / 100 : parseFloat(p));
  const out = { r: channel(parts[0]!), g: channel(parts[1]!), b: channel(parts[2]!), a: alpha(parts[3]) };
  if (![out.r, out.g, out.b, out.a].every(Number.isFinite)) throw new Error(`Malformed rgb() colour: "${input}"`);
  return out;
}

/** DTCG 2025.10 colour value. `alpha` is omitted when opaque (spec default is 1). */
export interface DtcgColorValue {
  colorSpace: 'srgb';
  components: [number, number, number];
  alpha?: number;
  hex: string;
}

export function dtcgColor(c: Rgba | string): DtcgColorValue {
  const rgba = typeof c === 'string' ? parseCssColor(c) : c;
  const value: DtcgColorValue = {
    colorSpace: 'srgb',
    components: [round4(rgba.r / 255), round4(rgba.g / 255), round4(rgba.b / 255)],
    hex: toHex6(rgba),
  };
  if (rgba.a !== 1) value.alpha = round4(rgba.a);
  return value;
}

/** Local hex → sRGB components (0–1, 4 decimals). */
export function hexToSrgbComponents(hex: string): [number, number, number] {
  return dtcgColor(parseHex(hex)).components;
}

/* ---------------------------------------------------------------- dimensions, motion, shadows */

export interface DtcgDimension {
  value: number;
  unit: 'px' | 'rem';
}

export const px = (value: number): DtcgDimension => ({ value, unit: 'px' });

function parseLength(token: string): DtcgDimension {
  const m = /^(-?(?:\d+\.?\d*|\.\d+))(px|rem)?$/.exec(token);
  if (!m) throw new Error(`Unsupported shadow length: "${token}" (expected px, rem or 0)`);
  const value = parseFloat(m[1]!);
  if (!m[2] && value !== 0) throw new Error(`Unitless non-zero shadow length: "${token}"`);
  return { value, unit: (m[2] as 'px' | 'rem' | undefined) ?? 'px' };
}

export interface DtcgShadowLayer {
  color: DtcgColorValue;
  offsetX: DtcgDimension;
  offsetY: DtcgDimension;
  blur: DtcgDimension;
  spread: DtcgDimension;
  inset?: boolean;
}

/**
 * CSS box-shadow → DTCG shadow $value. One layer → object; several → array.
 * "none" becomes a single fully transparent zero layer (DTCG has no "none").
 */
export function parseShadow(css: string): DtcgShadowLayer | DtcgShadowLayer[] {
  const src = css.trim();
  if (src === '' || src === 'none') {
    return { color: dtcgColor({ r: 0, g: 0, b: 0, a: 0 }), offsetX: px(0), offsetY: px(0), blur: px(0), spread: px(0) };
  }
  const layers = splitTopLevel(src, ',').map((layer): DtcgShadowLayer => {
    const colorMatch = /(rgba?\([^)]*\)|#[0-9a-fA-F]{3,8}\b|\btransparent\b|\bblack\b|\bwhite\b)/.exec(layer);
    if (!colorMatch) throw new Error(`Shadow layer has no colour: "${layer}"`);
    let rest = layer.replace(colorMatch[0], ' ');
    const inset = /\binset\b/.test(rest);
    rest = rest.replace(/\binset\b/, ' ');
    const lengths = rest.split(/\s+/).filter(Boolean).map(parseLength);
    if (lengths.length < 2 || lengths.length > 4) throw new Error(`Shadow layer needs 2–4 lengths: "${layer}"`);
    const out: DtcgShadowLayer = {
      color: dtcgColor(colorMatch[0]),
      offsetX: lengths[0]!,
      offsetY: lengths[1]!,
      blur: lengths[2] ?? px(0),
      spread: lengths[3] ?? px(0),
    };
    if (inset) out.inset = true;
    return out;
  });
  return layers.length === 1 ? layers[0]! : layers;
}

const NAMED_EASINGS: Record<string, [number, number, number, number]> = {
  linear: [0, 0, 1, 1],
  ease: [0.25, 0.1, 0.25, 1],
  'ease-in': [0.42, 0, 1, 1],
  'ease-out': [0, 0, 0.58, 1],
  'ease-in-out': [0.42, 0, 0.58, 1],
};

/** "cubic-bezier(0.2, 0, 0, 1)" or a CSS keyword → DTCG cubicBezier $value. */
export function parseCubicBezier(easing: string): [number, number, number, number] {
  const s = easing.trim().toLowerCase();
  const named = NAMED_EASINGS[s];
  if (named) return [...named];
  const m = /^cubic-bezier\(([^)]*)\)$/.exec(s);
  const nums = m ? m[1]!.split(',').map((n) => parseFloat(n)) : [];
  if (nums.length !== 4 || !nums.every(Number.isFinite)) throw new Error(`Unsupported easing: "${easing}"`);
  return [nums[0]!, nums[1]!, nums[2]!, nums[3]!];
}

/** Keeps a theme name safe inside a CSS comment and a file name. */
export function safeName(name: string): string {
  return name.replace(/[\\/:*?"<>|\n\r]/g, '-').trim() || 'Theme';
}

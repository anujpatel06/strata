/**
 * Reads a CSS colour written as text and turns it into OKLab, so it can be compared with a token.
 * Knows hex (3, 4, 6, 8 digits), rgb()/rgba(), hsl()/hsla(), oklch(), oklab() and the named colours.
 * Anything with var() or calc() inside can't be resolved from one file and returns null.
 */
import { hexToOklch } from '@syntara/theme-engine';

export interface ParsedColor {
  l: number;
  a: number;
  b: number;
  /** 0–1. */
  alpha: number;
}

/** CSS named colours (CSS Color 4), lowercase. */
export const NAMED_COLORS: Readonly<Record<string, string>> = {
  aliceblue: '#f0f8ff', antiquewhite: '#faebd7', aqua: '#00ffff', aquamarine: '#7fffd4', azure: '#f0ffff',
  beige: '#f5f5dc', bisque: '#ffe4c4', black: '#000000', blanchedalmond: '#ffebcd', blue: '#0000ff',
  blueviolet: '#8a2be2', brown: '#a52a2a', burlywood: '#deb887', cadetblue: '#5f9ea0', chartreuse: '#7fff00',
  chocolate: '#d2691e', coral: '#ff7f50', cornflowerblue: '#6495ed', cornsilk: '#fff8dc', crimson: '#dc143c',
  cyan: '#00ffff', darkblue: '#00008b', darkcyan: '#008b8b', darkgoldenrod: '#b8860b', darkgray: '#a9a9a9',
  darkgreen: '#006400', darkgrey: '#a9a9a9', darkkhaki: '#bdb76b', darkmagenta: '#8b008b', darkolivegreen: '#556b2f',
  darkorange: '#ff8c00', darkorchid: '#9932cc', darkred: '#8b0000', darksalmon: '#e9967a', darkseagreen: '#8fbc8f',
  darkslateblue: '#483d8b', darkslategray: '#2f4f4f', darkslategrey: '#2f4f4f', darkturquoise: '#00ced1',
  darkviolet: '#9400d3', deeppink: '#ff1493', deepskyblue: '#00bfff', dimgray: '#696969', dimgrey: '#696969',
  dodgerblue: '#1e90ff', firebrick: '#b22222', floralwhite: '#fffaf0', forestgreen: '#228b22', fuchsia: '#ff00ff',
  gainsboro: '#dcdcdc', ghostwhite: '#f8f8ff', gold: '#ffd700', goldenrod: '#daa520', gray: '#808080',
  green: '#008000', greenyellow: '#adff2f', grey: '#808080', honeydew: '#f0fff0', hotpink: '#ff69b4',
  indianred: '#cd5c5c', indigo: '#4b0082', ivory: '#fffff0', khaki: '#f0e68c', lavender: '#e6e6fa',
  lavenderblush: '#fff0f5', lawngreen: '#7cfc00', lemonchiffon: '#fffacd', lightblue: '#add8e6', lightcoral: '#f08080',
  lightcyan: '#e0ffff', lightgoldenrodyellow: '#fafad2', lightgray: '#d3d3d3', lightgreen: '#90ee90',
  lightgrey: '#d3d3d3', lightpink: '#ffb6c1', lightsalmon: '#ffa07a', lightseagreen: '#20b2aa',
  lightskyblue: '#87cefa', lightslategray: '#778899', lightslategrey: '#778899', lightsteelblue: '#b0c4de',
  lightyellow: '#ffffe0', lime: '#00ff00', limegreen: '#32cd32', linen: '#faf0e6', magenta: '#ff00ff',
  maroon: '#800000', mediumaquamarine: '#66cdaa', mediumblue: '#0000cd', mediumorchid: '#ba55d3',
  mediumpurple: '#9370db', mediumseagreen: '#3cb371', mediumslateblue: '#7b68ee', mediumspringgreen: '#00fa9a',
  mediumturquoise: '#48d1cc', mediumvioletred: '#c71585', midnightblue: '#191970', mintcream: '#f5fffa',
  mistyrose: '#ffe4e1', moccasin: '#ffe4b5', navajowhite: '#ffdead', navy: '#000080', oldlace: '#fdf5e6',
  olive: '#808000', olivedrab: '#6b8e23', orange: '#ffa500', orangered: '#ff4500', orchid: '#da70d6',
  palegoldenrod: '#eee8aa', palegreen: '#98fb98', paleturquoise: '#afeeee', palevioletred: '#db7093',
  papayawhip: '#ffefd5', peachpuff: '#ffdab9', peru: '#cd853f', pink: '#ffc0cb', plum: '#dda0dd',
  powderblue: '#b0e0e6', purple: '#800080', rebeccapurple: '#663399', red: '#ff0000', rosybrown: '#bc8f8f',
  royalblue: '#4169e1', saddlebrown: '#8b4513', salmon: '#fa8072', sandybrown: '#f4a460', seagreen: '#2e8b57',
  seashell: '#fff5ee', sienna: '#a0522d', silver: '#c0c0c0', skyblue: '#87ceeb', slateblue: '#6a5acd',
  slategray: '#708090', slategrey: '#708090', snow: '#fffafa', springgreen: '#00ff7f', steelblue: '#4682b4',
  tan: '#d2b48c', teal: '#008080', thistle: '#d8bfd8', tomato: '#ff6347', turquoise: '#40e0d0', violet: '#ee82ee',
  wheat: '#f5deb3', white: '#ffffff', whitesmoke: '#f5f5f5', yellow: '#ffff00', yellowgreen: '#9acd32',
};

/** Functions that write a colour from raw numbers. color-mix() and light-dark() are not here: their arguments are checked one by one. */
export const COLOR_FUNCTIONS: ReadonlySet<string> = new Set([
  'rgb', 'rgba', 'hsl', 'hsla', 'hwb', 'lab', 'lch', 'oklab', 'oklch', 'color',
]);

/** Keywords that are not raw colours: CONVENTIONS allows them, or they are CSS-wide, or they are the user's system colours. */
export const ALLOWED_COLOR_KEYWORDS: ReadonlySet<string> = new Set([
  'transparent', 'currentcolor', 'inherit', 'initial', 'unset', 'revert', 'revert-layer', 'none',
  // System colours (forced-colors mode). They belong to the user, not to a brand.
  'accentcolor', 'accentcolortext', 'activetext', 'buttonborder', 'buttonface', 'buttontext', 'canvas', 'canvastext',
  'field', 'fieldtext', 'graytext', 'highlight', 'highlighttext', 'linktext', 'mark', 'marktext', 'selecteditem',
  'selecteditemtext', 'visitedtext',
]);

const HEX = /^#([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i;

export function isHexColor(text: string): boolean {
  return HEX.test(text);
}

function fromHex6(hex: string, alpha: number): ParsedColor {
  const { l, c, h } = hexToOklch(hex);
  const rad = (h * Math.PI) / 180;
  return { l, a: c * Math.cos(rad), b: c * Math.sin(rad), alpha };
}

function parseHex(text: string): ParsedColor | null {
  const m = HEX.exec(text);
  if (!m) return null;
  let body = m[1]!.toLowerCase();
  if (body.length <= 4) body = body.replace(/./g, (ch) => ch + ch);
  const alpha = body.length === 8 ? parseInt(body.slice(6, 8), 16) / 255 : 1;
  return fromHex6('#' + body.slice(0, 6), alpha);
}

const hex2 = (n: number): string => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0');

/** "50%" → 0.5 × scale, "0.5" → 0.5. Returns null for anything that isn't a plain number. */
function num(text: string | undefined, percentOf: number): number | null {
  if (text === undefined) return null;
  if (text === 'none') return 0;
  const m = /^([+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?)(%|deg|turn|rad|grad)?$/i.exec(text);
  if (!m) return null;
  const n = Number(m[1]);
  const unit = (m[2] ?? '').toLowerCase();
  if (unit === '%') return (n / 100) * percentOf;
  if (unit === 'turn') return n * 360;
  if (unit === 'rad') return (n * 180) / Math.PI;
  if (unit === 'grad') return n * 0.9;
  return n;
}

function hslToRgb8(h: number, s: number, l: number): [number, number, number] {
  const hue = ((h % 360) + 360) % 360;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number): number => {
    const k = (n + hue / 30) % 12;
    return (l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1))) * 255;
  };
  return [f(0), f(8), f(4)];
}

/** Splits "12 34 56 / 0.5" or "12, 34, 56, 0.5" into channel texts and an alpha text. */
function splitArgs(args: string): { channels: string[]; alpha?: string } {
  const [main = '', slashAlpha] = args.split('/').map((s) => s.trim());
  const channels = main.split(/[\s,]+/).filter(Boolean);
  if (slashAlpha !== undefined) return { channels, alpha: slashAlpha };
  if (channels.length === 4) return { channels: channels.slice(0, 3), alpha: channels[3] };
  return { channels };
}

/** Returns null when the text isn't a colour this file can resolve (unknown syntax, var(), calc(), relative colours). */
export function parseColor(text: string): ParsedColor | null {
  const value = text.trim().toLowerCase();
  if (value.startsWith('#')) return parseHex(value);
  const named = NAMED_COLORS[value];
  if (named) return fromHex6(named, 1);

  const fn = /^([a-z]+)\((.*)\)$/s.exec(value);
  if (!fn) return null;
  const name = fn[1]!;
  const { channels, alpha: alphaText } = splitArgs(fn[2]!);
  if (channels.length !== 3) return null;
  const alpha = alphaText === undefined ? 1 : num(alphaText, 1);
  if (alpha === null) return null;
  const clampedAlpha = Math.max(0, Math.min(1, alpha));

  if (name === 'rgb' || name === 'rgba') {
    const rgb = channels.map((c) => num(c, 255));
    if (rgb.some((c) => c === null)) return null;
    return fromHex6('#' + rgb.map((c) => hex2(c!)).join(''), clampedAlpha);
  }
  if (name === 'hsl' || name === 'hsla') {
    const h = num(channels[0], 360);
    const s = num(channels[1], 1);
    const l = num(channels[2], 1);
    if (h === null || s === null || l === null) return null;
    // Legacy syntax writes s and l as percentages; the modern one also allows plain numbers 0–100.
    const unit = (v: number, raw: string): number => (raw.endsWith('%') ? v : v / 100);
    const rgb = hslToRgb8(h, Math.max(0, Math.min(1, unit(s, channels[1]!))), Math.max(0, Math.min(1, unit(l, channels[2]!))));
    return fromHex6('#' + rgb.map(hex2).join(''), clampedAlpha);
  }
  if (name === 'oklab') {
    const l = num(channels[0], 1);
    const a = num(channels[1], 0.4);
    const b = num(channels[2], 0.4);
    if (l === null || a === null || b === null) return null;
    return { l, a, b, alpha: clampedAlpha };
  }
  if (name === 'oklch') {
    const l = num(channels[0], 1);
    const c = num(channels[1], 0.4);
    const h = num(channels[2], 360);
    if (l === null || c === null || h === null) return null;
    const rad = (h * Math.PI) / 180;
    return { l, a: c * Math.cos(rad), b: c * Math.sin(rad), alpha: clampedAlpha };
  }
  return null;
}

/** ΔE in OKLab × 100. Alpha is not part of it. */
export function deltaE(x: ParsedColor, y: ParsedColor): number {
  return Math.hypot(x.l - y.l, x.a - y.a, x.b - y.b) * 100;
}

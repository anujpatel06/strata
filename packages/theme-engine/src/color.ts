/**
 * Colour math for the theme engine. Zero dependencies.
 *
 * - Hex parsing/normalisation (#rgb, #rrggbb, with or without '#', any case).
 * - sRGB <-> linear sRGB <-> OKLab <-> OKLCH (Björn Ottosson's matrices).
 * - Gamut mapping: binary search on chroma at fixed L and h, then 8-bit quantisation.
 * - WCAG 2.x relative luminance and contrast ratio, always computed from 8-bit hex values.
 */

export interface Oklch {
  /** Perceptual lightness, 0–1. */
  l: number;
  /** Chroma, ≥ 0 (sRGB colours stay below ~0.33). */
  c: number;
  /** Hue in degrees, [0, 360). 0 for achromatic colours. */
  h: number;
}

export interface Oklab {
  l: number;
  a: number;
  b: number;
}

/** Linear-light or gamma-encoded RGB triple, channels nominally 0–1. */
export type Rgb = [number, number, number];

/* ------------------------------------------------------------------ *
 * Hex
 * ------------------------------------------------------------------ */

const HEX_RE = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i;

export function isValidHex(s: unknown): boolean {
  return typeof s === 'string' && HEX_RE.test(s.trim());
}

/** Returns lowercase #rrggbb. Throws on anything that is not #rgb / #rrggbb (the '#' is optional). */
export function normalizeHex(s: string): string {
  const m = typeof s === 'string' ? HEX_RE.exec(s.trim()) : null;
  if (!m || m[1] === undefined) {
    throw new Error(`Invalid hex colour: ${JSON.stringify(s)}. Use #rgb or #rrggbb.`);
  }
  let body = m[1].toLowerCase();
  if (body.length === 3) body = body.replace(/./g, (ch) => ch + ch);
  return '#' + body;
}

/** 8-bit channels (0–255) of a hex colour. */
export function hexToRgb8(hex: string): Rgb {
  const n = normalizeHex(hex);
  return [parseInt(n.slice(1, 3), 16), parseInt(n.slice(3, 5), 16), parseInt(n.slice(5, 7), 16)];
}

export function rgb8ToHex(rgb: Rgb): string {
  return (
    '#' +
    rgb
      .map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0'))
      .join('')
  );
}

/* ------------------------------------------------------------------ *
 * sRGB transfer
 * ------------------------------------------------------------------ */

export function srgbToLinear(c: number): number {
  const a = Math.abs(c);
  const v = a <= 0.04045 ? a / 12.92 : Math.pow((a + 0.055) / 1.055, 2.4);
  return c < 0 ? -v : v;
}

export function linearToSrgb(c: number): number {
  const a = Math.abs(c);
  const v = a <= 0.0031308 ? a * 12.92 : 1.055 * Math.pow(a, 1 / 2.4) - 0.055;
  return c < 0 ? -v : v;
}

/** Linearised value for every 8-bit code, so luminance never touches floats that weren't quantised. */
const LINEAR_LUT: readonly number[] = Array.from({ length: 256 }, (_, i) => srgbToLinear(i / 255));

/* ------------------------------------------------------------------ *
 * OKLab / OKLCH — Björn Ottosson's transform. Coefficients are the full double-precision
 * versions of his published (10-digit) matrices, so forward and inverse agree to ~1e-15 and
 * white maps to exactly L = 1, a = b = 0.
 * ------------------------------------------------------------------ */

export function linearRgbToOklab([r, g, b]: Rgb): Oklab {
  const l_ = Math.cbrt(0.412221469470763 * r + 0.5363325372617348 * g + 0.0514459932675022 * b);
  const m_ = Math.cbrt(0.2119034958178252 * r + 0.6806995506452344 * g + 0.1073969535369406 * b);
  const s_ = Math.cbrt(0.0883024591900564 * r + 0.2817188391361215 * g + 0.6299787016738222 * b);
  return {
    l: 0.210454268309314 * l_ + 0.7936177747023054 * m_ - 0.0040720430116193 * s_,
    a: 1.9779985324311684 * l_ - 2.4285922420485799 * m_ + 0.450593709617411 * s_,
    b: 0.0259040424655478 * l_ + 0.7827717124575296 * m_ - 0.8086757549230774 * s_,
  };
}

export function oklabToLinearRgb({ l: L, a, b }: Oklab): Rgb {
  const l_ = L + 0.3963377773761749 * a + 0.2158037573099136 * b;
  const m_ = L - 0.1055613458156586 * a - 0.0638541728258133 * b;
  const s_ = L - 0.0894841775298119 * a - 1.2914855480194092 * b;
  const l = l_ * l_ * l_;
  const m = m_ * m_ * m_;
  const s = s_ * s_ * s_;
  return [
    4.0767416360759574 * l - 3.3077115392580616 * m + 0.2309699031821044 * s,
    -1.2684379732850317 * l + 2.6097573492876887 * m - 0.3413193760026573 * s,
    -0.0041960761386756 * l - 0.7034186179359362 * m + 1.7076146940746117 * s,
  ];
}

const ACHROMATIC_C = 1e-4;

export function oklabToOklch({ l, a, b }: Oklab): Oklch {
  const c = Math.hypot(a, b);
  if (c < ACHROMATIC_C) return { l, c, h: 0 };
  let h = (Math.atan2(b, a) * 180) / Math.PI;
  if (h < 0) h += 360;
  if (h >= 360) h -= 360;
  return { l, c, h };
}

export function oklchToOklab({ l, c, h }: Oklch): Oklab {
  const rad = (h * Math.PI) / 180;
  return { l, a: c * Math.cos(rad), b: c * Math.sin(rad) };
}

export function hexToOklch(hex: string): Oklch {
  const [r, g, b] = hexToRgb8(hex);
  return oklabToOklch(linearRgbToOklab([LINEAR_LUT[r]!, LINEAR_LUT[g]!, LINEAR_LUT[b]!]));
}

/* ------------------------------------------------------------------ *
 * Gamut mapping
 * ------------------------------------------------------------------ */

/** Per-channel tolerance (linear light) for "inside sRGB". Absorbs float noise from the matrices. */
const GAMUT_EPS = 1e-6;
const GAMUT_ITERATIONS = 32;

function oklchToLinear(l: number, c: number, h: number): Rgb {
  return oklabToLinearRgb(oklchToOklab({ l, c, h }));
}

function inGamut(rgb: Rgb): boolean {
  return rgb.every((v) => v >= -GAMUT_EPS && v <= 1 + GAMUT_EPS);
}

export function isInSrgbGamut(color: Oklch): boolean {
  return inGamut(oklchToLinear(color.l, color.c, color.h));
}

function quantise(rgb: Rgb): string {
  return rgb8ToHex(rgb.map((v) => linearToSrgb(Math.max(0, Math.min(1, v))) * 255) as Rgb);
}

/**
 * OKLCH → lowercase #rrggbb. L is clamped to [0, 1]; if the colour is outside sRGB,
 * chroma is reduced by binary search at fixed L and h until it fits, then quantised to 8 bits.
 */
export function oklchToHex(color: Oklch): string {
  const l = Math.min(1, Math.max(0, Number.isFinite(color.l) ? color.l : 0));
  const c = Math.max(0, Number.isFinite(color.c) ? color.c : 0);
  const h = Number.isFinite(color.h) ? color.h : 0;
  const direct = oklchToLinear(l, c, h);
  if (inGamut(direct)) return quantise(direct);
  // c = 0 is always in gamut for l ∈ [0, 1] (a grey), so `lo` is a valid starting point.
  let lo = 0;
  let hi = c;
  for (let i = 0; i < GAMUT_ITERATIONS; i++) {
    const mid = (lo + hi) / 2;
    if (inGamut(oklchToLinear(l, mid, h))) lo = mid;
    else hi = mid;
  }
  return quantise(oklchToLinear(l, lo, h));
}

/** Same hue and chroma, new lightness (gamut-mapped + quantised). */
export function withLightness(hex: string, l: number): string {
  const o = hexToOklch(hex);
  return oklchToHex({ l, c: o.c, h: o.h });
}

/* ------------------------------------------------------------------ *
 * WCAG 2.x
 * ------------------------------------------------------------------ */

/** WCAG 2.x relative luminance of an 8-bit colour. */
export function relativeLuminance(hex: string): number {
  const [r, g, b] = hexToRgb8(hex);
  return 0.2126 * LINEAR_LUT[r]! + 0.7152 * LINEAR_LUT[g]! + 0.0722 * LINEAR_LUT[b]!;
}

/** WCAG 2.x contrast ratio, 1–21. Exact (not rounded). Order of arguments does not matter. */
export function contrastRatio(hexA: string, hexB: string): number {
  const a = relativeLuminance(hexA);
  const b = relativeLuminance(hexB);
  const hi = Math.max(a, b);
  const lo = Math.min(a, b);
  return (hi + 0.05) / (lo + 0.05);
}

/**
 * Formats a ratio for people: floored (never rounded up) to one decimal, e.g. 4.49 → "4.4".
 * The 1e-9 guard only absorbs binary-float noise (2.3 is stored as 2.2999…98).
 */
export function formatRatio(ratio: number): string {
  return (Math.floor(ratio * 10 + 1e-9) / 10).toFixed(1);
}

/**
 * The shadcn bridge: every Syntara theme exported as shadcn/ui CSS variables.
 * Real engine output for the three reference tenants plus a spread of random brands.
 */
import { describe, expect, it } from 'vitest';
import { contrastRatio, hexToRgb8, oklchToHex } from '../src/color';
import {
  SHADCN_CONTRAST_PAIRS,
  SHADCN_ROLE_MAP,
  hexToOklchString,
  radiusRem,
  toShadcnCSS,
  toShadcnCssVars,
} from '../src/export/shadcn';
import { generateTheme } from '../src/theme';
import type { BrandInput, Scheme, Shape, Theme } from '../src/types';
import { parseCss } from './fixture';

const TENANTS: BrandInput[] = [
  { name: 'Vela', primary: '#3d45d6', accent: '#12b5a6', neutral: 'cool', shape: 'sharp', typePair: 'precise', density: 'compact' },
  { name: 'Harbor', primary: '#1d6b63', accent: '#e07a3f', neutral: 'warm', shape: 'soft', typePair: 'calm', density: 'comfortable' },
  { name: 'Qamar', primary: '#f2a516', accent: '#7a2e8e', neutral: 'warm', shape: 'round', typePair: 'bilingual-round', density: 'comfortable' },
];

/** Deterministic spread of brands (mulberry32), so failures are reproducible. */
function randomBrands(n: number, seed = 0x5eed): BrandInput[] {
  let a = seed;
  const rand = () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const hex = () => '#' + Math.floor(rand() * 0xffffff).toString(16).padStart(6, '0');
  const shapes: Shape[] = ['sharp', 'soft', 'round'];
  return Array.from({ length: n }, (_, i) => ({
    name: `Random ${i}`,
    primary: hex(),
    accent: hex(),
    neutral: (['cool', 'neutral', 'warm'] as const)[i % 3]!,
    shape: shapes[i % 3]!,
    typePair: 'precise',
    density: 'comfortable',
  }));
}

const SHADCN_VARS = [
  'background', 'foreground', 'card', 'card-foreground', 'popover', 'popover-foreground',
  'primary', 'primary-foreground', 'secondary', 'secondary-foreground', 'muted', 'muted-foreground',
  'accent', 'accent-foreground', 'destructive', 'destructive-foreground', 'border', 'input', 'ring',
  'chart-1', 'chart-2', 'chart-3', 'chart-4', 'chart-5',
  'sidebar', 'sidebar-foreground', 'sidebar-primary', 'sidebar-primary-foreground',
  'sidebar-accent', 'sidebar-accent-foreground', 'sidebar-border', 'sidebar-ring',
];

const OKLCH_RE = /^oklch\((0|1|0\.\d{1,4}) (0|0\.\d{1,4}) (0|[1-9]\d{0,2}(\.\d{1,3})?|0\.\d{1,3})\)$/;

/** "oklch(L C H)" → hex through the engine's own maths (gamut-mapped, 8-bit). */
function oklchStringToHex(s: string): string {
  const m = OKLCH_RE.exec(s);
  if (!m) throw new Error(`Not an oklch() string: ${s}`);
  return oklchToHex({ l: Number(m[1]), c: Number(m[2]), h: Number(m[3]) });
}

function roundTripProblems(theme: Theme): string[] {
  const vars = toShadcnCssVars(theme);
  const problems: string[] = [];
  for (const scheme of ['light', 'dark'] as const) {
    for (const [name, role] of SHADCN_ROLE_MAP) {
      const want = hexToRgb8(theme.schemes[scheme].roles[role].hex);
      const got = hexToRgb8(oklchStringToHex(vars[scheme][name]!));
      const worst = Math.max(...want.map((v, i) => Math.abs(v - got[i]!)));
      if (worst > 1) problems.push(`${theme.input.name} ${scheme} --${name}: ${vars[scheme][name]} is ${worst}/255 off`);
    }
  }
  return problems;
}

function contrastProblems(theme: Theme): string[] {
  const vars = toShadcnCssVars(theme);
  const problems: string[] = [];
  for (const scheme of ['light', 'dark'] as Scheme[]) {
    for (const { fg, bg, required } of SHADCN_CONTRAST_PAIRS) {
      // Measure what the browser will actually paint: the emitted oklch() value, back in 8-bit sRGB.
      const ratio = contrastRatio(oklchStringToHex(vars[scheme][fg]!), oklchStringToHex(vars[scheme][bg]!));
      if (ratio < required) problems.push(`${theme.input.name} ${scheme}: --${fg} on --${bg} = ${ratio.toFixed(3)}:1 (needs ${required}:1)`);
    }
  }
  return problems;
}

describe('hexToOklchString', () => {
  it('formats white, black and greys with hue 0', () => {
    expect(hexToOklchString('#ffffff')).toBe('oklch(1 0 0)');
    expect(hexToOklchString('#000000')).toBe('oklch(0 0 0)');
    expect(hexToOklchString('#808080')).toMatch(/^oklch\(0\.\d{1,4} 0 0\)$/);
  });

  it('matches known OKLCH values within rounding', () => {
    // sRGB red: oklch(0.62796 0.25768 29.2339) (CSS Color 4 reference values).
    expect(hexToOklchString('#ff0000')).toBe('oklch(0.628 0.2577 29.234)');
  });
});

describe('radiusRem', () => {
  it('converts px at 16px/rem and caps pills at 1rem', () => {
    expect(radiusRem(2)).toBe('0.125rem');
    expect(radiusRem(8)).toBe('0.5rem');
    expect(radiusRem(14)).toBe('0.875rem');
    expect(radiusRem(9999)).toBe('1rem');
  });
});

describe.each(TENANTS)('toShadcnCssVars — $name', (input) => {
  const theme = generateTheme(input);
  const vars = toShadcnCssVars(theme);

  it('sets every shadcn variable in both schemes, radius on :root only', () => {
    expect(Object.keys(vars.light).sort()).toEqual([...SHADCN_VARS, 'radius'].sort());
    expect(Object.keys(vars.dark).sort()).toEqual([...SHADCN_VARS].sort());
    expect(vars.light.radius).toBe(radiusRem(theme.foundations.radius.field));
    expect(vars.theme).toEqual({});
  });

  it('writes every colour as oklch(L C H)', () => {
    for (const scheme of ['light', 'dark'] as const) {
      for (const name of SHADCN_VARS) expect(vars[scheme][name], `${scheme} --${name}`).toMatch(OKLCH_RE);
    }
  });

  it('maps each variable to its documented Syntara role', () => {
    for (const [name, role] of SHADCN_ROLE_MAP) {
      expect(vars.light[name]).toBe(hexToOklchString(theme.schemes.light.roles[role].hex));
      expect(vars.dark[name]).toBe(hexToOklchString(theme.schemes.dark.roles[role].hex));
    }
  });

  it('round-trips oklch → hex within 1/255 per channel', () => {
    expect(roundTripProblems(theme)).toEqual([]);
  });

  it('keeps every documented pair at WCAG 2.2 AA', () => {
    expect(contrastProblems(theme)).toEqual([]);
  });

  it('adds font stacks to @theme only when asked', () => {
    const withFonts = toShadcnCssVars(theme, { fonts: true });
    expect(withFonts.theme).toEqual({
      'font-sans': theme.typePair.body,
      'font-heading': theme.typePair.heading,
      'font-mono': theme.typePair.mono,
    });
  });
});

describe('toShadcnCssVars — 200 random brands', () => {
  const themes = randomBrands(200).map((b) => generateTheme(b));
  it('round-trips within 1/255', () => {
    expect(themes.flatMap(roundTripProblems)).toEqual([]);
  });
  it('keeps every documented pair at WCAG 2.2 AA', () => {
    expect(themes.flatMap(contrastProblems)).toEqual([]);
  });
});

describe('toShadcnCSS', () => {
  const theme = generateTheme(TENANTS[1]!);

  it('emits :root and .dark blocks that equal toShadcnCssVars', () => {
    const rules = parseCss(toShadcnCSS(theme));
    const vars = toShadcnCssVars(theme);
    expect(rules.map((r) => r.selector)).toEqual([':root', '.dark']);
    const prefixed = (o: Record<string, string>) => Object.fromEntries(Object.entries(o).map(([k, v]) => [`--${k}`, v]));
    expect(rules[0]!.decls).toEqual(prefixed(vars.light));
    expect(rules[1]!.decls).toEqual(prefixed(vars.dark));
  });

  it('adds an @theme inline block for fonts when asked', () => {
    const rules = parseCss(toShadcnCSS(theme, { fonts: true }));
    expect(rules.map((r) => r.selector)).toEqual([':root', '.dark', '@theme inline']);
    expect(rules[2]!.decls['--font-sans']).toBe(theme.typePair.body);
  });
});

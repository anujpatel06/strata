import { describe, expect, it } from 'vitest';
import {
  CHART_BAND,
  CHART_CANDIDATES,
  CHART_MIN_HUE_GAP,
  CHART_SURFACES,
  chartDeltaE,
  chartPaletteProblems,
  hueGap,
  solveChartSeries,
} from '../src/chart';
import { hexToOklch } from '../src/color';
import { toCssVariables } from '../src/css-vars';
import { generateTheme } from '../src/theme';
import type { BrandInput, Scheme, Theme } from '../src/types';
import { fuzzInputs } from '../scripts/fuzz';

const TENANTS = {
  vela: { name: 'Vela', primary: '#3d45d6', accent: '#12b5a6', neutral: 'cool', shape: 'sharp', typePair: 'precise', density: 'compact' },
  harbor: { name: 'Harbor', primary: '#1d6b63', accent: '#e07a3f', neutral: 'warm', shape: 'soft', typePair: 'calm', density: 'comfortable' },
  qamar: { name: 'Qamar', primary: '#f2a516', accent: '#7a2e8e', neutral: 'warm', shape: 'round', typePair: 'bilingual-round', density: 'comfortable' },
  care: { name: 'Care', primary: '#2d5f4f', accent: '#c2664a', neutral: 'paper', shape: 'round', typePair: 'editorial', density: 'comfortable' },
  house: { name: 'Syntara', primary: '#18181b', neutral: 'neutral', shape: 'soft', typePair: 'modern', density: 'comfortable' },
} satisfies Record<string, BrandInput>;

const SCHEMES: readonly Scheme[] = ['light', 'dark'];
const surfaces = (t: Theme, s: Scheme) => CHART_SURFACES.map((r) => t.schemes[s].roles[r].hex);

describe('chart maths mirrors the dataviz validator', () => {
  it('ΔE is OKLab distance ×100', () => {
    expect(chartDeltaE('#000000', '#ffffff')).toBeCloseTo(100, 6);
    expect(chartDeltaE('#3d45d6', '#3d45d6', 'protan')).toBe(0);
  });

  it('reproduces the validator on Care text.brand + accent.text (light)', () => {
    // node validate_palette.js "#325e50,#9e4f36" --mode light --surface "#fffdfa"
    //   → CVD worst ΔE 4.3 (protan) · tritan 21.8; normal ΔE 17.1
    expect(chartDeltaE('#325e50', '#9e4f36', 'protan').toFixed(1)).toBe('4.3');
    expect(chartDeltaE('#325e50', '#9e4f36', 'tritan').toFixed(1)).toBe('21.8');
    expect(chartDeltaE('#325e50', '#9e4f36').toFixed(1)).toBe('17.1');
    const problems = chartPaletteProblems(['#325e50', '#9e4f36'], 'light', ['#fffdfa']);
    expect(problems.some((p) => /chroma 0\.055/.test(p))).toBe(true);
    expect(problems.some((p) => /protan ΔE 4\.3/.test(p))).toBe(true);
  });

  it('flags band, contrast and normal-vision failures', () => {
    expect(chartPaletteProblems(['#ffe066'], 'light', ['#ffffff']).join()).toMatch(/outside the light band.*against #ffffff/);
    expect(chartPaletteProblems(['#3d45d6', '#3f47d8'], 'light', ['#ffffff']).join()).toMatch(/normal-vision ΔE/);
  });
});

describe.each(Object.entries(TENANTS))('%s chart palette', (_, input) => {
  const theme = generateTheme(input);

  it.each(SCHEMES)('passes every chart check (%s)', (scheme) => {
    const { chart } = theme.schemes[scheme];
    expect(chart.series).toHaveLength(4);
    expect(chartPaletteProblems(chart.series, scheme, surfaces(theme, scheme))).toEqual([]);
    for (const hex of chart.series) {
      const { l } = hexToOklch(hex);
      expect(l).toBeGreaterThanOrEqual(CHART_BAND[scheme][0]);
      expect(l).toBeLessThanOrEqual(CHART_BAND[scheme][1]);
    }
  });

  it.each(SCHEMES)('every series is its own hue family (%s)', (scheme) => {
    const hues = theme.schemes[scheme].chart.series.map((h) => hexToOklch(h).h);
    for (let i = 0; i < hues.length; i++)
      for (let j = i + 1; j < hues.length; j++) expect(hueGap(hues[i]!, hues[j]!)).toBeGreaterThanOrEqual(CHART_MIN_HUE_GAP);
  });

  it('grid and axis alias border.subtle and text.subtle', () => {
    for (const scheme of SCHEMES) {
      const s = theme.schemes[scheme];
      expect(s.chart.grid).toBe(s.roles['border.subtle'].hex);
      expect(s.chart.axis).toBe(s.roles['text.subtle'].hex);
      const vars = toCssVariables(theme, scheme);
      s.chart.series.forEach((hex, i) => expect(vars[`--syntara-chart-${i + 1}`]).toBe(hex));
      expect(vars['--syntara-chart-grid']).toBe('var(--syntara-color-border-subtle)');
      expect(vars['--syntara-chart-axis']).toBe('var(--syntara-color-text-subtle)');
    }
  });
});

describe('series 1 keeps the brand hue', () => {
  it.each(['vela', 'harbor', 'qamar', 'care'] as const)('%s', (id) => {
    const brand = hexToOklch(TENANTS[id].primary);
    const theme = generateTheme(TENANTS[id]);
    for (const scheme of SCHEMES) {
      const s1 = hexToOklch(theme.schemes[scheme].chart.series[0]!);
      // Gamut mapping and 8-bit rounding move the hue a little; the hue family is kept.
      expect(hueGap(s1.h, brand.h)).toBeLessThan(8);
      expect(s1.c).toBeGreaterThanOrEqual(0.1);
      expect(theme.schemes[scheme].chart.notes).toBeUndefined();
    }
  });

  it('lifts a low-chroma brand (Care sage, C 0.061) to the chroma floor', () => {
    expect(hexToOklch(TENANTS.care.primary).c).toBeLessThan(0.1);
    const s1 = generateTheme(TENANTS.care).schemes.light.chart.series[0]!;
    expect(hexToOklch(s1).c).toBeGreaterThanOrEqual(0.1);
  });

  it('near-grey brand with no accent starts at the first candidate and says so', () => {
    const t = generateTheme(TENANTS.house);
    for (const scheme of SCHEMES) {
      const { series, notes } = t.schemes[scheme].chart;
      expect(hueGap(hexToOklch(series[0]!).h, CHART_CANDIDATES[0]!.h)).toBeLessThan(8);
      expect(notes?.[0]).toMatch(/near-grey/);
    }
  });

  it('near-grey primary with a chromatic accent takes the accent hue', () => {
    const t = generateTheme({ ...TENANTS.house, accent: '#c2664a' });
    const s1 = hexToOklch(t.schemes.light.chart.series[0]!);
    expect(hueGap(s1.h, hexToOklch('#c2664a').h)).toBeLessThan(8);
    expect(t.schemes.light.chart.notes?.[0]).toMatch(/accent's hue/);
  });
});

describe('fixed candidate order', () => {
  const surf = { light: ['#ffffff', '#ffffff'], dark: ['#1a1a19', '#141414'] } as const;
  it('series 2 is the first candidate far enough from the brand hue', () => {
    // A red brand: blue is first and passes.
    const red = solveChartSeries('#d11a2a', '#d11a2a', 'light', surf.light).series;
    expect(hueGap(hexToOklch(red[1]!).h, CHART_CANDIDATES[0]!.h)).toBeLessThan(8);
    // A blue brand: blue is skipped (same hue family), orange is next.
    const blue = solveChartSeries('#2563eb', '#2563eb', 'light', surf.light).series;
    expect(hueGap(hexToOklch(blue[1]!).h, CHART_CANDIDATES[1]!.h)).toBeLessThan(8);
  });

  it('is deterministic', () => {
    expect(solveChartSeries('#12b5a6', '#12b5a6', 'dark', surf.dark)).toEqual(solveChartSeries('#12b5a6', '#12b5a6', 'dark', surf.dark));
  });
});

describe('random brands (seed 7, 150 brands; the full 1,000 run in pnpm test:themes)', () => {
  it('every palette passes', () => {
    const bad: string[] = [];
    for (const input of fuzzInputs(7, 150)) {
      const t = generateTheme(input);
      for (const scheme of SCHEMES) {
        const p = chartPaletteProblems(t.schemes[scheme].chart.series, scheme, surfaces(t, scheme));
        if (p.length) bad.push(`${input.primary}/${input.accent ?? '-'} ${scheme}: ${p.join('; ')}`);
      }
    }
    expect(bad).toEqual([]);
  });
});

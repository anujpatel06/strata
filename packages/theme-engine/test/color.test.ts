import { converter } from 'culori';
import { describe, expect, it } from 'vitest';
import {
  contrastRatio,
  formatRatio,
  hexToOklch,
  isInSrgbGamut,
  isValidHex,
  normalizeHex,
  oklchToHex,
  relativeLuminance,
} from '../src/color';
import { mulberry32 } from '../scripts/fuzz';

const toCuloriOklch = converter('oklch');

function randomHexes(seed: number, n: number): string[] {
  const rand = mulberry32(seed);
  return Array.from({ length: n }, () => '#' + Math.floor(rand() * 0x1000000).toString(16).padStart(6, '0'));
}

describe('hex parsing', () => {
  it('accepts #rgb / #rrggbb with or without #, any case, surrounding spaces', () => {
    for (const s of ['#fff', 'fff', '#FFF', '#ffffff', 'FFFFFF', '#AbCdEf', ' #3d45d6 ', '000']) {
      expect(isValidHex(s), s).toBe(true);
    }
  });

  it('rejects everything else', () => {
    for (const s of ['', '#', '#ff', '#ffff', '#fffff', '#fffffff', '#ggg', 'red', 'rgb(0,0,0)', '##fff', '#ff ff ff']) {
      expect(isValidHex(s), s).toBe(false);
    }
    for (const v of [null, undefined, 123, {}, []]) expect(isValidHex(v)).toBe(false);
  });

  it('normalises to lowercase #rrggbb', () => {
    expect(normalizeHex('#FFF')).toBe('#ffffff');
    expect(normalizeHex('abc')).toBe('#aabbcc');
    expect(normalizeHex('3D45D6')).toBe('#3d45d6');
    expect(normalizeHex(' #0B1F5C ')).toBe('#0b1f5c');
  });

  it('throws on invalid input', () => {
    expect(() => normalizeHex('#12345')).toThrow(/Invalid hex/);
    expect(() => normalizeHex('blue')).toThrow(/Invalid hex/);
  });
});

describe('OKLCH conversion vs culori', () => {
  const hexes = randomHexes(0xc0101, 500);

  it('hex → oklch → hex is lossless for 500 seeded random colours', () => {
    for (const hex of hexes) expect(oklchToHex(hexToOklch(hex)), hex).toBe(hex);
  });

  it("l/c/h match culori's oklch converter within 1e-4 (hue ignored when c < 1e-3)", () => {
    let maxDl = 0;
    let maxDc = 0;
    let maxDh = 0;
    for (const hex of hexes) {
      const ours = hexToOklch(hex);
      const ref = toCuloriOklch(hex);
      expect(ref, hex).toBeDefined();
      const dl = Math.abs(ours.l - ref!.l);
      const dc = Math.abs(ours.c - ref!.c);
      maxDl = Math.max(maxDl, dl);
      maxDc = Math.max(maxDc, dc);
      expect(dl, `${hex} l`).toBeLessThan(1e-4);
      expect(dc, `${hex} c`).toBeLessThan(1e-4);
      if (ref!.c >= 1e-3) {
        const raw = Math.abs(ours.h - (ref!.h ?? 0));
        const dh = Math.min(raw, 360 - raw);
        maxDh = Math.max(maxDh, dh);
        expect(dh, `${hex} h`).toBeLessThan(1e-4);
      }
    }
    // Keep the observed worst case visible in the test output's assertions.
    expect(Math.max(maxDl, maxDc, maxDh)).toBeLessThan(1e-4);
  });

  it('greys, black and white are achromatic with hue 0', () => {
    for (const hex of ['#000000', '#ffffff', '#808080', '#777777', '#010101']) {
      const o = hexToOklch(hex);
      expect(o.c, hex).toBeLessThan(1e-4);
      expect(o.h, hex).toBe(0);
    }
    expect(hexToOklch('#ffffff').l).toBeCloseTo(1, 6);
    expect(hexToOklch('#000000').l).toBe(0);
  });

  it('agrees with culori on the brief tenants', () => {
    for (const hex of ['#3d45d6', '#1d6b63', '#f2a516', '#12b5a6', '#e07a3f', '#7a2e8e']) {
      const ours = hexToOklch(hex);
      const ref = toCuloriOklch(hex)!;
      expect(ours.l).toBeCloseTo(ref.l, 5);
      expect(ours.c).toBeCloseTo(ref.c, 5);
      expect(ours.h).toBeCloseTo(ref.h!, 3);
    }
  });
});

describe('gamut mapping', () => {
  it('always returns a valid, in-gamut hex for arbitrary OKLCH (including far out of gamut)', () => {
    const rand = mulberry32(99);
    for (let i = 0; i < 2000; i++) {
      const target = { l: rand() * 1.2 - 0.1, c: rand() * 0.5, h: rand() * 360 };
      const hex = oklchToHex(target);
      expect(hex, JSON.stringify(target)).toMatch(/^#[0-9a-f]{6}$/);
      expect(isValidHex(hex)).toBe(true);
    }
  });

  it('reduces chroma only (L and hue held) when mapping out-of-gamut colours', () => {
    const rand = mulberry32(7);
    let checked = 0;
    for (let i = 0; i < 2000; i++) {
      const target = { l: 0.25 + rand() * 0.6, c: 0.2 + rand() * 0.3, h: rand() * 360 };
      if (isInSrgbGamut(target)) continue;
      const out = hexToOklch(oklchToHex(target));
      expect(out.c, JSON.stringify(target)).toBeLessThanOrEqual(target.c);
      // 8-bit quantisation moves L by at most ~0.005 in this range.
      expect(Math.abs(out.l - target.l), JSON.stringify(target)).toBeLessThan(0.006);
      if (out.c > 0.03) {
        const raw = Math.abs(out.h - target.h);
        expect(Math.min(raw, 360 - raw), JSON.stringify(target)).toBeLessThan(2);
      }
      checked++;
    }
    expect(checked).toBeGreaterThan(500);
  });

  it('clamps L to [0, 1]', () => {
    expect(oklchToHex({ l: -1, c: 0.2, h: 30 })).toBe('#000000');
    expect(oklchToHex({ l: 2, c: 0.2, h: 30 })).toBe('#ffffff');
    expect(oklchToHex({ l: 0.5, c: 0, h: 0 })).toBe(oklchToHex({ l: 0.5, c: 0, h: 200 }));
  });

  it('leaves in-gamut colours untouched (no chroma loss)', () => {
    const target = hexToOklch('#3d45d6');
    expect(oklchToHex(target)).toBe('#3d45d6');
  });
});

describe('WCAG 2.x contrast', () => {
  it('white on black is 21:1', () => {
    expect(contrastRatio('#ffffff', '#000000')).toBeCloseTo(21, 10);
    expect(contrastRatio('#000', '#fff')).toBeCloseTo(21, 10);
  });

  it('identical colours are 1:1', () => {
    expect(contrastRatio('#3d45d6', '#3d45d6')).toBe(1);
  });

  it('#767676 passes 4.5:1 on white; #777777 does not (no rounding up)', () => {
    expect(contrastRatio('#767676', '#ffffff')).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio('#777777', '#ffffff')).toBeLessThan(4.5);
    expect(formatRatio(contrastRatio('#777777', '#ffffff'))).toBe('4.4');
  });

  it('matches known reference values', () => {
    expect(relativeLuminance('#ffffff')).toBeCloseTo(1, 12);
    expect(relativeLuminance('#000000')).toBe(0);
    expect(relativeLuminance('#ff0000')).toBeCloseTo(0.2126, 12);
    expect(relativeLuminance('#00ff00')).toBeCloseTo(0.7152, 12);
    expect(relativeLuminance('#0000ff')).toBeCloseTo(0.0722, 12);
    expect(contrastRatio('#ff0000', '#ffffff')).toBeCloseTo(3.998, 3);
    expect(contrastRatio('#0000ff', '#ffffff')).toBeCloseTo(8.592, 3);
  });

  it('formatRatio floors to one decimal', () => {
    expect(formatRatio(4.49)).toBe('4.4');
    expect(formatRatio(4.5)).toBe('4.5');
    expect(formatRatio(2.3)).toBe('2.3');
    expect(formatRatio(20.99)).toBe('20.9');
  });
});

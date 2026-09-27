import { describe, expect, it } from 'vitest';
import { FIDELITY_ROLES, brandFidelity } from '../src/fidelity';
import { generateTheme } from '../src/theme';
import type { BrandInput } from '../src/types';

const brand = (primary: string, accent?: string): BrandInput => ({
  name: 'Test',
  primary,
  ...(accent ? { accent } : {}),
  neutral: 'neutral',
  shape: 'soft',
  typePair: 'precise',
  density: 'comfortable',
});

describe('brandFidelity', () => {
  it('returns one record per brand colour and scheme', () => {
    const records = brandFidelity(generateTheme(brand('#3d45d6', '#12b5a6')));
    expect(records.map((r) => `${r.input}:${r.scheme}`)).toEqual(['primary:light', 'primary:dark', 'accent:light', 'accent:dark']);
  });

  it('compares the input with the role that carries it, as shipped', () => {
    const theme = generateTheme(brand('#3d45d6', '#12b5a6'));
    for (const r of brandFidelity(theme)) {
      expect(r.role).toBe(FIDELITY_ROLES[r.input]);
      expect(r.asked).toBe(theme.input[r.input]);
      expect(r.shipped).toBe(theme.schemes[r.scheme].roles[r.role].hex);
    }
  });

  it('is 0 and exact when the brand colour is shipped as given, and positive when it moved', () => {
    for (const hex of ['#3d45d6', '#ffd400', '#ff0000', '#0a0a0a', '#f5f5f5', '#12b5a6']) {
      for (const r of brandFidelity(generateTheme(brand(hex)))) {
        expect(r.exact).toBe(r.shipped === r.asked);
        if (r.exact) expect(r.deltaE).toBe(0);
        else expect(r.deltaE).toBeGreaterThan(0);
      }
    }
  });

  it('reports the accent against the primary when no accent is given', () => {
    const theme = generateTheme(brand('#3d45d6'));
    const accent = brandFidelity(theme).filter((r) => r.input === 'accent');
    expect(accent.every((r) => r.asked === '#3d45d6')).toBe(true);
  });

  it('is deterministic', () => {
    expect(brandFidelity(generateTheme(brand('#c2410c', '#0e7490')))).toEqual(brandFidelity(generateTheme(brand('#c2410c', '#0e7490'))));
  });
});

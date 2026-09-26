import { describe, expect, it } from 'vitest';
import { contrastRatio, hexToOklch } from '../src/color';
import { generateTheme } from '../src/theme';
import type { BrandInput, NeutralTemperature, Theme } from '../src/types';
import { validateTheme } from '../scripts/fuzz';
import { buildRamps } from '../src/ramps';
import { PREFERRED_LABEL_MAX_DL, chooseFillMove, resolveRoles } from '../src/roles';

const EXTREMES = ['#ffffff', '#000000', '#ffff00', '#00ff00', '#0000ff', '#ff0000', '#808080', '#0b1f5c', '#fff3a0'];
const NEUTRALS: NeutralTemperature[] = ['cool', 'neutral', 'warm'];

const brand = (primary: string, extra: Partial<BrandInput> = {}): BrandInput => ({
  name: `Edge ${primary}`,
  primary,
  neutral: 'neutral',
  shape: 'soft',
  typePair: 'friendly',
  density: 'comfortable',
  ...extra,
});

function expectAllPass(theme: Theme): void {
  const failing = theme.checks.filter((c) => !c.pass).map((c) => `${c.scheme} ${c.fg} ${c.fgHex} on ${c.bg} ${c.bgHex}: ${c.ratio}`);
  expect(failing).toEqual([]);
  expect(validateTheme(theme)).toEqual([]);
}

describe('edge-case brand colours', () => {
  for (const hex of EXTREMES) {
    for (const neutral of NEUTRALS) {
      it(`${hex} (${neutral} neutrals) passes every check`, () => {
        expectAllPass(generateTheme(brand(hex, { neutral })));
      });
    }
    it(`${hex} as the accent (with each extreme as primary) passes every check`, () => {
      for (const primary of EXTREMES) expectAllPass(generateTheme(brand(primary, { accent: hex })));
    });
  }

  it('3-digit and uppercase input produce the same theme as the normalised hex', () => {
    const strip = (t: Theme) => JSON.stringify({ ...t, input: { ...t.input, name: '' }, summary: { ...t.summary, generationMs: 0 } });
    const canonical = generateTheme(brand('#ff22aa'));
    for (const variant of ['#F2A', 'f2a', 'F2A', '#FF22AA', 'ff22aa', ' #ff22aa ']) {
      const t = generateTheme(brand(variant));
      expect(t.input.primary).toBe('#ff22aa');
      expect(strip(t)).toBe(strip(canonical));
      expectAllPass(t);
    }
    const upper = generateTheme(brand('#0B1F5C', { accent: 'ABC' }));
    expect(upper.input).toMatchObject({ primary: '#0b1f5c', accent: '#aabbcc' });
    expectAllPass(upper);
  });

  it('white primary: ink labels, and an outline so the button is findable on light surfaces', () => {
    const t = generateTheme(brand('#ffffff'));
    const light = t.schemes.light.roles;
    expect(light['action.primary.bg'].hex).toBe('#ffffff');
    expect(light['action.primary.fg'].hex).not.toBe('#ffffff');
    expect(light['action.primary.border'].hex).toBe(light['border.strong'].hex);
    const outline = t.adjustments.find((a) => a.id === 'light:action.primary.border');
    expect(outline?.kind).toBe('visibility');
    expect(outline?.message).toMatch(/outline/);
    // Hover/pressed cannot get lighter than white, so they go darker and keep the label readable.
    expect(contrastRatio(light['action.primary.hover'].hex, '#ffffff')).toBeGreaterThan(1);
  });

  it('pale yellow #fff3a0 gets an outline in light mode (message names both hexes)', () => {
    const t = generateTheme(brand('#fff3a0'));
    const outline = t.adjustments.find((a) => a.id === 'light:action.primary.border');
    expect(outline).toBeDefined();
    expect(outline!.message).toContain('#fff3a0');
    expect(outline!.message).toContain(t.schemes.light.roles['border.strong'].hex);
  });

  it('navy #0b1f5c stays exact in light but is lifted in dark for findability (not WCAG)', () => {
    const t = generateTheme(brand('#0b1f5c'));
    expect(t.schemes.light.roles['action.primary.bg']).toEqual({ hex: '#0b1f5c', ref: 'primary.9' });
    const dark = t.schemes.dark.roles['action.primary.bg'];
    expect(dark.hex).not.toBe('#0b1f5c');
    expect(dark.ref).toBeUndefined();
    expect(dark.adjusted).toMatchObject({ fromHex: '#0b1f5c', fromRef: 'primary.9' });
    expect(contrastRatio(dark.hex, t.schemes.dark.roles['surface.canvas'].hex)).toBeGreaterThanOrEqual(2.2);
    // Same hue, lighter.
    const before = hexToOklch('#0b1f5c');
    const after = hexToOklch(dark.hex);
    expect(after.l).toBeGreaterThan(before.l);
    expect(Math.abs(after.h - before.h)).toBeLessThan(5);
    const adj = t.adjustments.find((a) => a.id === 'dark:action.primary.bg');
    expect(adj?.kind).toBe('visibility');
    expect(adj?.message).toContain('#0b1f5c');
    expect(adj?.message).toContain(dark.hex);
  });

  it('black primary: hover/pressed are visibly lighter instead of an impossible darker', () => {
    const t = generateTheme(brand('#000000'));
    const r = t.schemes.light.roles;
    expect(r['action.primary.bg'].hex).toBe('#000000');
    expect(r['action.primary.hover'].hex).not.toBe('#000000');
    expect(hexToOklch(r['action.primary.pressed'].hex).l).toBeGreaterThan(hexToOklch(r['action.primary.hover'].hex).l);
  });

  it('mid-tones where neither white nor ink reaches 4.5:1 get a deeper fill with white labels', () => {
    for (const hex of ['#808080', '#ff0000']) {
      const t = generateTheme(brand(hex));
      const moved = t.adjustments.find((a) => a.id === 'light:action.primary.bg');
      expect(moved?.kind).toBe('contrast');
      expect(moved?.message).toMatch(/Neither white .* nor ink .* reach 4\.5:1 on .*, so the primary button uses a (slightly )?deeper tone, #[0-9a-f]{6}, with white labels/);
      const bg = t.schemes.light.roles['action.primary.bg'].hex;
      const fg = t.schemes.light.roles['action.primary.fg'];
      expect(fg).toEqual({ hex: '#ffffff' }); // the preferred label: no 'choice' adjustment
      expect(t.adjustments.find((a) => a.id === 'light:action.primary.fg')).toBeUndefined();
      expect(contrastRatio(fg.hex, bg)).toBeGreaterThanOrEqual(4.5);
      const before = hexToOklch(hex);
      const after = hexToOklch(bg);
      expect(after.l).toBeLessThan(before.l);
      expect(before.l - after.l).toBeLessThanOrEqual(0.12);
    }
  });

  it('#ff0000 becomes a deeper red (same hue) with white labels in light mode', () => {
    const t = generateTheme(brand('#ff0000'));
    const bg = t.schemes.light.roles['action.primary.bg'];
    expect(bg.hex).toBe('#ec0000');
    expect(bg.adjusted).toMatchObject({ fromHex: '#ff0000', fromRef: 'primary.9' });
    expect(Math.abs(hexToOklch(bg.hex).h - hexToOklch('#ff0000').h)).toBeLessThan(1);
    expect(t.schemes.light.roles['action.primary.fg'].hex).toBe('#ffffff');
    // Hover/pressed go darker still under the white label.
    expect(hexToOklch(t.schemes.light.roles['action.primary.hover'].hex).l).toBeLessThan(hexToOklch(bg.hex).l);
  });

  it('chooseFillMove keeps the preferred label within ΔL 0.12, else takes the smaller move', () => {
    const lightInk = '#1f1f1f';
    // #ff0000: ink needs a smaller (lighter) move than white, but white's darker move is ≤ 0.12 → white.
    const red = chooseFillMove('#ff0000', lightInk, 'white');
    expect(red.label).toBe('white');
    expect(red.dl).toBeLessThanOrEqual(PREFERRED_LABEL_MAX_DL);
    expect(contrastRatio('#ffffff', red.hex)).toBeGreaterThanOrEqual(4.5);
    // With a weak ink (#595959) a pale fill needs a big darker move for white (> 0.12) but only a
    // small lighter move for ink → the smaller move wins and the label becomes ink.
    const pale = chooseFillMove('#c4c4c4', '#595959', 'white');
    expect(pale.label).toBe('ink');
    expect(pale.dl).toBeLessThan(PREFERRED_LABEL_MAX_DL);
    expect(contrastRatio('#595959', pale.hex)).toBeGreaterThanOrEqual(4.5);
    // Symmetric for an ink-preferring solid: ink kept when its (lighter) move is ≤ 0.12.
    const warm = chooseFillMove('#808080', lightInk, 'ink');
    expect(warm.label).toBe('ink');
    expect(hexToOklch(warm.hex).l).toBeGreaterThan(hexToOklch('#808080').l);
  });

  it('an ink-preferring feedback solid only logs a choice when it has to fall back to white', () => {
    const input = { name: 'x', primary: '#3d45d6', accent: '#3d45d6', neutral: 'cool', shape: 'soft', typePair: 'calm', density: 'compact' } as const;
    const ramps = buildRamps(input, 'light');
    const normal = resolveRoles('light', ramps);
    expect(normal.roles['feedback.warning.onSolid']).toEqual({ hex: ramps.neutral[11], ref: 'neutral.12' });
    expect(normal.adjustments.filter((a) => a.role.startsWith('feedback.'))).toEqual([]);

    // Force a dark warning solid: ink can't reach 4.5:1, white can → 'choice', explained.
    const darkWarning = { ...ramps, warning: ramps.warning.map((h, i) => (i === 8 ? '#5a3a00' : h)) };
    const forced = resolveRoles('light', darkWarning);
    const adj = forced.adjustments.find((a) => a.id === 'light:feedback.warning.onSolid');
    expect(adj?.kind).toBe('choice');
    expect(adj?.fromHex).toBe(ramps.neutral[11]);
    expect(adj?.toHex).toBe('#ffffff');
    expect(adj?.message).toMatch(/^Ink labels \(#[0-9a-f]{6}\) on #5a3a00 only reach \d+\.\d:1, so warning badge labels use white \(\d+\.\d:1\)\.$/);
    expect(forced.roles['feedback.warning.onSolid']).toMatchObject({ hex: '#ffffff', adjusted: { fromRef: 'neutral.12' } });
  });

  it('greys with "neutral" temperature produce pure grey neutrals (no borrowed hue)', () => {
    const t = generateTheme(brand('#808080'));
    for (const hex of t.schemes.light.ramps.neutral) expect(hexToOklch(hex).c).toBeLessThan(1e-3);
  });
});

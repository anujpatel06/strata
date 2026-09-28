import { describe, expect, it } from 'vitest';
import { FOUNDATIONS, foundationsForShape, radiusForShape } from '../src/foundations';
import { FEEDBACK_NAMES, feedbackBaseHex } from '../src/ramps';
import { glassWorstRatio } from '../src/glass';
import { CONTRAST_PAIRS } from '../src/roles';
import { countTokens, generateTheme, normalizeBrandInput } from '../src/theme';
import { TYPE_PAIRS, googleFontsHref } from '../src/type-pairs';
import { ROLES, type BrandInput, type Theme } from '../src/types';
import { validateTheme } from '../scripts/fuzz';

const TENANTS = {
  vela: { name: 'Vela', primary: '#3d45d6', accent: '#12b5a6', neutral: 'cool', shape: 'sharp', typePair: 'precise', density: 'compact' },
  harbor: { name: 'Harbor', primary: '#1d6b63', accent: '#e07a3f', neutral: 'warm', shape: 'soft', typePair: 'calm', density: 'comfortable' },
  qamar: { name: 'Qamar', primary: '#f2a516', accent: '#7a2e8e', neutral: 'warm', shape: 'round', typePair: 'bilingual-round', density: 'comfortable' },
} satisfies Record<string, BrandInput>;

const SCHEMES = ['light', 'dark'] as const;
const withoutTiming = (t: Theme) => ({ ...t, summary: { ...t.summary, generationMs: 0 } });

function expectValidTheme(theme: Theme): void {
  expect(validateTheme(theme)).toEqual([]);
  const failing = theme.checks.filter((c) => !c.pass);
  expect(failing, JSON.stringify(failing)).toEqual([]);
  expect(theme.summary.failed).toBe(0);
  expect(theme.checks).toHaveLength(2 * CONTRAST_PAIRS.reduce((n, p) => n + p.against.length, 0));
  // Each pair in contrast-pairs.json is checked once per scheme.
  for (const scheme of SCHEMES) {
    for (const p of CONTRAST_PAIRS) {
      for (const bg of p.against) {
        expect(theme.checks.filter((c) => c.scheme === scheme && c.fg === p.fg && c.bg === bg)).toHaveLength(1);
      }
    }
  }
}

describe('generateTheme — tenants', () => {
  for (const [key, input] of Object.entries(TENANTS)) {
    it(`${key}: every check passes and the theme is well-formed`, () => {
      expectValidTheme(generateTheme(input));
    });
  }

  it('is deterministic (same input → identical output apart from timing)', () => {
    for (const input of Object.values(TENANTS)) {
      const a = generateTheme(input);
      const b = generateTheme({ ...input });
      expect(withoutTiming(a)).toEqual(withoutTiming(b));
      expect(JSON.stringify(withoutTiming(a))).toBe(JSON.stringify(withoutTiming(b)));
    }
  });

  it('keeps the brand exact at step 9 of primary and accent, in both schemes', () => {
    for (const input of Object.values(TENANTS)) {
      const t = generateTheme(input);
      for (const scheme of SCHEMES) {
        expect(t.schemes[scheme].ramps.primary[8]).toBe(input.primary);
        expect(t.schemes[scheme].ramps.accent[8]).toBe(input.accent);
        for (const f of FEEDBACK_NAMES) expect(t.schemes[scheme].ramps[f][8]).toBe(feedbackBaseHex(f));
      }
    }
  });

  it('Vela and Harbor keep the exact brand colour on the primary button with white labels', () => {
    for (const input of [TENANTS.vela, TENANTS.harbor]) {
      const t = generateTheme(input);
      for (const scheme of SCHEMES) {
        expect(t.schemes[scheme].roles['action.primary.bg']).toEqual({ hex: input.primary, ref: 'primary.9' });
        expect(t.schemes[scheme].roles['action.primary.fg'].hex).toBe('#ffffff');
      }
    }
  });

  it('pure red keeps white labels in both schemes: dark deepens the fill to match light (ADR-006)', () => {
    const t = generateTheme({ ...TENANTS.harbor, primary: '#ff0000', accent: '#ff0000' });
    expectValidTheme(t);
    const light = t.schemes.light.roles;
    const dark = t.schemes.dark.roles;
    expect(light['action.primary.fg'].hex).toBe('#ffffff');
    expect(dark['action.primary.fg'].hex).toBe('#ffffff');
    expect(dark['action.primary.bg'].hex).toBe(light['action.primary.bg'].hex);
    const adj = t.adjustments.find((a) => a.id === 'dark:action.primary.bg');
    expect(adj?.kind).toBe('choice');
    expect(adj?.message).toMatch(/to match light mode/);
  });

  it('dark keeps ink labels when light chose ink (orange), and never undoes the visibility lift (navy)', () => {
    const orange = generateTheme({ ...TENANTS.harbor, primary: '#ff5500', accent: '#ff5500' });
    for (const scheme of SCHEMES) expect(orange.schemes[scheme].roles['action.primary.fg'].hex).not.toBe('#ffffff');
    const navy = generateTheme({ ...TENANTS.harbor, primary: '#0b1f5c', accent: '#0b1f5c' });
    expectValidTheme(navy);
    expect(navy.adjustments.find((a) => a.id === 'dark:action.primary.bg')?.kind).toBe('visibility');
  });

  it('glass: the most translucent overlay where text still reaches 4.5:1 over black and white', () => {
    const t = generateTheme(TENANTS.vela);
    for (const scheme of SCHEMES) {
      const { roles, glass } = t.schemes[scheme];
      const worst = (o: number) => Math.min(glassWorstRatio(roles['surface.raised'].hex, roles['text.subtle'].hex, o), glassWorstRatio(roles['surface.raised'].hex, roles['text.default'].hex, o));
      expect(worst(glass.opacity)).toBeGreaterThanOrEqual(4.5);
      if (glass.opacity > 0.6) expect(worst(glass.opacity - 0.01)).toBeLessThan(4.5);
    }
  });

  it('Qamar: ink button labels (choice) and a deeper focus ring (contrast), explained with hexes', () => {
    const t = generateTheme(TENANTS.qamar);
    const ink = t.adjustments.find((a) => a.id === 'light:action.primary.fg');
    expect(ink).toBeDefined();
    expect(ink!.kind).toBe('choice');
    expect(ink!.label).toBe('Button label');
    expect(ink!.fromHex).toBe('#ffffff');
    expect(ink!.toHex).toBe(t.schemes.light.roles['action.primary.fg'].hex);
    expect(ink!.message).toMatch(/#f2a516/);
    expect(ink!.message).toMatch(/ink #[0-9a-f]{6}/);
    expect(ink!.message).toMatch(/\d+\.\d:1/);
    // The brand colour itself stays on the button.
    expect(t.schemes.light.roles['action.primary.bg'].hex).toBe('#f2a516');

    const ring = t.adjustments.find((a) => a.id === 'light:focus.ring');
    expect(ring).toBeDefined();
    expect(ring!.kind).toBe('contrast');
    expect(ring!.label).toBe('Focus ring');
    expect(ring!.fromHex).toBe('#f2a516');
    expect(ring!.message.length).toBeGreaterThan(20);
    expect(ring!.message).toContain('#f2a516');
    expect(ring!.message).toContain(ring!.toHex);
    expect(ring!.ratioBefore!).toBeLessThan(3);
    expect(ring!.ratioAfter!).toBeGreaterThanOrEqual(3);
    const resolvedRing = t.schemes.light.roles['focus.ring'];
    expect(resolvedRing.hex).toBe(ring!.toHex);
    expect(resolvedRing.adjusted).toMatchObject({ fromHex: '#f2a516', fromRef: 'primary.9', adjustmentId: ring!.id });
  });

  it('the system palette needs no solver help: feedback and secondary labels are never adjusted', () => {
    for (const input of Object.values(TENANTS)) {
      const t = generateTheme(input);
      expect(t.adjustments.filter((a) => a.role.startsWith('feedback.') || a.role.startsWith('action.secondary.'))).toEqual([]);
      for (const scheme of SCHEMES) {
        const r = t.schemes[scheme].roles;
        const ink = scheme === 'light' ? 'neutral.12' : 'neutral.1';
        expect(r['feedback.warning.onSolid'].ref).toBe(ink);
        for (const f of ['success', 'danger', 'info'] as const) expect(r[`feedback.${f}.onSolid`]).toEqual({ hex: '#ffffff' });
        for (const f of FEEDBACK_NAMES) {
          expect(r[`feedback.${f}.solid`]).toEqual({ hex: feedbackBaseHex(f), ref: `${f}.9` });
          expect(r[`feedback.${f}.fg`].ref).toBe(`${f}.11`);
        }
        expect(r['action.secondary.fg'].ref).toBe(scheme === 'light' ? 'primary.12' : 'primary.11');
        expect(r['action.secondary.fg'].adjusted).toBeUndefined();
      }
    }
  });

  it('only brand-driven adjustments remain for the three tenants', () => {
    const ids = (input: BrandInput) => generateTheme(input).adjustments.map((a) => `${a.id} ${a.kind}`);
    expect(ids(TENANTS.vela)).toEqual(['light:accent.fg choice', 'dark:accent.fg choice', 'dark:focus.ring contrast']);
    expect(ids(TENANTS.harbor)).toEqual(['light:accent.fg choice', 'dark:accent.fg choice', 'dark:focus.ring contrast']);
    expect(ids(TENANTS.qamar)).toEqual(['light:action.primary.fg choice', 'light:focus.ring contrast', 'dark:action.primary.fg choice']);
  });

  it('summary carries token count and timing', () => {
    const t = generateTheme(TENANTS.vela);
    expect(t.summary.tokenCount).toBe(countTokens());
    expect(t.summary.generationMs).toBeGreaterThanOrEqual(0);
    expect(t.summary.generationMs).toBeLessThan(1000);
  });

  it('attaches foundations for the shape, the type pair and scheme shadows', () => {
    const t = generateTheme(TENANTS.qamar);
    expect(t.foundations.radius).toEqual(radiusForShape('round'));
    expect(t.typePair).toEqual(TYPE_PAIRS['bilingual-round']);
    expect(t.schemes.light.shadows.raised).toContain('rgb(16 24 40');
    expect(t.schemes.dark.shadows.overlay).toContain('rgb(0 0 0 / 0.60)');
    // Returned objects are copies: mutating one theme cannot leak into the next.
    t.foundations.radius.button = 1;
    t.typePair.googleFamilies.push('X');
    const again = generateTheme(TENANTS.qamar);
    expect(again.foundations.radius.button).toBe(9999);
    expect(again.typePair.googleFamilies).not.toContain('X');
  });
});

describe('normalizeBrandInput', () => {
  it('lowercases/expands hexes and defaults accent to primary', () => {
    const r = normalizeBrandInput({ name: ' Test ', primary: '#ABC', neutral: 'cool', shape: 'soft', typePair: 'calm', density: 'compact' });
    expect(r).toEqual({ name: 'Test', primary: '#aabbcc', accent: '#aabbcc', neutral: 'cool', shape: 'soft', typePair: 'calm', density: 'compact' });
    expect(normalizeBrandInput({ ...TENANTS.vela, accent: '' }).accent).toBe('#3d45d6');
    expect(normalizeBrandInput({ ...TENANTS.vela, accent: '12B5A6' }).accent).toBe('#12b5a6');
  });

  it('throws on invalid hexes and enum values', () => {
    expect(() => normalizeBrandInput({ ...TENANTS.vela, primary: 'blue' })).toThrow(/Invalid hex/);
    expect(() => normalizeBrandInput({ ...TENANTS.vela, accent: '#12' })).toThrow(/Invalid hex/);
    expect(() => normalizeBrandInput({ ...TENANTS.vela, neutral: 'hot' as never })).toThrow(/neutral/);
    expect(() => normalizeBrandInput({ ...TENANTS.vela, shape: 'blob' as never })).toThrow(/shape/);
    expect(() => normalizeBrandInput({ ...TENANTS.vela, typePair: 'comic' as never })).toThrow(/typePair/);
    expect(() => normalizeBrandInput({ ...TENANTS.vela, density: 'airy' as never })).toThrow(/density/);
  });
});

describe('countTokens', () => {
  it('matches the documented formula', () => {
    expect(ROLES.length).toBe(48);
    expect(countTokens()).toBe(2 * 7 * 12 + 2 * 48 + 6 + 4 + 12 + 11 + 5 + 3 + 9 + 3 + 4 + 4 + 2 + 12);
    expect(countTokens()).toBe(339);
  });
});

describe('foundations', () => {
  it('radius follows shape', () => {
    expect(radiusForShape('sharp')).toEqual({ button: 8, field: 8, container: 12, badge: 6, pill: 9999 });
    expect(radiusForShape('soft')).toEqual({ button: 12, field: 12, container: 20, badge: 8, pill: 9999 });
    expect(radiusForShape('round')).toEqual({ button: 9999, field: 18, container: 28, badge: 9999, pill: 9999 });
    expect(() => radiusForShape('blob' as never)).toThrow();
  });

  it('FOUNDATIONS is the soft set, frozen, and on the 4pt grid', () => {
    expect(FOUNDATIONS.radius).toEqual(radiusForShape('soft'));
    expect(Object.isFrozen(FOUNDATIONS.space)).toBe(true);
    for (const v of Object.values(FOUNDATIONS.space)) expect(v % 4).toBe(0);
    expect(FOUNDATIONS.density.comfortable).toEqual({ controlHeight: 40, controlPaddingInline: 16, tableRowHeight: 48, cardInset: 28, sectionGap: 28, fieldGap: 16 });
    expect(FOUNDATIONS.density.compact).toEqual({ controlHeight: 32, controlPaddingInline: 12, tableRowHeight: 40, cardInset: 20, sectionGap: 20, fieldGap: 12 });
    expect(FOUNDATIONS.lineHeight.normal).toBe(1.5);
    expect(foundationsForShape('sharp')).toEqual({ ...FOUNDATIONS, radius: radiusForShape('sharp') });
  });
});

describe('type pairs', () => {
  it('has nine pairs with fallbacks; Arabic-capable pairs use zero tracking', () => {
    expect(Object.keys(TYPE_PAIRS)).toHaveLength(9);
    for (const [id, p] of Object.entries(TYPE_PAIRS)) {
      expect(p.id).toBe(id);
      expect(p.heading).toMatch(/(sans-serif|serif)$/);
      expect(p.body).toMatch(/(sans-serif|serif)$/);
      expect(p.mono).toMatch(/monospace$/);
      if (p.supportsArabic) {
        expect(p.headingTracking).toBe('0');
        expect(p.body).toMatch(/"IBM Plex Sans"|"Noto Sans"/);
      }
      for (const fam of p.googleFamilies) expect(`${p.heading}${p.body}${p.mono}`).toContain(`"${fam}"`);
    }
    expect(Object.values(TYPE_PAIRS).filter((p) => p.supportsArabic).length).toBeGreaterThanOrEqual(1);
  });

  it('builds a css2 Google Fonts URL', () => {
    expect(googleFontsHref(TYPE_PAIRS.precise)).toBe(
      'https://fonts.googleapis.com/css2?family=Inter+Tight:wght@400;500;600;700&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap',
    );
    const friendly = googleFontsHref(TYPE_PAIRS.friendly);
    expect(friendly.match(/Plus\+Jakarta\+Sans/g)).toHaveLength(1);
    expect(googleFontsHref(TYPE_PAIRS['bilingual-round'])).toContain('family=IBM+Plex+Sans+Arabic:wght@400;500;600;700');
  });
});

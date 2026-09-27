import { describe, expect, it } from 'vitest';
import { toCssVariables, writeColorVars, writeDensityVars, writeShadowVars } from '../src/css-vars';
import { toCSS } from '../src/export/css';
import { countLeafTokens, toDTCG } from '../src/export/dtcg';
import { toFigmaFiles } from '../src/export/figma';
import { parseCubicBezier, parseShadow, splitFontStack } from '../src/export/util';
import { ROLES, roleToCssVar } from '../src/types';
import type { Theme } from '../src/types';
import {
  FIXTURE_FOCUS_RING_LIGHT,
  collectLeaves,
  contractCssVars,
  contractFoundationVars,
  cssVarProblems,
  dtcgProblems,
  dtcgRoleProblems,
  figmaFileNames,
  figmaIndex,
  figmaProblems,
  figmaStarterCollections,
  figmaStarterProblems,
  makeFixtureTheme,
  parseFigmaFileName,
  parseCss,
  resolveAlias,
  resolveFigmaAlias,
} from './fixture';

const theme = makeFixtureTheme();
const compactTheme: Theme = { ...theme, input: { ...theme.input, density: 'compact' } };

describe('CSS variable contract (parsed from types.ts)', () => {
  it('parses every non-colour contract variable', () => {
    const vars = contractFoundationVars();
    expect(vars).toHaveLength(76);
    expect(vars).toContain('--strata-chart-4');
    expect(vars).toContain('--strata-chart-grid');
    expect(vars).toContain('--strata-space-16');
    expect(vars).toContain('--strata-font-heading-tracking');
    expect(vars).toContain('--strata-motion-easing');
    expect(vars).toContain('--strata-field-gap');
  });
});

describe('toCssVariables', () => {
  it.each(['light', 'dark'] as const)('returns every contract variable with valid values (%s)', (scheme) => {
    const vars = toCssVariables(theme, scheme);
    expect(cssVarProblems(vars, theme, scheme)).toEqual([]);
    expect(Object.keys(vars).sort()).toEqual(contractCssVars().sort());
    expect(Object.keys(vars).every((k) => k.startsWith('--strata-'))).toBe(true);
  });

  it.each(['light', 'dark'] as const)('every var() inside a value points at a variable it defines (%s)', (scheme) => {
    const vars = toCssVariables(theme, scheme);
    const refs = Object.values(vars).flatMap((v) => [...v.matchAll(/var\((--[\w-]+)/g)].map((m) => m[1]!));
    expect(refs.filter((r) => !(r in vars))).toEqual([]);
  });

  it('sheen keeps text.subtle ≥ 4.5:1 at its brightest pixel (dark), across tenants-like fuzz brands', async () => {
    const { fuzzInputs } = await import('../scripts/fuzz');
    const { generateTheme } = await import('../src/theme');
    const { contrastRatio, hexToRgb8, rgb8ToHex } = await import('../src/color');
    const peak = Number(/(\d+)%, transparent\) 20%/.exec(toCssVariables(generateTheme(fuzzInputs()[0]!), 'dark')['--strata-sheen']!)![1]) / 100;
    const mix = (a: string, b: string) => {
      const A = hexToRgb8(a);
      const B = hexToRgb8(b);
      return rgb8ToHex([0, 1, 2].map((i) => A[i]! * (1 - peak) + B[i]! * peak) as [number, number, number]);
    };
    let worst = Infinity;
    for (const input of fuzzInputs()) {
      const r = generateTheme(input).schemes.dark.roles;
      for (const s of ['surface.raised', 'surface.default'] as const) {
        worst = Math.min(worst, contrastRatio(r['text.subtle'].hex, mix(r[s].hex, r['text.default'].hex)));
      }
    }
    expect(worst).toBeGreaterThanOrEqual(4.5);
  });

  it('formats values CSS-ready', () => {
    const v = toCssVariables(theme, 'light');
    expect(v['--strata-space-0']).toBe('0px');
    expect(v['--strata-space-4']).toBe('16px');
    expect(v['--strata-radius-pill']).toBe('9999px');
    expect(v['--strata-font-size-2xl']).toBe('24px');
    expect(v['--strata-line-height-normal']).toBe('1.5');
    expect(v['--strata-font-weight-semibold']).toBe('600');
    expect(v['--strata-motion-duration-fast']).toBe('120ms');
    expect(v['--strata-motion-duration-normal']).toBe('200ms');
    expect(v['--strata-motion-easing']).toBe('cubic-bezier(0.2, 0, 0, 1)');
    expect(v['--strata-font-heading']).toBe(theme.typePair.heading);
    expect(v['--strata-font-mono']).toBe(theme.typePair.mono);
    expect(v['--strata-font-heading-tracking']).toBe('-0.01em');
    expect(v['--strata-shadow-raised']).toBe(theme.schemes.light.shadows.raised);
    expect(v['--strata-color-feedback-success-on-solid']).toBe(theme.schemes.light.roles['feedback.success.onSolid'].hex);
    expect(v['--strata-color-focus-ring']).toBe(FIXTURE_FOCUS_RING_LIGHT);
  });

  it('uses the scheme and density arguments', () => {
    expect(toCssVariables(theme, 'dark')['--strata-shadow-overlay']).toBe(theme.schemes.dark.shadows.overlay);
    expect(toCssVariables(theme, 'light')['--strata-control-height']).toBe('40px');
    expect(toCssVariables(theme, 'light', 'compact')['--strata-control-height']).toBe('32px');
    expect(toCssVariables(compactTheme, 'light')['--strata-table-row-height']).toBe('36px');
  });
});

describe('toCSS', () => {
  const css = toCSS(theme);
  const rules = parseCss(css);
  const find = (selector: string, at: string | null = null) => rules.find((r) => r.selector === selector && r.at === at);

  it('starts with the generated-file banner', () => {
    expect(css.split('\n')[0]).toBe('/* Strata theme: Fixture — generated by @strata/theme-engine 0.1.0. Do not edit by hand. */');
  });

  it('base block = light scheme + foundations + default density', () => {
    const base = find(':root');
    expect(base).toBeDefined();
    const { 'color-scheme': cs, ...vars } = base!.decls;
    expect(cs).toBe('light');
    expect(vars).toEqual(toCssVariables(theme, 'light', 'comfortable'));
  });

  it('dark block and prefers-color-scheme auto block carry dark colours + shadows', () => {
    const expected = { 'color-scheme': 'dark', ...writeColorVars({}, theme, 'dark'), ...writeShadowVars({}, theme, 'dark') };
    expect(find(':root[data-strata-scheme="dark"]')?.decls).toEqual(expected);
    expect(css).toContain('@media (prefers-color-scheme: dark)');
    expect(find(':root[data-strata-scheme="auto"]', '@media (prefers-color-scheme: dark)')?.decls).toEqual(expected);
  });

  it('emits a compact density override', () => {
    expect(find(':root[data-strata-density="compact"]')?.decls).toEqual(writeDensityVars({}, theme, 'compact'));
  });

  it('declares every role variable in light, dark and auto blocks', () => {
    for (const role of ROLES) {
      const name = roleToCssVar(role);
      expect(css.match(new RegExp(`${name}:`, 'g'))?.length, name).toBe(3);
    }
  });

  it('uses compact as the base when the tenant defaults to compact', () => {
    const r = parseCss(toCSS(compactTheme));
    const base = r.find((x) => x.selector === ':root');
    expect(base?.decls['--strata-control-height']).toBe('32px');
    const override = r.find((x) => x.selector === ':root[data-strata-density="comfortable"]');
    expect(override?.decls).toEqual(writeDensityVars({}, theme, 'comfortable'));
    expect(r.some((x) => x.selector.includes('data-strata-density="compact"'))).toBe(false);
  });

  it('appends mode attributes directly to an attribute selector', () => {
    const scoped = toCSS(theme, { selector: '[data-strata-theme="vela"]' });
    const r = parseCss(scoped);
    const sels = r.map((x) => x.selector);
    expect(sels).toEqual([
      '[data-strata-theme="vela"]',
      '[data-strata-theme="vela"][data-strata-scheme="dark"]',
      '[data-strata-theme="vela"][data-strata-scheme="auto"]',
      '[data-strata-theme="vela"][data-strata-density="compact"]',
      '[data-strata-theme="vela"]',
    ]);
    expect(scoped).not.toContain(':root');
  });

  it('appends to each selector in a selector list', () => {
    const r = parseCss(toCSS(theme, { selector: ':root, .strata' }));
    expect(r[1]?.selector).toBe(':root[data-strata-scheme="dark"], .strata[data-strata-scheme="dark"]');
  });
});

describe('toDTCG', () => {
  const doc = toDTCG(theme);
  const leaves = collectLeaves(doc);

  it('has exactly 339 leaf tokens in the documented structure', () => {
    expect(countLeafTokens(doc)).toBe(339);
    expect(leaves).toHaveLength(339);
    const count = (prefix: string) => leaves.filter((l) => l.path.startsWith(prefix)).length;
    expect(count('primitive.color.')).toBe(2 * 7 * 12);
    expect(count('semantic.light.color.')).toBe(48);
    expect(count('semantic.dark.color.')).toBe(48);
    expect(count('semantic.light.shadow.') + count('semantic.dark.shadow.')).toBe(6);
    expect(count('semantic.light.glass.') + count('semantic.dark.glass.')).toBe(4);
    expect(count('semantic.light.chart.') + count('semantic.dark.chart.')).toBe(12);
    expect(count('foundation.space.')).toBe(11);
    expect(count('foundation.radius.')).toBe(5);
    expect(count('foundation.font.family.')).toBe(3);
    expect(count('foundation.font.size.')).toBe(9);
    expect(count('foundation.font.lineHeight.')).toBe(3);
    expect(count('foundation.font.weight.')).toBe(4);
    expect(count('foundation.motion.duration.')).toBe(4);
    expect(count('foundation.motion.easing.')).toBe(2);
    expect(count('density.')).toBe(12);
  });

  it('every leaf has a resolvable $type, valid value, and every alias resolves', () => {
    expect(dtcgProblems(doc)).toEqual([]);
  });

  it('colour values use the 2025.10 object shape with hex', () => {
    const tok = resolveAlias(doc, '{primitive.color.light.primary.9}');
    const hex = theme.schemes.light.ramps.primary[8]!;
    const n = parseInt(hex.slice(1), 16);
    expect(tok?.$value).toEqual({
      colorSpace: 'srgb',
      components: [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255].map((c) => Math.round(c * 1e4) / 1e4),
      hex,
    });
  });

  it('semantic roles alias ramp steps and resolve to the theme hex; adjusted roles explain why', () => {
    expect(dtcgRoleProblems(doc, theme)).toEqual([]);
    const sem = doc.semantic as any;
    expect(sem.light.color.action.primary.bg).toEqual({ $type: 'color', $value: '{primitive.color.light.primary.9}' });
    expect(sem.light.color.feedback.success.onSolid.$value).toMatchObject({ hex: '#ffffff' });
    // Adjusted to a literal value.
    expect(sem.light.color.focus.ring.$value).toMatchObject({ colorSpace: 'srgb', hex: FIXTURE_FOCUS_RING_LIGHT });
    expect(sem.light.color.focus.ring.$extensions['com.strata.adjusted']).toMatchObject({
      from: '{primitive.color.light.primary.8}',
      reason: theme.adjustments[0]!.message,
    });
    // Adjusted along the ramp: still an alias, still explained.
    expect(sem.dark.color.text.brand.$value).toBe('{primitive.color.dark.primary.12}');
    expect(sem.dark.color.text.brand.$extensions['com.strata.adjusted'].reason).toBe(theme.adjustments[1]!.message);
  });

  it('exports foundations with DTCG composite types', () => {
    const f = doc.foundation as any;
    expect(f.space['4']).toEqual({ $type: 'dimension', $value: { value: 16, unit: 'px' } });
    expect(f.radius.pill.$value).toEqual({ value: 9999, unit: 'px' });
    expect(f.font.family.heading.$value).toEqual(['Inter Tight', 'Inter', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif']);
    expect(f.font.weight.bold).toEqual({ $type: 'fontWeight', $value: 700 });
    expect(f.font.lineHeight.normal).toEqual({ $type: 'number', $value: 1.5 });
    expect(f.motion.duration.fast.$value).toEqual({ value: 120, unit: 'ms' });
    expect(f.motion.easing.standard).toEqual({ $type: 'cubicBezier', $value: [0.2, 0, 0, 1] });
    expect((doc.density as any).compact.controlHeight.$value).toEqual({ value: 32, unit: 'px' });
  });

  it('parses shadows into composite values (array for multi-layer)', () => {
    const sem = doc.semantic as any;
    const raised = sem.light.shadow.raised.$value;
    expect(Array.isArray(raised)).toBe(true);
    expect(raised[0]).toEqual({
      color: { colorSpace: 'srgb', components: [0.0627, 0.0941, 0.1569], alpha: 0.06, hex: '#101828' },
      offsetX: { value: 0, unit: 'px' },
      offsetY: { value: 1, unit: 'px' },
      blur: { value: 2, unit: 'px' },
      spread: { value: 0, unit: 'px' },
    });
    const overlay = sem.light.shadow.overlay.$value;
    expect(overlay[0].spread).toEqual({ value: -4, unit: 'px' });
    const dark = sem.dark.shadow.raised.$value;
    expect(Array.isArray(dark)).toBe(false);
    expect(dark.color).toMatchObject({ hex: '#000000', alpha: 0.4 });
  });

  it('carries theme metadata in $extensions', () => {
    expect(doc.$description).toMatch(/^Strata theme for Fixture/);
    expect((doc.$extensions as any)['com.strata.theme']).toMatchObject({
      input: theme.input,
      generator: '@strata/theme-engine@0.1.0',
      headingTracking: '-0.01em',
    });
    expect(JSON.parse(JSON.stringify(doc))).toEqual(doc);
  });
});

describe('export util parsers', () => {
  it('parses legacy rgba(), hex alpha, inset and none shadows', () => {
    expect(parseShadow('inset 0 0 0 1px rgba(0, 0, 0, 0.5)')).toMatchObject({ inset: true, spread: { value: 1, unit: 'px' }, color: { alpha: 0.5 } });
    expect(parseShadow('0 2px 4px #00000080')).toMatchObject({ color: { hex: '#000000', alpha: 0.502 } });
    expect(parseShadow('none')).toMatchObject({ color: { alpha: 0 }, blur: { value: 0, unit: 'px' } });
    expect(() => parseShadow('0 1px 2px oklch(0.2 0 0)')).toThrow(/colour/);
  });
  it('parses easing keywords and font stacks', () => {
    expect(parseCubicBezier('ease-out')).toEqual([0, 0, 0.58, 1]);
    expect(splitFontStack(`'IBM Plex Sans Arabic', "Noto Sans", sans-serif`)).toEqual(['IBM Plex Sans Arabic', 'Noto Sans', 'sans-serif']);
  });
});

describe('toFigmaFiles', () => {
  const files = toFigmaFiles(theme);

  it('emits the 7 collection-mode files', () => {
    expect(Object.keys(files).sort()).toEqual(figmaFileNames('Fixture').sort());
  });

  it('uses hex strings / numbers; every alias resolves across files; roles resolve to the theme hex', () => {
    expect(figmaProblems(files, theme)).toEqual([]);
  });

  it('chains Semantic → Brand role layer → Brand ramp', () => {
    const r = resolveFigmaAlias(figmaIndex(files), '{role.light.action.primary.bg}');
    expect(r).toEqual({
      value: theme.schemes.light.roles['action.primary.bg'].hex,
      hops: ['Brand.Fixture.tokens.json:role.light.action.primary.bg', 'Brand.Fixture.tokens.json:color.light.primary.9'],
    });
  });

  it('matches the documented shapes', () => {
    const brand = files['Brand.Fixture.tokens.json'] as any;
    expect(brand.color.dark.neutral['12']).toEqual({ $type: 'color', $value: theme.schemes.dark.ramps.neutral[11] });
    expect(brand.role.light.action.primary.bg).toEqual({ $type: 'color', $value: '{color.light.primary.9}' });
    expect(brand.role.light.surface.default).toEqual({ $type: 'color', $value: '#ffffff' });
    // Adjusted to a literal value / along the ramp: the solver's message rides along as $description.
    expect(brand.role.light.focus.ring).toEqual({
      $type: 'color',
      $value: FIXTURE_FOCUS_RING_LIGHT,
      $description: theme.adjustments[0]!.message,
    });
    expect(brand.role.dark.text.brand).toEqual({
      $type: 'color',
      $value: '{color.dark.primary.12}',
      $description: theme.adjustments[1]!.message,
    });

    const light = files['Semantic.Light.tokens.json'] as any;
    expect(light.color.action.primary.bg).toEqual({ $type: 'color', $value: '{role.light.action.primary.bg}' });
    expect(light.color.feedback.success.onSolid.$value).toBe('{role.light.feedback.success.onSolid}');
    expect((files['Semantic.Dark.tokens.json'] as any).color.text.brand).toEqual({ $type: 'color', $value: '{role.dark.text.brand}' });
    expect(JSON.stringify(light)).not.toMatch(/#[0-9a-f]{6}|Fixture/);

    expect((files['Shape.Fixture.tokens.json'] as any).radius.button).toEqual({ $type: 'number', $value: 8 });
    expect((files['Density.Compact.tokens.json'] as any).density.tableRowHeight).toEqual({ $type: 'number', $value: 36 });
    const type = files['Type.Fixture.tokens.json'] as any;
    expect(type.font.family.heading).toEqual({ $type: 'string', $value: 'Inter Tight' });
    expect(type.font.size['3xl'].$value).toBe(32);
    expect(type.font.weight.medium.$value).toBe(500);
    expect(brand.$description).toMatch(/^Figma collection "Brand", mode "Fixture"/);
    expect(light.$description).toMatch(/^Figma collection "Semantic", mode "Light"/);
  });

  it('Semantic files do not depend on the brand', () => {
    const other: Theme = structuredClone(theme);
    other.input.name = 'Other';
    other.schemes.light.roles['action.primary.bg'] = { hex: '#123456' };
    other.schemes.dark.roles['focus.ring'] = { hex: other.schemes.dark.ramps.accent[8]!, ref: 'accent.9' };
    const b = toFigmaFiles(other);
    expect(b['Semantic.Light.tokens.json']).toEqual(files['Semantic.Light.tokens.json']);
    expect(b['Semantic.Dark.tokens.json']).toEqual(files['Semantic.Dark.tokens.json']);
    expect(figmaProblems(b, other)).toEqual([]);
  });

  it('flags an alias that does not resolve', () => {
    const broken = structuredClone(files) as any;
    broken['Brand.Fixture.tokens.json'].role.light.text.brand.$value = '{color.light.primary.13}';
    expect(figmaProblems(broken, theme).some((p) => p.includes('{color.light.primary.13} matches 0 tokens'))).toBe(true);
  });
});

describe("toFigmaFiles(theme, { modes: 'single' }) — Figma Starter layout", () => {
  const files = toFigmaFiles(theme, { modes: 'single' });

  it('multi stays the default: no options, {} and { modes: "multi" } give the same output', () => {
    const plain = toFigmaFiles(theme);
    expect(toFigmaFiles(theme, {})).toEqual(plain);
    expect(toFigmaFiles(theme, { modes: 'multi' })).toEqual(plain);
    expect(JSON.stringify(toFigmaFiles(theme, { modes: 'multi' }))).toBe(JSON.stringify(plain));
    expect(Object.keys(plain).sort()).toEqual(figmaFileNames('Fixture').sort());
  });

  it('every collection has exactly one mode, "Value", and every file name parses', () => {
    const parsed = Object.keys(files).map(parseFigmaFileName);
    expect(parsed.every(Boolean)).toBe(true);
    expect(parsed.map((p) => p!.mode)).toEqual(['Value', 'Value', 'Value', 'Value']);
    expect(parsed.map((p) => p!.collection)).toEqual(figmaStarterCollections('Fixture', theme.input.density));
    expect(new Set(parsed.map((p) => p!.collection)).size).toBe(parsed.length);
  });

  it('every role is the theme hex; ramps and both densities present; no aliases', () => {
    expect(figmaStarterProblems(files, theme)).toEqual([]);
    expect(JSON.stringify(files)).not.toMatch(/"\{/);
  });

  it('matches the documented shapes', () => {
    const light = files['Fixture · Light.Value.tokens.json'] as any;
    expect(light.color.action.primary.bg).toEqual({ $type: 'color', $value: theme.schemes.light.roles['action.primary.bg'].hex });
    expect(light.color.focus.ring).toEqual({ $type: 'color', $value: FIXTURE_FOCUS_RING_LIGHT, $description: theme.adjustments[0]!.message });
    expect(light.ramp.neutral['12']).toEqual({ $type: 'color', $value: theme.schemes.light.ramps.neutral[11] });
    const size = files['Fixture · Size.Value.tokens.json'] as any;
    expect(size.radius.button).toEqual({ $type: 'number', $value: 8 });
    expect(size.font.family.heading).toEqual({ $type: 'string', $value: 'Inter Tight' });
    expect(size.density.tableRowHeight.$value).toBe(theme.foundations.density[theme.input.density].tableRowHeight);
    expect(light.$description).toMatch(/^Figma collection "Fixture · Light", mode "Value"/);
    expect(light.$description).toContain('Switch brands by swapping libraries or collections, not modes.');
  });

  it('puts the default density in Size and the other in its own collection (compact brand)', () => {
    const c = toFigmaFiles(compactTheme, { modes: 'single' });
    expect(Object.keys(c)).toContain('Fixture · Size comfortable.Value.tokens.json');
    expect(figmaStarterProblems(c, compactTheme)).toEqual([]);
  });

  it('flags an alias, a wrong hex and a second mode', () => {
    const broken = structuredClone(files) as any;
    broken['Fixture · Dark.Value.tokens.json'].color.text.brand.$value = '{ramp.primary.12}';
    broken['Fixture · Light.Value.tokens.json'].color.surface.canvas.$value = '#000001';
    broken['Fixture · Light.Other.tokens.json'] = { $description: 'x' };
    const p = figmaStarterProblems(broken, theme);
    expect(p.some((x) => x.includes('alias {ramp.primary.12}'))).toBe(true);
    expect(p.some((x) => x.includes('surface.canvas: #000001'))).toBe(true);
    expect(p.some((x) => x.includes('Fixture · Light: modes'))).toBe(true);
  });
});

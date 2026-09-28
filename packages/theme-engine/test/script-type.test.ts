/**
 * Per-script type tokens (ADR-020): the Devanagari pair carries its own line heights and caps tracking; every exporter
 * reads them from theme.foundations, and the Latin and Arabic pairs' output is byte-identical to before the pair existed.
 */
import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { FOUNDATIONS, foundationsForShape } from '../src/foundations';
import { countTokens, generateTheme } from '../src/theme';
import { TYPE_PAIRS, googleFontsHref } from '../src/type-pairs';
import { toCssVariables } from '../src/css-vars';
import { toCSS } from '../src/export/css';
import { countLeafTokens, toDTCG } from '../src/export/dtcg';
import { toFigmaFiles } from '../src/export/figma';
import { toShadcnCSS } from '../src/export/shadcn';
import type { BrandInput, TypePairId } from '../src/types';
import { FUZZ_SEED, FUZZ_THEMES, fuzzInputs, runFuzz } from '../scripts/fuzz';

/** tenants/haat/brand.json */
const HAAT: BrandInput = { name: 'Haat', primary: '#B5179E', accent: '#F48C06', neutral: 'warm', shape: 'soft', typePair: 'bilingual-devanagari', density: 'comfortable' };

const sha = (s: string) => createHash('sha256').update(s).digest('hex');

describe('bilingual-devanagari type pair', () => {
  const pair = TYPE_PAIRS['bilingual-devanagari'];

  it('is Mukta for Devanagari and Latin, with measured script tokens', () => {
    expect(pair.heading.startsWith('"Mukta", ')).toBe(true);
    expect(pair.body.startsWith('"Mukta", ')).toBe(true);
    expect(pair.body).toMatch(/"Nirmala UI"/);
    expect(pair.supportsArabic).toBe(false);
    // Values from `node scripts/check-script-clipping.mjs --pairs=bilingual-devanagari --lh=<value>` (see type-pairs.ts).
    expect(pair.script).toEqual({ name: 'devanagari', lineHeight: { tight: 1.44, snug: 1.44, normal: 1.5 }, minFontSize: 12, capsTracking: '0' });
    expect(googleFontsHref(pair)).toBe(
      'https://fonts.googleapis.com/css2?family=Mukta:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap',
    );
  });

  it('only a pair with script tokens changes foundations', () => {
    expect(foundationsForShape('soft', TYPE_PAIRS.precise)).toEqual(FOUNDATIONS);
    const f = foundationsForShape('soft', pair);
    expect(f.lineHeight).toEqual({ tight: 1.44, snug: 1.44, normal: 1.5 });
    // 12px is already the smallest step, so the minimum size changes nothing today.
    expect(f.fontSize).toEqual(FOUNDATIONS.fontSize);
    expect({ ...f, lineHeight: FOUNDATIONS.lineHeight }).toEqual(FOUNDATIONS);
    // A raised minimum lifts only the steps below it.
    const raised = foundationsForShape('soft', { script: { ...pair.script!, minFontSize: 14 } });
    expect(raised.fontSize).toEqual({ ...FOUNDATIONS.fontSize, xs: 14, sm: 14 });
  });

  it('does not share the script object with TYPE_PAIRS', () => {
    const t = generateTheme(HAAT);
    t.typePair.script!.lineHeight.tight = 9;
    t.foundations.lineHeight.tight = 9;
    expect(pair.script!.lineHeight.tight).toBe(1.44);
    expect(generateTheme(HAAT).foundations.lineHeight.tight).toBe(1.44);
  });
});

describe('Haat: script tokens reach every exporter', () => {
  const theme = generateTheme(HAAT);

  it('passes every contrast check', () => {
    expect(theme.summary.failed).toBe(0);
    expect(theme.checks.every((c) => c.pass)).toBe(true);
  });

  it('CSS variables: Devanagari line heights, caps tracking 0, the same names as every tenant', () => {
    const v = toCssVariables(theme, 'light');
    expect(v['--strata-line-height-tight']).toBe('1.44');
    expect(v['--strata-line-height-snug']).toBe('1.44');
    expect(v['--strata-line-height-normal']).toBe('1.5');
    expect(v['--strata-font-tracking-caps']).toBe('0');
    expect(v['--strata-font-heading-tracking']).toBe('-0.01em');
    expect(v['--strata-font-size-xs']).toBe('12px');
    // The per-size curve is unchanged (it is 0 or negative; measured, it breaks no headline).
    const vela = toCssVariables(generateTheme({ ...HAAT, typePair: 'precise' }), 'light');
    for (const k of ['xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl', '4xl', '5xl']) expect(v[`--strata-font-tracking-${k}`]).toBe(vela[`--strata-font-tracking-${k}`]);
    // Same variable names, same order, as a Latin pair: consumers of toCssVariables need no change.
    expect(Object.keys(v)).toEqual(Object.keys(vela));
    const css = toCSS(theme, { selector: '[data-strata-theme="haat"]' });
    expect(css).toContain('--strata-line-height-tight: 1.44;');
    expect(css).toContain('--strata-font-tracking-caps: 0;');
  });

  it('DTCG: the same line heights, the token count still matches countTokens', () => {
    const doc = toDTCG(theme) as any;
    expect(doc.foundation.font.lineHeight.tight).toEqual({ $type: 'number', $value: 1.44 });
    expect(doc.foundation.font.lineHeight.snug).toEqual({ $type: 'number', $value: 1.44 });
    expect(doc.foundation.font.lineHeight.normal).toEqual({ $type: 'number', $value: 1.5 });
    expect(doc.$extensions['com.strata.theme'].typePair.script.name).toBe('devanagari');
    expect(countLeafTokens(doc)).toBe(countTokens());
    expect(theme.summary.tokenCount).toBe(countTokens());
  });

  it('Figma (multi-mode and Starter): the same line heights', () => {
    const multi = toFigmaFiles(theme) as any;
    expect(multi['Type.Haat.tokens.json'].font.lineHeight).toEqual({
      tight: { $type: 'number', $value: 1.44 },
      snug: { $type: 'number', $value: 1.44 },
      normal: { $type: 'number', $value: 1.5 },
    });
    const single = toFigmaFiles(theme, { modes: 'single' }) as any;
    expect(single['Haat · Size.Value.tokens.json'].font.lineHeight.tight.$value).toBe(1.44);
  });
});

describe('Latin and Arabic pairs are unchanged', () => {
  /**
   * sha256 (first 16 hex) of each exporter's output, recorded before the Devanagari pair was added, for fuzz brands 1–8
   * each forced onto one of the eight earlier pairs. Figma is not here: it gained font/lineHeight for every pair (a
   * deliberate addition, so Figma carries the per-script values too).
   */
  const BEFORE: [TypePairId, css: string, dtcg: string, shadcn: string, vars: string][] = [
    ['precise', '7aed923959149375', '369720695b934a0e', '7203e48671e064c4', 'c3bf6dd136ba245e'],
    ['calm', 'fda115060cb598db', '117db704cfb53a80', '9a41f46e44d2d587', '72b3aff1e01ba0c0'],
    ['friendly', '550ec64582d21c80', 'b2831508b917ff4d', 'cfbc094057853330', '892219e547f059b3'],
    ['technical', 'c9293988118cd8af', '746645f5baa3ac15', '6cf5405fc6bf1929', '0adf781546a76ee4'],
    ['bilingual-round', '8fea273b9c6b76c8', 'c2332213c2617733', '1e72eb77878be1fe', 'b08e31d85e29410b'],
    ['bilingual-classic', '36a5ca2c2cf14f53', '5ebe8b1ef3c4ac65', 'e3edde06adf4814b', '4d5586a9d57fa379'],
    ['editorial', '7d05b01949c22167', 'dc88936f26181110', 'be3d7739fa4c943b', 'f4dcd48f02950f7a'],
    ['modern', 'f99631d748927e97', '5bb338b500712beb', '522a9ddba219a067', '3df1ab4ac23a8293'],
  ];
  const inputs = fuzzInputs().slice(0, 8);

  it.each(BEFORE.map((row, i) => [row[0], i] as const))('%s: CSS, DTCG, shadcn and CSS variables are byte-identical', (id, i) => {
    const [, css, dtcg, shadcn, vars] = BEFORE[i]!;
    const input = { ...inputs[i]!, typePair: id };
    const t = generateTheme(input);
    const h = (s: string) => sha(s).slice(0, 16);
    expect(h(toCSS(t, { selector: `[data-x="${input.name}"]` }))).toBe(css);
    expect(h(JSON.stringify(toDTCG(t)))).toBe(dtcg);
    expect(h(toShadcnCSS(t))).toBe(shadcn);
    expect(h(JSON.stringify([toCssVariables(t, 'light'), toCssVariables(t, 'dark', 'compact'), toCssVariables(t, 'light', 'comfortable')]))).toBe(vars);
  });
});

describe('the fuzz still generates the same 1,000 brands', () => {
  it('its inputs hash to the value recorded before the pair was added', () => {
    // The fuzz draws type pairs from a frozen list of the first eight (scripts/fuzz.ts). Appending a pair to that
    // list would change which pair 487 of the 1,000 brands draw (measured 2026-09-28), though no colour output or fuzz number.
    expect(sha(JSON.stringify(fuzzInputs(FUZZ_SEED, FUZZ_THEMES)))).toBe('3f129b747f83d4b4c3df63d236e78839e1bdd20fc0f0579c5980bbdb952eb4f6');
  });

  it('the type pair never changes colour output, so every fuzz number holds for the Devanagari pair too', () => {
    const inputs = fuzzInputs().slice(0, 200);
    const colours = (input: BrandInput) => {
      const t = generateTheme(input);
      return JSON.stringify([t.schemes, t.adjustments, t.checks]);
    };
    for (const input of inputs) expect(colours({ ...input, typePair: 'bilingual-devanagari' })).toBe(colours(input));
    const a = runFuzz(inputs);
    const b = runFuzz(inputs.map((i) => ({ ...i, typePair: 'bilingual-devanagari' as const })));
    const strip = (r: typeof a) => ({ ...r, generationMs: null, failures: r.failures.length, invariantViolations: r.invariantViolations.length });
    expect(strip(b)).toEqual(strip(a));
  }, 60_000);
});

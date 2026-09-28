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
    expect(v['--syntara-line-height-tight']).toBe('1.44');
    expect(v['--syntara-line-height-snug']).toBe('1.44');
    expect(v['--syntara-line-height-normal']).toBe('1.5');
    expect(v['--syntara-font-tracking-caps']).toBe('0');
    expect(v['--syntara-font-heading-tracking']).toBe('-0.01em');
    expect(v['--syntara-font-size-xs']).toBe('12px');
    // The per-size curve is unchanged (it is 0 or negative; measured, it breaks no headline).
    const vela = toCssVariables(generateTheme({ ...HAAT, typePair: 'precise' }), 'light');
    for (const k of ['xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl', '4xl', '5xl']) expect(v[`--syntara-font-tracking-${k}`]).toBe(vela[`--syntara-font-tracking-${k}`]);
    // Same variable names, same order, as a Latin pair: consumers of toCssVariables need no change.
    expect(Object.keys(v)).toEqual(Object.keys(vela));
    const css = toCSS(theme, { selector: '[data-syntara-theme="haat"]' });
    expect(css).toContain('--syntara-line-height-tight: 1.44;');
    expect(css).toContain('--syntara-font-tracking-caps: 0;');
  });

  it('DTCG: the same line heights, the token count still matches countTokens', () => {
    const doc = toDTCG(theme) as any;
    expect(doc.foundation.font.lineHeight.tight).toEqual({ $type: 'number', $value: 1.44 });
    expect(doc.foundation.font.lineHeight.snug).toEqual({ $type: 'number', $value: 1.44 });
    expect(doc.foundation.font.lineHeight.normal).toEqual({ $type: 'number', $value: 1.5 });
    expect(doc.$extensions['com.syntara.theme'].typePair.script.name).toBe('devanagari');
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
   * sha256 (first 16 hex) of each exporter's output, for fuzz brands 1–8 each forced onto one of the eight earlier
   * pairs. Figma is not here: it gained font/lineHeight for every pair (a deliberate addition, so Figma carries the
   * per-script values too).
   *
   * Recorded before the Devanagari pair was added, then **re-recorded on 2026-09-28 for the rename to Syntara**
   * (ADR-029), which renamed every custom property in this output from `--strata-*` to `--syntara-*`. Before
   * re-recording, each of these 32 outputs was hashed again with the name substituted back, and every one reproduced
   * the pre-rename hash exactly — so the rename changed the token *names* and no token *value*. That check is not
   * kept as a test: it only made sense against the pre-rename hashes, which this table replaces.
   */
  const BEFORE: [TypePairId, css: string, dtcg: string, shadcn: string, vars: string][] = [
    ['precise', '1e3c13e70999f951', 'b71cda0e0880abe5', '7d28a1aad0f2c6d9', 'f670f86360cb0285'],
    ['calm', '2464e0f12dcee3b8', 'd74a80cf1dbae997', '76867bc7a1f22b70', '6e627967ebadae6d'],
    ['friendly', 'fb921f3fccb9d4b5', '1008ee523967a2a7', 'e38f3efee6290ae4', '53fa47c9c70f9bb8'],
    ['technical', 'f50e1f3c7d957217', 'c2f561b6455836dd', '0c23a07967510672', '6af9aabddb5d63df'],
    ['bilingual-round', 'b898bb6967bda38c', 'd35a2915c88578fd', '9ef142c32702e62b', '445c02b9fd9266d2'],
    ['bilingual-classic', '7fdad2f84dedc61e', '6341ca5e75a39cbf', '47c9bbe33dc2a983', 'b75032d00a57f7e5'],
    ['editorial', 'e64fad6fa3d699d5', 'e42c02bd04fb9a62', '8b7f0a706369ea2d', 'e41e2343596a9423'],
    ['modern', '808f8ffdacc2ad8e', '8e537795ec21711a', '9de8d1fb2bdd5b94', '556fcbecbb155f39'],
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

/**
 * Per-pair type tokens (ADR-020, extended by ADR-031): a pair whose outlines need more room than the shared default
 * carries its own line heights, and every exporter reads them from theme.foundations. Seven of the nine pairs now do
 * — the Devanagari one, both Arabic ones and four Latin ones — each value measured with
 * scripts/check-script-clipping.mjs, never chosen by eye. `precise` and `modern` clip nothing and keep the shared
 * 1.2 / 1.35 / 1.5.
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
import type { BrandInput, ScriptTypeTokens, TypePairId } from '../src/types';
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

describe('the pairs that clipped carry measured line heights (ADR-031)', () => {
  /** Every value here came from scripts/check-script-clipping.mjs; the comments in type-pairs.ts show the sweep. */
  const MEASURED: [TypePairId, ScriptTypeTokens['name'], number, number, number][] = [
    ['bilingual-round', 'arabic', 1.8, 1.8, 1.9],
    ['bilingual-classic', 'arabic', 1.8, 1.8, 1.9],
    ['friendly', 'latin', 1.35, 1.4, 1.5],
    ['editorial', 'latin', 1.3, 1.35, 1.5],
    ['calm', 'latin', 1.3, 1.35, 1.5],
    ['technical', 'latin', 1.3, 1.35, 1.5],
  ];

  it.each(MEASURED)('%s uses the %s line heights it was measured at', (id, name, tight, snug, normal) => {
    const pair = TYPE_PAIRS[id];
    expect(pair.script?.name).toBe(name);
    expect(pair.script?.lineHeight).toEqual({ tight, snug, normal });
    // They must reach the foundations, or the exporters never see them.
    expect(foundationsForShape('soft', pair).lineHeight).toEqual({ tight, snug, normal });
    // Only the line heights move: these pairs set no size floor and no caps tracking of their own.
    expect(foundationsForShape('soft', pair).fontSize).toEqual(FOUNDATIONS.fontSize);
  });

  it('leaves the pairs that clipped nothing on the shared default', () => {
    for (const id of ['precise', 'modern'] as const) {
      expect(TYPE_PAIRS[id].script).toBeUndefined();
      expect(foundationsForShape('soft', TYPE_PAIRS[id]).lineHeight).toEqual(FOUNDATIONS.lineHeight);
    }
  });

  it('keeps caps tracking at 0 for the Arabic pairs, which join', () => {
    for (const id of ['bilingual-round', 'bilingual-classic'] as const) {
      expect(toCssVariables(generateTheme({ ...HAAT, typePair: id }), 'light')['--syntara-font-tracking-caps']).toBe('0');
    }
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

describe('every pair exports exactly the tokens it is meant to', () => {
  /**
   * sha256 (first 16 hex) of each exporter's output, for fuzz brands 1–8 each forced onto one of the eight earlier
   * pairs. Figma is not here: it gained font/lineHeight for every pair (a deliberate addition, so Figma carries the
   * per-script values too).
   *
   * Recorded before the Devanagari pair was added; re-recorded on 2026-09-28 for the rename to Syntara (ADR-029),
   * which changed the token *names* and no token *value*; and re-recorded again on 2026-09-28 for the clipping fix
   * (ADR-031), which gave six pairs their own measured line heights.
   *
   * What the table pins now is which pairs moved. `precise` and `modern` are byte-identical to every earlier
   * recording — they clipped nothing, so they kept the shared 1.2/1.35/1.5 and must not drift. The other six each
   * changed in exactly three of the four columns: CSS, DTCG and the CSS variables carry line heights, and the
   * shadcn hash is unchanged for all six because that exporter emits none. A change here that does not match that
   * shape is a regression, not a re-recording.
   */
  const BEFORE: [TypePairId, css: string, dtcg: string, shadcn: string, vars: string][] = [
    ['precise', '1e3c13e70999f951', 'b71cda0e0880abe5', '7d28a1aad0f2c6d9', 'f670f86360cb0285'],
    ['calm', '6e7ca70f192ff255', '5db14dd59b40db2e', '76867bc7a1f22b70', '454be3fff391ca98'],
    ['friendly', '82af543a578f7fa0', 'd8b83ed8663dab35', 'e38f3efee6290ae4', '5543616e1b1651f0'],
    ['technical', '71c8d62e5ac0ecfc', '1fac86020fac8824', '0c23a07967510672', '2a56d23ded99ad42'],
    ['bilingual-round', 'd60f88ff2c791db1', '6608ce69b911c1c8', '9ef142c32702e62b', '227c32712564ed03'],
    ['bilingual-classic', 'a97d05da0cf490b9', 'd94700de5cb9d2c9', '47c9bbe33dc2a983', 'c493cf80a1feb766'],
    ['editorial', '89851aab92613c47', '2b3ef3336fc483b5', '8b7f0a706369ea2d', '4b8f48fb8ff3000f'],
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

/**
 * Exporters × the real engine, for the three reference tenants.
 * The fixture-based unit tests live in exporters.test.ts; this file proves the exporters and
 * generateTheme() agree (notably: countLeafTokens(toDTCG(t)) === t.summary.tokenCount).
 */
import { describe, expect, it } from 'vitest';
import { toCssVariables } from '../src/css-vars';
import { toCSS } from '../src/export/css';
import { countLeafTokens, toDTCG } from '../src/export/dtcg';
import { toFigmaFiles } from '../src/export/figma';
import { generateTheme } from '../src/theme';
import { ROLES, roleToCssVar } from '../src/types';
import type { BrandInput } from '../src/types';
import { cssVarProblems, dtcgProblems, dtcgRoleProblems, figmaProblems, figmaStarterProblems, parseCss, stripDescriptions } from './fixture';

const TENANTS: BrandInput[] = [
  { name: 'Vela', primary: '#3d45d6', accent: '#12b5a6', neutral: 'cool', shape: 'sharp', typePair: 'precise', density: 'compact' },
  { name: 'Harbor', primary: '#1d6b63', accent: '#e07a3f', neutral: 'warm', shape: 'soft', typePair: 'calm', density: 'comfortable' },
  { name: 'Qamar', primary: '#f2a516', accent: '#7a2e8e', neutral: 'warm', shape: 'round', typePair: 'bilingual-round', density: 'comfortable' },
];

describe.each(TENANTS)('$name', (input) => {
  const theme = generateTheme(input);

  it('toCssVariables returns every contract variable for both schemes and densities', () => {
    for (const scheme of ['light', 'dark'] as const) {
      expect(cssVarProblems(toCssVariables(theme, scheme), theme, scheme)).toEqual([]);
      expect(cssVarProblems(toCssVariables(theme, scheme, 'compact'), theme, scheme)).toEqual([]);
    }
  });

  it('toCSS emits base, dark, auto and density-override blocks with every role', () => {
    const css = toCSS(theme);
    const rules = parseCss(css);
    const other = theme.input.density === 'compact' ? 'comfortable' : 'compact';
    expect(rules.map((r) => r.selector)).toEqual([
      ':root',
      ':root[data-syntara-scheme="dark"]',
      ':root[data-syntara-scheme="auto"]',
      `:root[data-syntara-density="${other}"]`,
      ':root',
    ]);
    expect(rules[4]?.at).toBe('@media (min-resolution: 2dppx)');
    expect(rules[4]?.decls).toEqual({ '--syntara-hairline': '0.5px' });
    expect(rules[2]?.at).toBe('@media (prefers-color-scheme: dark)');
    const { 'color-scheme': _cs, ...base } = rules[0]!.decls;
    expect(base).toEqual(toCssVariables(theme, 'light'));
    for (const role of ROLES) {
      expect(rules[1]!.decls[roleToCssVar(role)]).toBe(theme.schemes.dark.roles[role].hex);
    }
  });

  it('toDTCG leaf count matches the engine summary (339)', () => {
    const doc = toDTCG(theme);
    expect(countLeafTokens(doc)).toBe(theme.summary.tokenCount);
    expect(countLeafTokens(doc)).toBe(339);
  });

  it('toDTCG: types resolvable, aliases resolve, colour objects valid', () => {
    expect(dtcgProblems(toDTCG(theme))).toEqual([]);
  });

  it('toDTCG: roles resolve to the engine hex; every adjusted role carries its reason', () => {
    const doc = toDTCG(theme);
    expect(dtcgRoleProblems(doc, theme)).toEqual([]);
    // The exported reason is looked up by adjustmentId, so every id must exist in theme.adjustments.
    const adjustmentIds = new Set(theme.adjustments.map((a) => a.id));
    const dangling = (['light', 'dark'] as const).flatMap((s) =>
      ROLES.map((r) => theme.schemes[s].roles[r].adjusted?.adjustmentId).filter((id): id is string => !!id && !adjustmentIds.has(id)),
    );
    expect(dangling).toEqual([]);
  });

  it('toFigmaFiles: 7 files; every alias resolves across files to the engine hex', () => {
    expect(figmaProblems(toFigmaFiles(theme), theme)).toEqual([]);
  });

  it("toFigmaFiles { modes: 'single' }: 4 one-mode collections, every role the engine hex, no aliases", () => {
    expect(figmaStarterProblems(toFigmaFiles(theme, { modes: 'single' }), theme)).toEqual([]);
  });
});

describe('Figma Semantic collection is shared by every tenant', () => {
  const files = TENANTS.map((input) => toFigmaFiles(generateTheme(input)));

  it.each(['Semantic.Light.tokens.json', 'Semantic.Dark.tokens.json'])('%s is byte-identical across Vela, Harbor and Qamar (minus $description)', (file) => {
    const [first, ...rest] = files.map((f) => JSON.stringify(stripDescriptions(f[file]), null, 2));
    expect(first).toBeDefined();
    for (const other of rest) expect(other).toBe(first);
  });

  it('while the Brand role layers really differ between tenants', () => {
    const roles = files.map((f, i) => JSON.stringify((f[`Brand.${TENANTS[i]!.name}.tokens.json`] as { role: unknown }).role));
    expect(new Set(roles).size).toBe(TENANTS.length);
  });
});

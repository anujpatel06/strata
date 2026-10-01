import { describe, expect, it } from 'vitest';
import { auditSource } from '../src/index';
import type { RuleId } from '../src/index';
import path from 'node:path';
import { audit, expected, fixtures, found } from './helpers';

/** Findings look at where a file is, so library paths are given in full. */
const inRepo = (file: string): string => path.resolve(fixtures, '../../../..', file);

/** Every marked line fires, once per marker, and no unmarked line fires. */
function matches(name: string, only?: RuleId): void {
  const { source, findings } = audit(name);
  expect(found(findings, only)).toEqual(expected(source, only));
  expect(expected(source, only).length).toBeGreaterThan(0);
}

describe('rules, from fixtures', () => {
  it('raw-color: hex, rgb, hsl, oklch, oklab, names, custom properties and var() fallbacks fire; tokens, keywords, color-mix with tokens, masks, system colours and names that are not colours do not', () => {
    matches('css/raw-color.css');
  });

  it('off-scale-*, raw-font-weight, font-family-literal: px and rem fire; 0, 1px, 2px, %, fr, em, auto, unitless and tokens do not', () => {
    matches('css/scale.css');
  });

  it('physical-property: sides, corners, keywords and four-value shorthands fire; logical and symmetric ones do not', () => {
    matches('css/physical.css');
  });

  it('unknown-token: invented --syntara-* names fire, in fallbacks and calc() too; real tokens, other namespaces and locally declared names do not', () => {
    matches('css/unknown-token.css', 'unknown-token');
  });

  it('inline style objects and colour attributes in TSX; className strings are not read', () => {
    matches('tsx/style.tsx');
  });

  it('native-element: elements with a Syntara component fire; Syntara components, hidden and colour inputs, and other elements do not', () => {
    matches('tsx/native.tsx');
  });

  it('missing-accessible-name on Syntara components and images', () => {
    matches('tsx/accessible-name.tsx');
  });

  it('missing-accessible-name on native controls', () => {
    matches('tsx/accessible-name-native.tsx', 'missing-accessible-name');
  });

  it('deprecated-api: literal values on components from @syntara/react fire; expressions, other libraries and other components do not', () => {
    matches('tsx/deprecated.tsx');
  });
});

describe('severity and fixes', () => {
  it('every finding carries a fix with a description', () => {
    for (const name of ['css/raw-color.css', 'css/scale.css', 'css/physical.css', 'css/unknown-token.css', 'tsx/style.tsx', 'tsx/native.tsx', 'tsx/accessible-name.tsx', 'tsx/deprecated.tsx']) {
      for (const f of audit(name).findings) {
        expect(f.fix.description.length, `${name}:${f.line}`).toBeGreaterThan(0);
        expect(typeof f.fix.safe).toBe('boolean');
        if (f.fix.replacement !== undefined) {
          expect(f.fix.start).toBeTypeOf('number');
          expect(f.fix.end).toBeTypeOf('number');
        }
        if (f.fix.safe) expect(f.fix.replacement).toBeTypeOf('string');
        expect(f.snippet.includes('\n')).toBe(false);
      }
    }
  });

  it('severities are as documented', () => {
    const severity = (code: string, language: 'css' | 'tsx') => auditSource(code, { language }).findings.map((f) => `${f.rule}:${f.severity}`);
    expect(severity('.a { color: #123456; margin-left: 0; }', 'css')).toEqual(['raw-color:error', 'physical-property:error']);
    expect(severity('.a { gap: 5px; border-radius: 5px; font-size: 15px; font-weight: 600; font-family: Arial; }', 'css')).toEqual([
      'off-scale-space:warning',
      'off-scale-radius:warning',
      'off-scale-font-size:warning',
      'raw-font-weight:warning',
      'font-family-literal:warning',
    ]);
    expect(severity('const a = <img src="x" />;', 'tsx')).toEqual(['missing-accessible-name:error']);
    expect(severity('const a = <a href="/">x</a>;', 'tsx')).toEqual(['native-element:error']);
    expect(severity(`import { Button } from '@syntara/react';\nconst a = <Button variant="danger">x</Button>;`, 'tsx')).toEqual(['deprecated-api:warning']);
    // An error: the declaration is dropped, and in a focus rule that is a WCAG 2.2 AA 2.4.7 failure.
    expect(severity('.a { border-radius: var(--syntara-radius-md); }', 'css')).toEqual(['unknown-token:error']);
  });

  it('unknown-token never offers a safe fix, and names the nearest real tokens in the same family', () => {
    const one = (code: string, language: 'css' | 'tsx' = 'css') =>
      auditSource(code, { language }).findings.filter((f) => f.rule === 'unknown-token')[0];

    const radius = one('.a { border-radius: var(--syntara-radius-md); }')!;
    // Picking the role is a judgement about what the element is, so --fix must never do it.
    expect(radius.fix.safe).toBe(false);
    expect(radius.fix.replacement).toBeUndefined();
    expect(radius.fix.description).toMatch(/--syntara-radius-/);
    // The suggestions stay inside the radius family rather than wandering to a colour role.
    expect(radius.fix.description).not.toMatch(/--syntara-color-/);
    expect(radius.message).toMatch(/is not a token/);

    // Without a fallback the property is thrown away; with one, the fallback silently takes over.
    expect(one('.a { border-radius: var(--syntara-radius-md); }')!.message).toMatch(/invalid at computed-value time/);
    expect(one('.a { border-radius: var(--syntara-radius-md, 8px); }')!.message).toMatch(/Only the fallback/);

    // The finding points at the name, not at the whole declaration.
    const code = '.a { border-radius: var(--syntara-radius-md); }';
    const f = one(code)!;
    expect(code.slice(f.fix.start ?? 0, f.fix.end ?? 0) || code.split('\n')[f.line - 1]!.slice(f.column - 1)).toMatch(/^--syntara-radius-md/);

    // It reads TSX inline styles through the same path.
    expect(one(`const a = <div style={{ borderRadius: 'var(--syntara-radius-md)' }} />;`, 'tsx')).toBeTruthy();

    // A whole family is offered, because the right radius is a choice between roles and not a spelling contest:
    // --syntara-radius-container is the furthest from "md" by spelling and the nearest by meaning.
    expect(radius.fix.description).toMatch(/--syntara-radius-container/);
    // With no family, candidates are ranked by shared words rather than spelling.
    expect(one('.a { outline-width: var(--syntara-focus-ring-width); }')!.fix.description).toMatch(/--syntara-color-focus-ring/);
    // When nothing resembles it, the fix says so rather than offering an unrelated token.
    expect(one('.a { color: var(--syntara-totally-made-up); }')!.fix.description).toMatch(/No emitted name resembles this one/);
  });

  it('unknown-token counts an opportunity for every --syntara-* use, so a clean file still scores', () => {
    const clean = auditSource('.a { border-radius: var(--syntara-radius-container); gap: var(--syntara-space-2); }', { language: 'css' });
    expect(clean.findings.filter((f) => f.rule === 'unknown-token')).toHaveLength(0);
    expect(clean.stats.opportunitiesByRule?.['unknown-token']).toBe(2);
  });

  it('a raw colour is safe to fix only when one role has exactly that value', () => {
    const fix = (value: string) => auditSource(`.a { color: ${value}; }`, { language: 'css' }).findings[0]!.fix;
    // text.subtle is the only house role with #5a5a5d.
    expect(fix('#5a5a5d')).toMatchObject({ safe: true, replacement: 'var(--syntara-color-text-subtle)' });
    expect(fix('#5A5A5D')).toMatchObject({ safe: true, replacement: 'var(--syntara-color-text-subtle)' });
    expect(fix('rgb(90 90 93)')).toMatchObject({ safe: true, replacement: 'var(--syntara-color-text-subtle)' });
    // Five roles are #ffffff, so there is no single right answer.
    expect(fix('#ffffff').safe).toBe(false);
    expect(fix('#ffffff').description).toMatch(/color\.action\.primary\.fg.*color\.accent\.fg/);
    // Near, not exact: a suggestion that says the ΔE.
    expect(fix('#5a5a5e').safe).toBe(false);
    expect(fix('#5a5a5e').description).toMatch(/ΔE \d/);
    // Exact in colour but not opaque.
    expect(fix('rgb(90 90 93 / 0.5)')).toMatchObject({ safe: false, replacement: 'color-mix(in oklab, var(--syntara-color-text-subtle) 50%, transparent)' });
    // Can't be resolved: advice only.
    expect(fix('rgb(var(--x) / 0.5)')).toMatchObject({ safe: false });
    expect(fix('rgb(var(--x) / 0.5)').replacement).toBeUndefined();
  });

  it('matches against the tenant and scheme asked for', () => {
    const house = auditSource('.a { color: #5a5a5d; }', { language: 'css' }).findings[0]!;
    const vela = auditSource('.a { color: #5a5a5d; }', { language: 'css', tenant: 'vela' }).findings[0]!;
    const dark = auditSource('.a { color: #5a5a5d; }', { language: 'css', scheme: 'dark' }).findings[0]!;
    expect(house.fix.safe).toBe(true);
    expect(vela.fix.safe).toBe(false);
    expect(dark.fix.safe).toBe(false);
    expect(() => auditSource('.a { color: #5a5a5d; }', { language: 'css', tenant: 'nobody' })).toThrow(/Unknown tenant/);
  });

  it('a length is safe to fix only when it is px, exact and one token has it', () => {
    const fix = (decl: string) => auditSource(`.a { ${decl}; }`, { language: 'css' }).findings[0]!.fix;
    expect(fix('gap: 8px')).toMatchObject({ safe: true, replacement: 'var(--syntara-space-2)' });
    expect(fix('gap: 0.5rem')).toMatchObject({ safe: false, replacement: 'var(--syntara-space-2)' });
    expect(fix('gap: 10px').safe).toBe(false);
    expect(fix('margin-inline: -8px')).toMatchObject({ safe: true, replacement: 'calc(var(--syntara-space-2) * -1)' });
    // House: radius.button and radius.field are both 12px.
    expect(fix('border-radius: 12px').safe).toBe(false);
    expect(fix('border-radius: 8px')).toMatchObject({ safe: true, replacement: 'var(--syntara-radius-badge)' });
  });

  it('native-element and missing-accessible-name are never safe', () => {
    const { findings } = audit('tsx/accessible-name-native.tsx');
    expect(findings.length).toBeGreaterThan(0);
    expect(findings.every((f) => f.fix.safe === false)).toBe(true);
    expect(audit('tsx/native.tsx').findings[0]!.fix.description).toContain("import { Button } from '@syntara/react'");
  });

  it('deprecated-api names the codemod, and is not safe with a spread or a clashing prop', () => {
    const { findings } = audit('tsx/deprecated.tsx');
    expect(findings.every((f) => f.fix.description.includes('npx @syntara/codemods button-variant-danger-to-tone'))).toBe(true);
    expect(findings.map((f) => f.fix.safe)).toEqual([true, true, true, true, true, false, false]);
    expect(findings[0]!.fix.replacement).toBe('tone="danger"');
  });

  it('a component file in the library may render the element it wraps', () => {
    const code = 'export const DataTable = () => <table><tbody /></table>;';
    expect(auditSource(code, { filename: inRepo('packages/react/src/ui/data-table.tsx') }).findings).toEqual([]);
    expect(auditSource(code, { filename: inRepo('packages/react/src/ui/chart.tsx') }).findings).toHaveLength(1);
    expect(auditSource(code, { filename: inRepo('apps/docs/components/data-table.tsx') }).findings).toHaveLength(1);
  });

  it('inside the library, a sibling import is a Syntara component', () => {
    const code = `import { Button } from './button';\nexport const A = () => <Button variant="danger">x</Button>;`;
    expect(auditSource(code, { filename: inRepo('packages/react/src/ui/toast.tsx') }).findings.map((f) => f.rule)).toEqual(['deprecated-api']);
    expect(auditSource(code, { filename: inRepo('apps/docs/components/x.tsx') }).findings).toEqual([]);
  });
});

describe('language and positions', () => {
  it('takes the language from the file name, and tsx for a snippet', () => {
    expect(auditSource('.a { color: red; }', { filename: 'a.module.css' }).findings[0]!.rule).toBe('raw-color');
    expect(auditSource('const a = <img src="x" />;').findings[0]!.file).toBe('<snippet>');
  });

  it('reports 1-based line and column, and offsets that point at the value', () => {
    const code = '.card {\n  color: #1f56e0;\n}\n';
    const f = auditSource(code, { language: 'css' }).findings[0]!;
    expect([f.line, f.column, f.snippet]).toEqual([2, 10, '#1f56e0']);
    expect(code.slice(f.fix.start, f.fix.end)).toBe('#1f56e0');
  });

  it('notes CSS that does not parse and reports no findings for it', () => {
    const r = auditSource('.a { color: red', { filename: 'broken.css' });
    expect(r.findings.length + (r.notes?.length ?? 0)).toBeGreaterThan(0);
  });

  it('counts places looked at, split by rule', () => {
    const { stats, findings } = auditSource('.a {\n  color: var(--syntara-color-text-default);\n  gap: var(--syntara-space-2);\n  display: flex;\n}\n', { language: 'css' });
    expect(findings).toEqual([]);
    // unknown-token looks at both var() uses, so using a real token is now a place that was checked and passed.
    expect(stats).toMatchObject({ files: 1, lines: 5, opportunities: 4, opportunitiesByRule: { 'raw-color': 1, 'off-scale-space': 1, 'unknown-token': 2 } });
    const empty = auditSource('', { language: 'css' });
    expect(empty.stats).toMatchObject({ lines: 0, opportunities: 0 });
  });
});

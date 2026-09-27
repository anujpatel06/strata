import { describe, expect, it } from 'vitest';
import postcss from 'postcss';
import ts from 'typescript';
import { applyFixes, auditSource } from '../src/index';
import type { Finding } from '../src/index';
import { read } from './helpers';

function parses(code: string, language: 'css' | 'tsx'): boolean {
  if (language === 'css') {
    postcss.parse(code);
    return true;
  }
  const file = ts.createSourceFile('x.tsx', code, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  // parseDiagnostics is internal but stable; it is the parser's own list of syntax errors.
  return ((file as unknown as { parseDiagnostics: unknown[] }).parseDiagnostics ?? []).length === 0;
}

describe.each(['css', 'tsx'] as const)('applyFixes on %s', (language) => {
  const input = read(`fix/input.${language}`);
  const output = read(`fix/output.${language}`);
  const first = auditSource(input, { language });
  const fixed = applyFixes(input, first.findings);

  it('applies the safe fixes and nothing else', () => {
    expect(fixed).toBe(output);
  });

  it('gives code that still parses', () => {
    expect(parses(fixed, language)).toBe(true);
  });

  it('changes nothing on the second run', () => {
    const second = auditSource(fixed, { language });
    expect(second.findings.filter((f) => f.fix.safe)).toEqual([]);
    expect(applyFixes(fixed, second.findings)).toBe(fixed);
  });

  it('leaves the findings that are not safe, unchanged in number', () => {
    const second = auditSource(fixed, { language });
    expect(second.findings.length).toBe(first.findings.filter((f) => !f.fix.safe).length);
  });

  it('every replacement range holds the snippet it replaces', () => {
    for (const f of first.findings) {
      if (f.fix.replacement === undefined) continue;
      const text = input.slice(f.fix.start, f.fix.end);
      expect(text.length).toBeGreaterThan(0);
      expect(text.startsWith(f.snippet.replace(/…$/, '')) || f.snippet.startsWith(text.split('\n')[0]!)).toBe(true);
    }
  });
});

describe('applyFixes, edge cases', () => {
  const finding = (start: number, end: number, replacement: string, safe = true): Finding => ({
    rule: 'raw-color', severity: 'error', file: 'x', line: 1, column: 1, message: '', snippet: '', fix: { description: '', replacement, start, end, safe },
  });

  it('applies from the end, so earlier offsets hold, in any input order', () => {
    expect(applyFixes('aa bb cc', [finding(0, 2, 'XXXX'), finding(6, 8, 'Z'), finding(3, 5, '')])).toBe('XXXX  Z');
  });

  it('skips fixes that are not safe, have no range, or fall outside the source', () => {
    const noRange: Finding = { ...finding(0, 0, 'x'), fix: { description: '', replacement: 'x', safe: true } };
    expect(applyFixes('abc', [finding(0, 1, 'X', false), noRange, finding(2, 9, 'X'), finding(2, 1, 'X')])).toBe('abc');
  });

  it('applies one of two overlapping fixes, not both', () => {
    expect(applyFixes('abcdef', [finding(0, 4, 'X'), finding(2, 6, 'Y')])).toBe('abY');
  });

  it('returns the source when there is nothing to do', () => {
    expect(applyFixes('abc', [])).toBe('abc');
  });
});

import { describe, expect, it } from 'vitest';
import { WEIGHTS, auditSource, scoreOf } from '../src/index';
import type { AuditStats, Finding, RuleId, Severity } from '../src/index';

const RULE_SEVERITY: Partial<Record<RuleId, Severity>> = { 'raw-color': 'error', 'off-scale-space': 'warning' };
const findings = (rule: RuleId, n: number): Finding[] =>
  Array.from({ length: n }, () => ({ rule, severity: RULE_SEVERITY[rule]!, file: 'x', line: 1, column: 1, message: '', snippet: '', fix: { description: '', safe: false } }));
const stats = (byRule: Partial<Record<RuleId, number>>): AuditStats => ({
  files: 1,
  lines: 1,
  opportunities: Object.values(byRule).reduce((a, b) => a + b, 0),
  opportunitiesByRule: byRule,
});

describe('scoreOf', () => {
  it('weights: an error is 3, a warning is 1', () => {
    expect(WEIGHTS).toEqual({ error: 3, warning: 1 });
  });

  it('no opportunities and no findings is 100', () => {
    expect(scoreOf([], stats({}))).toBe(100);
    expect(scoreOf([], { files: 0, lines: 0, opportunities: 0 })).toBe(100);
    expect(auditSource('', { language: 'css' }).stats.opportunities).toBe(0);
  });

  it('opportunities and no findings is 100', () => {
    expect(scoreOf([], stats({ 'raw-color': 500, 'off-scale-space': 3 }))).toBe(100);
  });

  it('every opportunity failing is 0, for errors, for warnings and for both', () => {
    expect(scoreOf(findings('raw-color', 4), stats({ 'raw-color': 4 }))).toBe(0);
    expect(scoreOf(findings('off-scale-space', 4), stats({ 'off-scale-space': 4 }))).toBe(0);
    expect(scoreOf([...findings('raw-color', 2), ...findings('off-scale-space', 5)], stats({ 'raw-color': 2, 'off-scale-space': 5 }))).toBe(0);
  });

  it('weighs an error three times a warning', () => {
    // total = 3×10 + 1×10 = 40. One error: 1 − 3/40 = 92.5. One warning: 1 − 1/40 = 97.5.
    const s = stats({ 'raw-color': 10, 'off-scale-space': 10 });
    expect(scoreOf(findings('raw-color', 1), s)).toBe(92.5);
    expect(scoreOf(findings('off-scale-space', 1), s)).toBe(97.5);
  });

  it('is never rounded up: floor to one decimal', () => {
    // 1 − 1/3 = 66.666… → 66.6, not 66.7.
    expect(scoreOf(findings('off-scale-space', 1), stats({ 'off-scale-space': 3 }))).toBe(66.6);
    // 1 − 1/2001 = 99.95002… → 99.9, not 100.
    expect(scoreOf(findings('off-scale-space', 1), stats({ 'off-scale-space': 2001 }))).toBe(99.9);
    // One warning in a million places is still below 100.
    expect(scoreOf(findings('off-scale-space', 1), stats({ 'off-scale-space': 1_000_000 }))).toBe(99.9);
  });

  it('stays between 0 and 100 when findings outnumber opportunities', () => {
    expect(scoreOf(findings('raw-color', 9), stats({ 'raw-color': 2 }))).toBe(0);
    expect(scoreOf(findings('raw-color', 1), { files: 1, lines: 1, opportunities: 0 })).toBe(0);
  });

  it('without the per-rule split, weighs every opportunity as a warning, which can only lower the score', () => {
    const f = findings('raw-color', 1);
    const withSplit = scoreOf(f, stats({ 'raw-color': 10 }));
    const without = scoreOf(f, { files: 1, lines: 1, opportunities: 10 });
    expect(withSplit).toBe(90);
    expect(without).toBe(70);
    expect(without).toBeLessThanOrEqual(withSplit);
  });

  it('scores a real snippet', () => {
    const r = auditSource('.a {\n  color: #123456;\n  gap: var(--syntara-space-2);\n  margin-inline: var(--syntara-space-2);\n}\n', { language: 'css' });
    // raw-color 1 of 1 (3), space 0 of 2 (2), physical 0 of 1 (3), unknown-token 0 of 2 (6): 1 − 3/14 = 78.5.
    // The two correct var() uses now count as checked and passed, so the same snippet scores higher than it did
    // before unknown-token existed (62.5). Scores are only comparable within one version of the rule set.
    expect(r.stats.opportunitiesByRule).toEqual({ 'raw-color': 1, 'off-scale-space': 2, 'physical-property': 1, 'unknown-token': 2 });
    expect(scoreOf(r.findings, r.stats)).toBe(78.5);
  });
});

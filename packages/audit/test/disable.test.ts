import { describe, expect, it } from 'vitest';
import { auditSource } from '../src/index';
import { audit, expected, found } from './helpers';

describe('strata-audit-disable-next-line', () => {
  it('CSS: silences the named rules on the next line of code, and only with a reason', () => {
    const { source, findings, stats, notes } = audit('css/disable.css');
    expect(found(findings)).toEqual(expected(source));
    // Line 3, line 6 twice (two rules), line 14 has nothing to silence.
    expect(stats.suppressed).toBe(3);
    expect(notes).toEqual([expect.stringMatching(/css\/disable\.css:11 .*unknown rule "no-such-rule"/)]);
  });

  it('a comment with no reason is a finding of its own and silences nothing', () => {
    const { findings } = audit('css/disable.css');
    const own = findings.find((f) => f.line === 7)!;
    expect(own.message).toMatch(/gives no reason/);
    expect(own.severity).toBe('warning');
    expect(own.fix.safe).toBe(false);
  });

  it('TSX: works in a JSX comment and in a line comment', () => {
    const { source, findings, stats } = audit('tsx/disable.tsx');
    expect(found(findings)).toEqual(expected(source));
    expect(stats.suppressed).toBe(2);
  });

  it('a silenced finding still counts as a place looked at, so the score is 100', () => {
    const r = auditSource('.a {\n  /* strata-audit-disable-next-line raw-color -- a reason */\n  color: red;\n}\n', { language: 'css' });
    expect(r.findings).toEqual([]);
    expect(r.stats.opportunities).toBe(1);
  });

  it('notes a comment that names no rule', () => {
    const r = auditSource('.a {\n  /* strata-audit-disable-next-line -- a reason */\n  color: red;\n}\n', { language: 'css' });
    expect(r.findings).toHaveLength(1);
    expect(r.notes?.[0]).toMatch(/names no rule/);
  });
});

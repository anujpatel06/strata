/** Counts shared by the text and HTML reports. */
import { RULES, RULE_IDS } from '../collector';
import type { AuditResult, Finding, RuleId, Severity } from '../types';

export interface RuleRow {
  rule: RuleId;
  severity: Severity;
  summary: string;
  findings: number;
  opportunities: number;
  safeFixes: number;
}

export function byRule(result: AuditResult): RuleRow[] {
  return RULE_IDS.map((rule) => {
    const own = result.findings.filter((f) => f.rule === rule);
    return {
      rule,
      severity: RULES[rule].severity,
      summary: RULES[rule].summary,
      findings: own.length,
      opportunities: result.stats.opportunitiesByRule?.[rule] ?? 0,
      safeFixes: own.filter((f) => f.fix.safe).length,
    };
  });
}

export function byFile(findings: Finding[]): Array<[file: string, findings: Finding[]]> {
  const map = new Map<string, Finding[]>();
  for (const f of findings) {
    const list = map.get(f.file);
    if (list) list.push(f);
    else map.set(f.file, [f]);
  }
  return [...map.entries()];
}

export function totals(result: AuditResult): { errors: number; warnings: number; safeFixes: number } {
  return {
    errors: result.findings.filter((f) => f.severity === 'error').length,
    warnings: result.findings.filter((f) => f.severity === 'warning').length,
    safeFixes: result.findings.filter((f) => f.fix.safe).length,
  };
}

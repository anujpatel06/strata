/** The plain-text report: findings by file, then a summary by rule, then the score. */
import type { AuditResult } from '../types';
import { byFile, byRule, totals } from './summary';

export function toText(result: AuditResult): string {
  const lines: string[] = [];
  for (const [file, findings] of byFile(result.findings)) {
    lines.push(file);
    for (const f of findings) {
      const where = `${f.line}:${f.column}`.padEnd(8);
      lines.push(`  ${where} ${f.severity.padEnd(7)} ${f.rule.padEnd(24)} ${f.message}`);
      lines.push(`  ${''.padEnd(8)} ${f.fix.safe ? 'fix    ' : 'suggest'} ${f.fix.description}`);
    }
    lines.push('');
  }

  const rows = byRule(result);
  lines.push('By rule');
  lines.push(`  ${'rule'.padEnd(24)} ${'severity'.padEnd(8)} ${'findings'.padStart(8)} ${'looked at'.padStart(9)} ${'safe fixes'.padStart(10)}`);
  for (const r of rows) {
    lines.push(`  ${r.rule.padEnd(24)} ${r.severity.padEnd(8)} ${String(r.findings).padStart(8)} ${String(r.opportunities).padStart(9)} ${String(r.safeFixes).padStart(10)}`);
  }
  const t = totals(result);
  lines.push('');
  lines.push(`Files ${result.stats.files} · lines ${result.stats.lines} · places looked at ${result.stats.opportunities}`);
  lines.push(`Findings ${result.findings.length}: ${t.errors} errors, ${t.warnings} warnings. ${t.safeFixes} have a safe fix (--fix applies them).`);
  if (result.stats.suppressed) lines.push(`Silenced by a disable comment with a reason: ${result.stats.suppressed}.`);
  for (const note of result.notes ?? []) lines.push(`Note: ${note}`);
  lines.push(`Score ${result.score.toFixed(1)} / 100`);
  return lines.join('\n') + '\n';
}

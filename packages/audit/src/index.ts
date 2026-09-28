/**
 * @syntara/audit: the drift auditor. The CLI, the MCP server's audit_snippet and find_token tools and the
 * agent eval all call these functions.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { Collector } from './collector';
import { auditCss } from './css';
import { collectFiles, languageOf } from './paths';
import { scoreOf } from './score';
import { findToken as findTokenWith } from './tokens';
import { auditTsx } from './tsx';
import type { AuditOptions, AuditResult, AuditStats, Finding, RuleId, TokenMatch } from './types';

export * from './types';
export { scoreOf, WEIGHTS } from './score';
export { applyFixes, applyFixesDetailed } from './fix';
export { RULES, RULE_IDS } from './collector';
export { DEFAULT_IGNORES } from './paths';

function run(code: string, options: AuditOptions = {}): { findings: Finding[]; stats: AuditStats; notes: string[] } {
  const file = options.filename ?? '<snippet>';
  const language = options.language ?? (options.filename ? languageOf(options.filename) : null) ?? 'tsx';
  const collector = new Collector(code, file, options.tenant ?? 'house', options.scheme ?? 'light');
  if (language === 'css') auditCss(code, collector);
  else auditTsx(code, collector);
  return { findings: collector.sorted(), stats: collector.stats(), notes: collector.notes };
}

/** Audits one source text. `notes` is an addition to the contract: see AuditResult.notes. */
export function auditSource(code: string, options: AuditOptions = {}): { findings: Finding[]; stats: AuditStats; notes?: string[] } {
  const { findings, stats, notes } = run(code, options);
  return notes.length > 0 ? { findings, stats, notes } : { findings, stats };
}

/** Audits files and folders. Paths in findings are relative to the working directory. */
export function auditPaths(
  paths: string[],
  options: Omit<AuditOptions, 'filename' | 'language'> & { ignore?: string[] } = {},
): AuditResult {
  const findings: Finding[] = [];
  const notes: string[] = [];
  const byRule: Partial<Record<RuleId, number>> = {};
  const stats: AuditStats = { files: 0, lines: 0, opportunities: 0, opportunitiesByRule: byRule, suppressed: 0 };
  for (const file of collectFiles(paths, options.ignore ?? [])) {
    let code: string;
    try {
      code = readFileSync(resolve(file), 'utf8');
    } catch (error) {
      notes.push(`${file} could not be read and was not checked: ${(error as Error).message}`);
      continue;
    }
    const one = run(code, { filename: file, ...(options.tenant ? { tenant: options.tenant } : {}), ...(options.scheme ? { scheme: options.scheme } : {}) });
    findings.push(...one.findings);
    notes.push(...one.notes);
    stats.files += 1;
    stats.lines += one.stats.lines;
    stats.opportunities += one.stats.opportunities;
    stats.suppressed = (stats.suppressed ?? 0) + (one.stats.suppressed ?? 0);
    for (const [rule, n] of Object.entries(one.stats.opportunitiesByRule ?? {})) {
      byRule[rule as RuleId] = (byRule[rule as RuleId] ?? 0) + (n ?? 0);
    }
  }
  return { findings, stats, score: scoreOf(findings, stats), ...(notes.length > 0 ? { notes } : {}) };
}

export function findToken(
  value: string,
  options: { tenant?: string; scheme?: 'light' | 'dark'; category?: 'color' | 'space' | 'radius' | 'font-size' | 'font-weight' } = {},
): TokenMatch | null {
  return findTokenWith(value, options);
}

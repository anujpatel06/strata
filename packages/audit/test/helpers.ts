import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { auditSource } from '../src/index';
import type { Finding, RuleId } from '../src/index';

export const fixtures = path.join(path.dirname(fileURLToPath(import.meta.url)), 'fixtures');

export function read(name: string): string {
  return readFileSync(path.join(fixtures, name), 'utf8');
}

/**
 * Fixtures mark the lines that must fire: a comment "expect: rule, rule" on the same line, once per finding.
 * Every other line must stay silent. Returns "line rule" strings, sorted.
 */
export function expected(source: string, only?: RuleId): string[] {
  const out: string[] = [];
  source.split('\n').forEach((text, i) => {
    const m = /expect:\s*([a-z, -]+?)\s*(\*\/|$)/.exec(text);
    if (!m) return;
    for (const rule of m[1]!.split(',').map((r) => r.trim()).filter(Boolean)) {
      if (!only || rule === only) out.push(`${i + 1} ${rule}`);
    }
  });
  return out.sort();
}

export function found(findings: Finding[], only?: RuleId): string[] {
  return findings.filter((f) => !only || f.rule === only).map((f) => `${f.line} ${f.rule}`).sort();
}

export function audit(name: string) {
  const source = read(name);
  // The file name is not under the repo's ui folder, so no fixture is treated as a component's own file.
  const result = auditSource(source, { filename: name });
  return { source, ...result };
}

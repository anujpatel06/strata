/** Applies safe fixes. Works from the end of the source to the start, so earlier offsets stay valid. */
import type { Finding } from './types';

export interface AppliedFixes {
  code: string;
  applied: Finding[];
  /** Findings that stay: not safe, no replacement, or overlapping a fix that was applied. */
  left: Finding[];
}

export function applyFixesDetailed(code: string, findings: Finding[]): AppliedFixes {
  const usable = findings
    .filter((f) => f.fix.safe === true && typeof f.fix.replacement === 'string' && Number.isInteger(f.fix.start) && Number.isInteger(f.fix.end))
    .filter((f) => f.fix.start! >= 0 && f.fix.end! >= f.fix.start! && f.fix.end! <= code.length)
    .sort((a, b) => b.fix.start! - a.fix.start! || b.fix.end! - a.fix.end!);
  const applied: Finding[] = [];
  let out = code;
  let floor = Infinity; // the start of the last fix applied; the next one must end at or before it
  for (const f of usable) {
    if (f.fix.end! > floor) continue;
    out = out.slice(0, f.fix.start!) + f.fix.replacement! + out.slice(f.fix.end!);
    floor = f.fix.start!;
    applied.push(f);
  }
  const done = new Set(applied);
  return { code: out, applied: applied.reverse(), left: findings.filter((f) => !done.has(f)) };
}

export function applyFixes(code: string, findings: Finding[]): string {
  return applyFixesDetailed(code, findings).code;
}

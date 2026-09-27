/**
 * Collects findings and opportunity counts for one source, and applies disable comments.
 *
 *   strata-audit-disable-next-line <rule>[, <rule>] -- reason
 *
 * works in a CSS comment, a line comment and a JSX comment. It silences the named rules on the next line
 * that has code. A comment with no reason silences nothing and is reported.
 */
import type { Sink } from './declarations';
import type { Scheme } from './tokens';
import type { AuditStats, Finding, Fix, RuleId, Severity } from './types';

export const RULES: Readonly<Record<RuleId, { severity: Severity; summary: string }>> = {
  'raw-color': { severity: 'error', summary: 'A colour written as hex, rgb(), hsl(), oklch(), oklab() or a name.' },
  'off-scale-space': { severity: 'warning', summary: 'A px or rem length in margin, padding, gap or an inset.' },
  'off-scale-radius': { severity: 'warning', summary: 'A px or rem length in a border radius.' },
  'off-scale-font-size': { severity: 'warning', summary: 'A px or rem font size.' },
  'raw-font-weight': { severity: 'warning', summary: 'A font weight written as a number or keyword.' },
  'font-family-literal': { severity: 'warning', summary: 'A font family that is written out.' },
  'native-element': { severity: 'error', summary: 'A native element where a Strata component exists.' },
  'physical-property': { severity: 'error', summary: 'A property or value that names left or right, top or bottom.' },
  'missing-accessible-name': { severity: 'error', summary: 'An image or control with no name a screen reader can say.' },
  'deprecated-api': { severity: 'warning', summary: 'A prop or prop value with a deprecation record.' },
};

export const RULE_IDS = Object.keys(RULES) as RuleId[];

const isRule = (name: string): name is RuleId => Object.hasOwn(RULES, name);

interface Disable {
  /** 1-based line of the code the comment applies to. */
  target: number;
  rules: RuleId[];
}

const DIRECTIVE = /strata-audit-disable-next-line\b([^\n]*)/g;

export class Collector implements Sink {
  readonly findings: Finding[] = [];
  readonly notes: string[] = [];
  readonly byRule: Partial<Record<RuleId, number>> = {};
  suppressed = 0;

  private readonly lineStarts: number[] = [0];
  private readonly disables: Disable[] = [];

  constructor(
    readonly source: string,
    readonly file: string,
    readonly tenant: string,
    readonly scheme: Scheme,
  ) {
    for (let i = 0; i < source.length; i++) if (source.charCodeAt(i) === 10) this.lineStarts.push(i + 1);
    this.readDisables();
  }

  position(offset: number): { line: number; column: number } {
    let lo = 0;
    let hi = this.lineStarts.length - 1;
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1;
      if (this.lineStarts[mid]! <= offset) lo = mid;
      else hi = mid - 1;
    }
    return { line: lo + 1, column: offset - this.lineStarts[lo]! + 1 };
  }

  private lineText(line: number): string {
    const start = this.lineStarts[line - 1];
    if (start === undefined) return '';
    const end = this.lineStarts[line] ?? this.source.length + 1;
    return this.source.slice(start, end - 1).replace(/\r$/, '');
  }

  private readDisables(): void {
    for (const m of this.source.matchAll(DIRECTIVE)) {
      const at = this.position(m.index);
      // The directive ends at the comment's end or the line's end.
      const body = (m[1] ?? '').replace(/\*\/.*$/, '').trim();
      const [namesText = '', ...reasonParts] = body.split('--');
      const reason = reasonParts.join('--').trim();
      const names = namesText.split(/[\s,]+/).filter(Boolean);
      const known = names.filter(isRule);
      for (const name of names) {
        if (!isRule(name)) this.notes.push(`${this.file}:${at.line} disable comment names an unknown rule "${name}". It silences nothing.`);
      }
      if (names.length === 0) {
        this.notes.push(`${this.file}:${at.line} disable comment names no rule. It silences nothing. Write: strata-audit-disable-next-line <rule> -- reason.`);
        continue;
      }
      if (reason === '') {
        const start = m.index;
        const end = m.index + 'strata-audit-disable-next-line'.length + (m[1] ?? '').replace(/\*\/.*$/, '').trimEnd().length;
        for (const rule of known) {
          this.push(rule, 'warning', start, end, `This disable comment for ${rule} gives no reason, so it silences nothing.`, {
            description: `Say why after two hyphens: strata-audit-disable-next-line ${rule} -- reason. Or fix the finding and remove the comment.`,
            safe: false,
          });
        }
        continue;
      }
      // The next line that has anything on it.
      let target = at.line + 1;
      while (target <= this.lineStarts.length && this.lineText(target).trim() === '') target++;
      if (known.length > 0) this.disables.push({ target, rules: known });
    }
  }

  pass(rule: RuleId): void {
    this.byRule[rule] = (this.byRule[rule] ?? 0) + 1;
  }

  report(rule: RuleId, start: number, end: number, message: string, fix: Fix): void {
    const { line } = this.position(start);
    if (this.disables.some((d) => d.target === line && d.rules.includes(rule))) {
      this.suppressed++;
      this.pass(rule);
      return;
    }
    this.push(rule, RULES[rule].severity, start, end, message, fix);
  }

  private push(rule: RuleId, severity: Severity, start: number, end: number, message: string, fix: Fix): void {
    this.pass(rule);
    const { line, column } = this.position(start);
    const text = this.source.slice(start, Math.max(start, end));
    const firstLine = text.split('\n')[0] ?? '';
    const snippet = firstLine.length > 120 ? firstLine.slice(0, 117) + '…' : firstLine;
    this.findings.push({ rule, severity, file: this.file, line, column, message, snippet, fix });
  }

  stats(): AuditStats {
    const opportunities = Object.values(this.byRule).reduce((sum, n) => sum + (n ?? 0), 0);
    return {
      files: 1,
      lines: this.source === '' ? 0 : this.source.split('\n').length - (this.source.endsWith('\n') ? 1 : 0),
      opportunities,
      opportunitiesByRule: { ...this.byRule },
      suppressed: this.suppressed,
    };
  }

  sorted(): Finding[] {
    return [...this.findings].sort((a, b) => a.line - b.line || a.column - b.column || a.rule.localeCompare(b.rule));
  }
}

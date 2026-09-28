/**
 * The only file that touches '@syntara/audit'. `audit_snippet` and `find_token` call these two functions.
 *
 * The auditor is loaded on first use. If it is missing, or doesn't export the three functions yet, the tools
 * return an error that says so: the server still starts and the other tools still work.
 *
 * The types below are the part of packages/audit/src/types.ts that this package reads.
 */

export type Scheme = 'light' | 'dark';
export type Language = 'tsx' | 'css';

export interface Fix {
  description: string;
  replacement?: string;
  start?: number;
  end?: number;
  safe: boolean;
}

export interface Finding {
  rule: string;
  severity: 'error' | 'warning';
  file: string;
  line: number;
  column: number;
  message: string;
  snippet: string;
  fix: Fix;
}

export interface AuditStats {
  files: number;
  lines: number;
  opportunities: number;
}

export interface AuditOptions {
  filename?: string;
  language?: Language;
  tenant?: string;
  scheme?: Scheme;
}

export interface TokenMatch {
  token: string;
  cssVar: string;
  value: string;
  distance: number;
  exact: boolean;
  reason: string;
}

export interface FindTokenOptions {
  tenant?: string;
  scheme?: Scheme;
  category?: string;
}

interface Auditor {
  auditSource(code: string, options?: AuditOptions): { findings: Finding[]; stats: AuditStats };
  scoreOf(findings: Finding[], stats: AuditStats): number;
  findToken(value: string, options?: FindTokenOptions): TokenMatch | null;
}

export class AuditorUnavailable extends Error {
  constructor(detail: string) {
    super(`The Syntara auditor (@syntara/audit) can't be used: ${detail}`);
    this.name = 'AuditorUnavailable';
  }
}

const NEEDED = ['auditSource', 'scoreOf', 'findToken'] as const;

let loaded: Promise<Auditor> | undefined;

async function load(): Promise<Auditor> {
  // A variable specifier: the package may have no entry file yet, and that must not break the type check.
  const specifier = '@syntara/audit';
  let mod: Record<string, unknown>;
  try {
    mod = (await import(specifier)) as Record<string, unknown>;
  } catch (err) {
    throw new AuditorUnavailable(`it failed to load (${err instanceof Error ? err.message.split('\n')[0] : String(err)}).`);
  }
  const missing = NEEDED.filter((name) => typeof mod[name] !== 'function');
  if (missing.length > 0) throw new AuditorUnavailable(`it doesn't export ${missing.join(', ')}.`);
  return mod as unknown as Auditor;
}

function auditor(): Promise<Auditor> {
  loaded ??= load().catch((err: unknown) => {
    loaded = undefined; // try again on the next call
    throw err;
  });
  return loaded;
}

/** True when the real auditor loads and has the three exports. Used by the integration test. */
export async function auditorAvailable(): Promise<{ ok: true } | { ok: false; reason: string }> {
  try {
    await auditor();
    return { ok: true };
  } catch (err) {
    return { ok: false, reason: err instanceof Error ? err.message : String(err) };
  }
}

export async function audit(
  code: string,
  options: AuditOptions = {},
): Promise<{ findings: Finding[]; stats: AuditStats; score: number }> {
  const a = await auditor();
  const { findings, stats } = a.auditSource(code, options);
  return { findings, stats, score: a.scoreOf(findings, stats) };
}

export async function nearestToken(value: string, options: FindTokenOptions = {}): Promise<TokenMatch | null> {
  const a = await auditor();
  return a.findToken(value, options);
}

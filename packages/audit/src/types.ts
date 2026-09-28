/**
 * @syntara/audit — the contract. The CLI, the MCP server's `audit_snippet` and `find_token` tools, and the agent eval's
 * scoring all use these names. BRIEF §9, ADR-018.
 */

/** One check. The README lists what each one looks for and its severity. */
export type RuleId =
  | 'raw-color'
  | 'off-scale-space'
  | 'off-scale-radius'
  | 'off-scale-font-size'
  | 'raw-font-weight'
  | 'font-family-literal'
  | 'native-element'
  | 'physical-property'
  | 'missing-accessible-name'
  | 'deprecated-api';

export type Severity = 'error' | 'warning';

export type Language = 'tsx' | 'css';

/**
 * What to write instead. `safe` means there is exactly one right answer and applying it can't change behaviour or
 * meaning: only safe fixes are applied by `--fix`, and only they fall under the ambient trust level (ADR-008).
 */
export interface Fix {
  /** Plain words, e.g. "Use var(--syntara-color-action-primary-bg)". */
  description: string;
  /** The replacement text for source[start, end), when the fix can be written as one. */
  replacement?: string;
  /** Offsets into the audited source, end exclusive. Present whenever `replacement` is. */
  start?: number;
  end?: number;
  safe: boolean;
}

export interface Finding {
  rule: RuleId;
  severity: Severity;
  /** As given in AuditOptions.filename, or "<snippet>". */
  file: string;
  /** 1-based. */
  line: number;
  /** 1-based. */
  column: number;
  message: string;
  /** The offending source text, one line at most. */
  snippet: string;
  /** Every finding carries one (BRIEF principle 7), even when it's advice and not a rewrite. */
  fix: Fix;
}

export interface AuditOptions {
  filename?: string;
  /** Inferred from the filename's extension when omitted; "tsx" for a snippet with no filename. */
  language?: Language;
  /** Resolve tokens against this tenant when matching raw values. Default "house". */
  tenant?: string;
  scheme?: 'light' | 'dark';
}

export interface AuditStats {
  files: number;
  lines: number;
  /**
   * How many places a rule could have fired: every colour, spacing, radius, font and property declaration, and
   * every JSX element the rules look at. The score is findings weighed against this, so a large clean codebase
   * and a small clean snippet both score 100.
   */
  opportunities: number;
  /**
   * Added by the auditor (optional, additive). The same count split by rule, so the score can weigh each
   * opportunity by its rule's severity. Without it, scoreOf weighs every opportunity as a warning, which can
   * only lower the score.
   */
  opportunitiesByRule?: Partial<Record<RuleId, number>>;
  /** Added by the auditor (optional, additive). Findings silenced by a disable comment that gives a reason. */
  suppressed?: number;
}

export interface AuditResult {
  findings: Finding[];
  stats: AuditStats;
  /** 0–100, severity-weighted. The formula is in the README and in score.ts. Never rounded up. */
  score: number;
  /**
   * Added by the auditor (optional, additive). Things that are not findings but the reader should know:
   * a disable comment that names an unknown rule, a file that could not be parsed.
   */
  notes?: string[];
}

/** The nearest semantic token for a raw value, and why. */
export interface TokenMatch {
  /** Dotted role, e.g. "color.action.primary.bg". */
  token: string;
  /** e.g. "--syntara-color-action-primary-bg". */
  cssVar: string;
  /** The token's resolved value for the tenant and scheme asked for. */
  value: string;
  /** Colours: ΔE in OKLab × 100. Lengths: the absolute difference in px. 0 is an exact match. */
  distance: number;
  exact: boolean;
  /** e.g. "#1f56e0 → color.action.primary.bg (ΔE 0.8)". */
  reason: string;
  /**
   * Added by the auditor (optional, additive). Other tokens at the same distance, as dotted names. When an exact
   * match has alternatives there is more than one right answer, so the fix built from it is not safe.
   */
  alternatives?: string[];
}

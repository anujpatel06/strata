/**
 * The score. 0–100, never rounded up.
 *
 *   failed = 3 × errors + 1 × warnings                        (findings)
 *   total  = Σ over rules of weight(rule) × opportunities(rule)
 *   score  = floor( 1000 × (1 − min(1, failed ÷ total)) ) ÷ 10
 *
 * No opportunities gives 100: there was nothing to get wrong. Every opportunity failing gives 0.
 *
 * Weights: an error is 3 and a warning is 1. An error breaks something for a person (a colour that ignores the
 * brand and the dark scheme, a layout that doesn't mirror, a control with no name), while a warning is a value
 * that drifts from the scale but still renders and reads correctly. Three was chosen before any codebase was
 * scored and is not tuned to one.
 *
 * When stats has no per-rule split, every opportunity is weighed as a warning. That makes `total` as small as
 * it can be, so the score can only come out lower than with the split, never higher.
 */
import { RULES } from './collector';
import type { AuditStats, Finding, RuleId, Severity } from './types';

export const WEIGHTS: Readonly<Record<Severity, number>> = { error: 3, warning: 1 };

export function scoreOf(findings: Finding[], stats: AuditStats): number {
  const failed = findings.reduce((sum, f) => sum + WEIGHTS[f.severity], 0);
  let total = 0;
  if (stats.opportunitiesByRule) {
    for (const [rule, count] of Object.entries(stats.opportunitiesByRule)) {
      const known = RULES[rule as RuleId];
      total += WEIGHTS[known ? known.severity : 'warning'] * (count ?? 0);
    }
  } else {
    total = WEIGHTS.warning * stats.opportunities;
  }
  if (failed === 0) return 100;
  if (total <= 0) return 0; // findings with nothing to weigh them against: the stats are wrong, so don't flatter
  const ratio = Math.min(1, failed / total);
  return Math.max(0, Math.floor((1 - ratio) * 1000) / 10);
}

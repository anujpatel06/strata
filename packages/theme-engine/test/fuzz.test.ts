import { describe, expect, it } from 'vitest';
import { FUZZ_SEED, FUZZ_THEMES, fuzzInputs, runFuzz } from '../scripts/fuzz';

describe('theme fuzz (same inputs as `pnpm test:themes`)', () => {
  const inputs = fuzzInputs(FUZZ_SEED, FUZZ_THEMES);

  it('generates a deterministic set of 1,000 random brands', () => {
    expect(inputs).toHaveLength(1000);
    expect(fuzzInputs(FUZZ_SEED, FUZZ_THEMES)).toEqual(inputs);
    const withAccent = inputs.filter((i) => i.accent).length;
    expect(withAccent).toBeGreaterThan(400);
    expect(withAccent).toBeLessThan(600);
    expect(new Set(inputs.map((i) => i.primary)).size).toBeGreaterThan(990);
  });

  it('every check in every theme passes (light + dark)', () => {
    const result = runFuzz(inputs);
    expect(result.themes).toBe(1000);
    expect(result.totalChecks).toBe(1000 * result.checksPerTheme);
    expect(result.failures).toEqual([]);
    expect(result.failed).toBe(0);
    expect(result.passed).toBe(result.totalChecks);
    expect(result.passRatePercent).toBe(100);
    expect(result.invariantViolations).toEqual([]);
    expect(result.minMargin['4.5']!.margin).toBeGreaterThanOrEqual(0);
    expect(result.minMargin['3']!.margin).toBeGreaterThanOrEqual(0);
    // The fixed system palette (feedback colours, secondary labels) never needs the solver:
    // every adjustment left is driven by the brand's own colours.
    const systemRows = result.interventions.filter((iv) => iv.role.startsWith('feedback.') || iv.role.startsWith('action.secondary.'));
    expect(systemRows).toEqual([]);
    expect(result.adjustmentsPerTheme.median).toBeLessThanOrEqual(6);
  }, 60_000);
});

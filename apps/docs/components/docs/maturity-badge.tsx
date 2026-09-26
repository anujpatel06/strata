import { Badge } from '@strata/react';

const TONE = { alpha: 'warning', beta: 'info', stable: 'success' } as const;

/** alpha = API may change · beta = API settled, feedback wanted · stable = semver-protected. */
export function MaturityBadge({ maturity, size = 'sm' }: { maturity: 'alpha' | 'beta' | 'stable'; size?: 'sm' | 'md' }) {
  return (
    <Badge tone={TONE[maturity] ?? 'neutral'} variant="soft" size={size}>
      {maturity}
    </Badge>
  );
}

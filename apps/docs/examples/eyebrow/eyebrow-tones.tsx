'use client';

import { Eyebrow } from '@strata/react';
import { IconAlertTriangle, IconCircleCheck, IconInfoCircle, IconSparkles } from '@strata/icons';

export default function Example() {
  return (
    <div style={{ display: 'grid', gap: 'var(--strata-space-4)' }}>
      <Eyebrow lead="rule" tone="brand">New this year</Eyebrow>
      <Eyebrow icon={<IconSparkles />} tone="accent">Recommended</Eyebrow>
      <Eyebrow icon={<IconInfoCircle />} tone="info">Before you book</Eyebrow>
      <Eyebrow icon={<IconCircleCheck />} tone="success">Cashless at this clinic</Eyebrow>
      <Eyebrow icon={<IconAlertTriangle />} tone="warning">Pre-approval needed</Eyebrow>
    </div>
  );
}

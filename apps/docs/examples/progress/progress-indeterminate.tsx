'use client';

import { ProgressBar } from '@strata/react';

export default function Example() {
  return (
    <div style={{ display: 'grid', gap: 'var(--strata-space-6)', inlineSize: '100%', maxInlineSize: 360 }}>
      <ProgressBar label="Preparing your export" isIndeterminate />
      <ProgressBar aria-label="Loading claims" isIndeterminate size="sm" />
    </div>
  );
}

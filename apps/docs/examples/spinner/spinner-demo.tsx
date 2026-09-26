'use client';

import { Spinner } from '@strata/react';

export default function Example() {
  return (
    <div style={{ display: 'flex', gap: 'var(--strata-space-6)', alignItems: 'center', color: 'var(--strata-color-text-brand)' }}>
      <Spinner size="sm" />
      <Spinner />
      <Spinner size="lg" />
    </div>
  );
}

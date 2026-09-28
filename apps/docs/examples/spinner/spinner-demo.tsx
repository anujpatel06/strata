'use client';

import { Spinner } from '@syntara/react';

export default function Example() {
  return (
    <div style={{ display: 'flex', gap: 'var(--syntara-space-6)', alignItems: 'center', color: 'var(--syntara-color-text-brand)' }}>
      <Spinner size="sm" />
      <Spinner />
      <Spinner size="lg" />
    </div>
  );
}

'use client';

import { Amount } from '@strata/react';

export default function Example() {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', gap: 'var(--strata-space-8)' }}>
      <Amount value={18000} currency="INR" locale="en-IN" size="lg" compact />
      <Amount value={184250} currency="INR" locale="en-IN" size="lg" compact />
      <Amount value={240000} currency="GBP" locale="en-GB" size="lg" compact />
    </div>
  );
}

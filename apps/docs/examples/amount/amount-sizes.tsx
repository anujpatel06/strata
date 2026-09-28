'use client';

import { Amount } from '@syntara/react';

export default function Example() {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', gap: 'var(--syntara-space-6)' }}>
      <Amount value={1240} currency="GBP" locale="en-GB" size="sm" />
      <Amount value={1240} currency="GBP" locale="en-GB" size="md" />
      <Amount value={1240} currency="GBP" locale="en-GB" size="lg" />
      <Amount value={1240} currency="GBP" locale="en-GB" size="xl" />
    </div>
  );
}

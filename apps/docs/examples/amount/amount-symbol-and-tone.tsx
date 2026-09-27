'use client';

import { Amount } from '@strata/react';

export default function Example() {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', gap: 'var(--strata-space-8)' }}>
      <Amount value={7400} currency="INR" locale="en-IN" size="md" />
      <Amount value={7400} currency="INR" locale="en-IN" size="md" symbol="inline" />
      <Amount value={1250} currency="INR" locale="en-IN" size="md" tone="success" formatOptions={{ signDisplay: 'always' }} />
      <Amount value={-980} currency="INR" locale="en-IN" size="md" tone="danger" />
      <Amount value={18000} currency="INR" locale="en-IN" size="md" tone="brand" />
    </div>
  );
}

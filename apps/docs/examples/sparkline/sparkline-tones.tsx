'use client';

import { Sparkline } from '@strata/react';

const rising = [12, 14, 13, 17, 16, 19, 22, 21, 24];
const falling = [24, 22, 23, 19, 20, 17, 15, 16, 13];

export default function Example() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 'var(--strata-space-6)', inlineSize: '100%' }}>
      <Sparkline data={rising} tone="brand" />
      <Sparkline data={rising} tone="success" />
      <Sparkline data={falling} tone="danger" />
      <Sparkline data={falling} tone="neutral" />
    </div>
  );
}

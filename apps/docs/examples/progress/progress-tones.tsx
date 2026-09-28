'use client';

import { ProgressBar } from '@syntara/react';

export default function Example() {
  return (
    <div style={{ display: 'grid', gap: 'var(--syntara-space-6)', inlineSize: '100%', maxInlineSize: 360 }}>
      <ProgressBar label="Annual limit used" value={38} showValue />
      <ProgressBar label="Profile complete" value={100} showValue tone="success" />
      <ProgressBar label="Storage" value={4.1} maxValue={5} showValue tone="warning" valueLabel="4.1 of 5 GB" />
      <ProgressBar label="Outpatient limit" value={96} showValue tone="danger" size="sm" />
    </div>
  );
}

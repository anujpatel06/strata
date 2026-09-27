'use client';

import { Meter } from '@strata/react';

export default function Example() {
  return (
    <div style={{ display: 'grid', gap: 'var(--strata-space-5)', inlineSize: '100%', maxInlineSize: 360 }}>
      <Meter label="Medicines" value={3200} maxValue={18000} valueLabel="₹3,200 used" caption="of ₹18,000" />
      <Meter label="Diagnostics" tone="accent" value={9100} maxValue={18000} valueLabel="₹9,100 used" caption="of ₹18,000" />
      <Meter label="Dental" tone="warning" value={4600} maxValue={5000} valueLabel="₹4,600 used" caption="of ₹5,000" />
      <Meter label="Vision" tone="neutral" value={0} maxValue={3000} valueLabel="Not used yet" />
    </div>
  );
}

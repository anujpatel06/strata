'use client';

import { ChartTooltip, chartColor } from '@syntara/react';

export default function Example() {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'start', gap: 'var(--syntara-space-6)' }}>
      <ChartTooltip title="12 Oct" rows={[{ key: 'revenue', label: 'Revenue', value: '$4,210', color: chartColor(0) }]} />
      <ChartTooltip
        title="Week 6"
        rows={[
          { key: 'income', label: 'Income', value: '$5,200', color: chartColor(0) },
          { key: 'spending', label: 'Spending', value: '$4,100', color: chartColor(1) },
        ]}
      />
    </div>
  );
}

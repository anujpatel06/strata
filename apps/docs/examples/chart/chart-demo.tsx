'use client';

import { ChartLegend } from '@strata/react';

export default function Example() {
  return (
    <div style={{ display: 'grid', gap: 'var(--strata-space-4)' }}>
      <ChartLegend
        aria-label="Series"
        series={[
          { key: 'income', label: 'Income' },
          { key: 'spending', label: 'Spending' },
          { key: 'savings', label: 'Savings' },
          { key: 'investments', label: 'Investments' },
        ]}
      />
      <ChartLegend
        aria-label="Series"
        shape="line"
        series={[
          { key: 'web', label: 'Web' },
          { key: 'ios', label: 'iOS' },
          { key: 'android', label: 'Android' },
        ]}
      />
    </div>
  );
}

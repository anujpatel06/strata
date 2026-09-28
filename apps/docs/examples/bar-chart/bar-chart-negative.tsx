'use client';

import { BarChart } from '@syntara/react';

const data = [
  { month: 'Jan', net: 1200 }, { month: 'Feb', net: -450 }, { month: 'Mar', net: 820 },
  { month: 'Apr', net: 1640 }, { month: 'May', net: -980 }, { month: 'Jun', net: 310 },
  { month: 'Jul', net: 1450 }, { month: 'Aug', net: -220 },
];

export default function Example() {
  return (
    <BarChart
      aria-label="Net cash flow by month"
      data={data}
      x="month"
      xLabel="Month"
      height={220}
      series={[{ key: 'net', label: 'Net cash flow' }]}
      format={{ value: { style: 'currency', currency: 'GBP', maximumFractionDigits: 0, signDisplay: 'exceptZero' } }}
    />
  );
}

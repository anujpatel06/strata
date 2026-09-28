'use client';

import { BarChart } from '@syntara/react';

const data = [
  { plan: 'Starter', seats: 420 }, { plan: 'Team', seats: 1180 },
  { plan: 'Business', seats: 760 }, { plan: 'Enterprise', seats: 310 },
];

export default function Example() {
  return (
    <BarChart
      aria-label="Seats by plan"
      data={data}
      x="plan"
      xLabel="Plan"
      height={180}
      showTable
      series={[{ key: 'seats', label: 'Seats' }]}
    />
  );
}

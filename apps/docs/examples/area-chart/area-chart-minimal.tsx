'use client';

import { AreaChart } from '@strata/react';

const data = [
  { hour: '09:00', requests: 320 }, { hour: '10:00', requests: 410 }, { hour: '11:00', requests: 385 },
  { hour: '12:00', requests: 520 }, { hour: '13:00', requests: 470 }, { hour: '14:00', requests: 610 },
  { hour: '15:00', requests: 580 }, { hour: '16:00', requests: 690 },
];

export default function Example() {
  return (
    <AreaChart
      aria-label="Requests per hour today"
      data={data}
      x="hour"
      xLabel="Hour"
      height={160}
      curve="linear"
      showGrid={false}
      showYAxis={false}
      series={[{ key: 'requests', label: 'Requests' }]}
    />
  );
}

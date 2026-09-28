'use client';

import { BarChart } from '@syntara/react';

const data = [
  { team: 'Support', opened: 142, closed: 128 }, { team: 'Billing', opened: 86, closed: 91 },
  { team: 'Onboarding', opened: 64, closed: 52 }, { team: 'Security', opened: 23, closed: 25 },
  { team: 'Platform', opened: 71, closed: 66 },
];

export default function Example() {
  return (
    <BarChart
      aria-label="Tickets opened and closed by team this month"
      data={data}
      x="team"
      xLabel="Team"
      series={[
        { key: 'opened', label: 'Opened' },
        { key: 'closed', label: 'Closed' },
      ]}
    />
  );
}

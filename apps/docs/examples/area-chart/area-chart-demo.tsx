'use client';

import { AreaChart, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@strata/react';

const data = [
  { month: 'Jan', revenue: 18400 }, { month: 'Feb', revenue: 21200 }, { month: 'Mar', revenue: 19800 },
  { month: 'Apr', revenue: 24600 }, { month: 'May', revenue: 23100 }, { month: 'Jun', revenue: 27900 },
  { month: 'Jul', revenue: 26400 }, { month: 'Aug', revenue: 31200 }, { month: 'Sep', revenue: 29800 },
  { month: 'Oct', revenue: 34500 }, { month: 'Nov', revenue: 33100 }, { month: 'Dec', revenue: 38700 },
];

export default function Example() {
  return (
    <Card style={{ inlineSize: '100%' }}>
      <CardHeader>
        <CardDescription>Revenue this year</CardDescription>
        <CardTitle>$328,700</CardTitle>
      </CardHeader>
      <CardContent>
        <AreaChart
          aria-label="Revenue by month"
          data={data}
          x="month"
          xLabel="Month"
          series={[{ key: 'revenue', label: 'Revenue' }]}
          format={{ value: { style: 'currency', currency: 'USD', maximumFractionDigits: 0 } }}
        />
      </CardContent>
    </Card>
  );
}

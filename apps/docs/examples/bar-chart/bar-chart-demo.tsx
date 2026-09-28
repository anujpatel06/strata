'use client';

import { BarChart, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@syntara/react';

const data = [
  { month: 'May', spend: 2140 }, { month: 'Jun', spend: 2680 }, { month: 'Jul', spend: 1920 },
  { month: 'Aug', spend: 2410 }, { month: 'Sep', spend: 3050 }, { month: 'Oct', spend: 2290 },
];

export default function Example() {
  return (
    <Card style={{ inlineSize: '100%' }}>
      <CardHeader>
        <CardDescription>Card spending</CardDescription>
        <CardTitle>$2,290 in October</CardTitle>
      </CardHeader>
      <CardContent>
        <BarChart
          aria-label="Card spending by month"
          data={data}
          x="month"
          xLabel="Month"
          highlight="Oct"
          series={[{ key: 'spend', label: 'Spending' }]}
          format={{ value: { style: 'currency', currency: 'USD', maximumFractionDigits: 0 } }}
        />
      </CardContent>
    </Card>
  );
}

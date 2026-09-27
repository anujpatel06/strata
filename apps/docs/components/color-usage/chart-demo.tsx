/** The chart palette in use on /docs/color: four series in their fixed order, in the picked tenant. */
import { BarChart, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@strata/react';
import { getColorUsageData } from './data';
import { LiveScope } from './live';
import styles from './color-usage.module.css';

const DATA = [
  { month: 'Jul', rent: 1200, groceries: 420, travel: 180, other: 260 },
  { month: 'Aug', rent: 1200, groceries: 460, travel: 520, other: 210 },
  { month: 'Sep', rent: 1200, groceries: 390, travel: 140, other: 300 },
];

export function ChartDemo() {
  return (
    <LiveScope tenants={getColorUsageData().tenants} className={styles.chartStage} surface="none" label="Chart palette, live">
      <Card>
        <CardHeader>
          <CardDescription>Spending by category</CardDescription>
          <CardTitle level={4}>Series keep their colour, whatever their size</CardTitle>
        </CardHeader>
        <CardContent>
          <BarChart
            aria-label="Spending by category, July to September"
            data={DATA}
            x="month"
            xLabel="Month"
            height={160}
            series={[
              { key: 'rent', label: 'Rent' },
              { key: 'groceries', label: 'Groceries' },
              { key: 'travel', label: 'Travel' },
              { key: 'other', label: 'Other' },
            ]}
            format={{ value: { style: 'currency', currency: 'USD', maximumFractionDigits: 0 } }}
          />
        </CardContent>
      </Card>
    </LiveScope>
  );
}

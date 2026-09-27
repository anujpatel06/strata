import { useMemo, useState } from 'react';
import {
  Amount,
  BarChart,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Eyebrow,
  Meter,
  ToggleButton,
  ToggleButtonGroup,
} from '@strata/react';
import styles from './Screen.module.css';

const CURRENCY = 'USD';

const CATEGORIES = [
  { key: 'groceries', label: 'Groceries' },
  { key: 'dining', label: 'Dining & takeout' },
  { key: 'transport', label: 'Transport' },
  { key: 'utilities', label: 'Utilities' },
  { key: 'shopping', label: 'Shopping' },
  { key: 'entertainment', label: 'Entertainment' },
  { key: 'health', label: 'Health & fitness' },
  { key: 'travel', label: 'Travel' },
] as const;

type CategoryKey = (typeof CATEGORIES)[number]['key'];

// Oldest to newest; 12 months ending this month, in USD major units.
const MONTHLY_SPEND: { month: string; categories: Record<CategoryKey, number> }[] = [
  { month: 'Oct 25', categories: { groceries: 520, dining: 240, transport: 180, utilities: 210, shopping: 160, entertainment: 90, health: 110, travel: 0 } },
  { month: 'Nov 25', categories: { groceries: 540, dining: 260, transport: 190, utilities: 215, shopping: 380, entertainment: 95, health: 100, travel: 0 } },
  { month: 'Dec 25', categories: { groceries: 610, dining: 320, transport: 200, utilities: 230, shopping: 520, entertainment: 130, health: 90, travel: 650 } },
  { month: 'Jan 26', categories: { groceries: 480, dining: 200, transport: 170, utilities: 240, shopping: 140, entertainment: 80, health: 150, travel: 0 } },
  { month: 'Feb 26', categories: { groceries: 500, dining: 210, transport: 175, utilities: 225, shopping: 160, entertainment: 85, health: 120, travel: 0 } },
  { month: 'Mar 26', categories: { groceries: 530, dining: 230, transport: 185, utilities: 215, shopping: 220, entertainment: 100, health: 95, travel: 0 } },
  { month: 'Apr 26', categories: { groceries: 560, dining: 250, transport: 195, utilities: 200, shopping: 300, entertainment: 110, health: 105, travel: 380 } },
  { month: 'May 26', categories: { groceries: 550, dining: 260, transport: 205, utilities: 205, shopping: 250, entertainment: 120, health: 130, travel: 0 } },
  { month: 'Jun 26', categories: { groceries: 580, dining: 280, transport: 210, utilities: 260, shopping: 200, entertainment: 140, health: 140, travel: 0 } },
  { month: 'Jul 26', categories: { groceries: 600, dining: 300, transport: 220, utilities: 270, shopping: 260, entertainment: 150, health: 110, travel: 520 } },
  { month: 'Aug 26', categories: { groceries: 590, dining: 290, transport: 215, utilities: 250, shopping: 340, entertainment: 130, health: 125, travel: 0 } },
  { month: 'Sep 26', categories: { groceries: 610, dining: 310, transport: 225, utilities: 255, shopping: 300, entertainment: 145, health: 135, travel: 0 } },
];

const PERIODS = [
  { id: '3', months: 3, label: '3 months' },
  { id: '6', months: 6, label: '6 months' },
  { id: '12', months: 12, label: '12 months' },
] as const;

function monthTotal(categories: Record<CategoryKey, number>) {
  return CATEGORIES.reduce((sum, c) => sum + categories[c.key], 0);
}

export default function Screen() {
  const [periodId, setPeriodId] = useState<(typeof PERIODS)[number]['id']>('6');
  const period = PERIODS.find((p) => p.id === periodId) ?? PERIODS[1];

  const months = useMemo(() => MONTHLY_SPEND.slice(-period.months), [period.months]);

  const chartData = useMemo(
    () => months.map((m) => ({ month: m.month, spend: monthTotal(m.categories) })),
    [months],
  );

  const periodTotal = useMemo(() => chartData.reduce((sum, m) => sum + m.spend, 0), [chartData]);

  const topCategories = useMemo(() => {
    const totals = CATEGORIES.map((c) => ({
      key: c.key,
      label: c.label,
      amount: months.reduce((sum, m) => sum + m.categories[c.key], 0),
    }));
    return totals
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5)
      .map((c) => ({ ...c, share: periodTotal > 0 ? c.amount / periodTotal : 0 }));
  }, [months, periodTotal]);

  const lastMonth = months[months.length - 1]?.month;

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <Eyebrow>Spending</Eyebrow>
          <h1 className={styles.title}>Spending summary</h1>
        </div>
        <ToggleButtonGroup
          aria-label="Time period"
          selectedKeys={[periodId]}
          disallowEmptySelection
          onSelectionChange={(keys) => {
            const [selected] = Array.from(keys as Iterable<string | number>);
            if (selected != null) setPeriodId(String(selected) as (typeof PERIODS)[number]['id']);
          }}
        >
          {PERIODS.map((p) => (
            <ToggleButton key={p.id} id={p.id}>
              {p.label}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </header>

      <Card className={styles.card}>
        <CardHeader>
          <CardDescription>Total spend, last {period.label}</CardDescription>
          <CardTitle>
            <Amount value={periodTotal} currency={CURRENCY} size="lg" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <BarChart
            aria-label={`Monthly spending, last ${period.label}`}
            data={chartData}
            x="month"
            xLabel="Month"
            highlight={lastMonth}
            series={[{ key: 'spend', label: 'Spending' }]}
            format={{ value: { style: 'currency', currency: CURRENCY, maximumFractionDigits: 0 } }}
          />
        </CardContent>
      </Card>

      <Card className={styles.card}>
        <CardHeader>
          <CardTitle>Top categories</CardTitle>
          <CardDescription>
            Largest five of {CATEGORIES.length} categories, by share of total spend
          </CardDescription>
        </CardHeader>
        <CardContent className={styles.categoryList}>
          {topCategories.map((c) => (
            <Meter
              key={c.key}
              label={c.label}
              value={c.share}
              maxValue={1}
              formatOptions={{ style: 'percent', maximumFractionDigits: 0 }}
              caption={<Amount value={c.amount} currency={CURRENCY} size="sm" />}
            />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

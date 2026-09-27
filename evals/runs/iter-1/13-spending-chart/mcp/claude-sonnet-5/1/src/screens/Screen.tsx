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

const CATEGORY_LABELS = {
  rent: 'Rent',
  groceries: 'Groceries',
  dining: 'Dining out',
  shopping: 'Shopping',
  utilities: 'Utilities',
  transport: 'Transport',
  entertainment: 'Entertainment',
  health: 'Health',
  travel: 'Travel',
  subscriptions: 'Subscriptions',
} as const;

type CategoryKey = keyof typeof CATEGORY_LABELS;

const CATEGORY_KEYS = Object.keys(CATEGORY_LABELS) as CategoryKey[];

type MonthSpending = { month: string; categories: Record<CategoryKey, number> };

// Twelve months of mock spending, oldest first, ending on the current month.
const MONTHLY_SPENDING: MonthSpending[] = [
  { month: 'Oct 2025', categories: { rent: 1450, groceries: 460, dining: 210, shopping: 180, utilities: 195, transport: 120, entertainment: 75, health: 60, travel: 0, subscriptions: 52 } },
  { month: 'Nov 2025', categories: { rent: 1450, groceries: 440, dining: 260, shopping: 340, utilities: 205, transport: 110, entertainment: 90, health: 45, travel: 0, subscriptions: 52 } },
  { month: 'Dec 2025', categories: { rent: 1450, groceries: 500, dining: 300, shopping: 620, utilities: 230, transport: 100, entertainment: 120, health: 50, travel: 380, subscriptions: 52 } },
  { month: 'Jan 2026', categories: { rent: 1450, groceries: 420, dining: 150, shopping: 140, utilities: 240, transport: 95, entertainment: 60, health: 180, travel: 0, subscriptions: 55 } },
  { month: 'Feb 2026', categories: { rent: 1450, groceries: 430, dining: 175, shopping: 160, utilities: 210, transport: 105, entertainment: 70, health: 65, travel: 0, subscriptions: 55 } },
  { month: 'Mar 2026', categories: { rent: 1450, groceries: 450, dining: 190, shopping: 200, utilities: 190, transport: 115, entertainment: 80, health: 55, travel: 0, subscriptions: 55 } },
  { month: 'Apr 2026', categories: { rent: 1450, groceries: 465, dining: 220, shopping: 175, utilities: 175, transport: 120, entertainment: 85, health: 70, travel: 0, subscriptions: 55 } },
  { month: 'May 2026', categories: { rent: 1450, groceries: 470, dining: 240, shopping: 210, utilities: 165, transport: 125, entertainment: 95, health: 60, travel: 520, subscriptions: 55 } },
  { month: 'Jun 2026', categories: { rent: 1450, groceries: 485, dining: 255, shopping: 230, utilities: 170, transport: 130, entertainment: 100, health: 50, travel: 0, subscriptions: 55 } },
  { month: 'Jul 2026', categories: { rent: 1450, groceries: 460, dining: 265, shopping: 195, utilities: 185, transport: 135, entertainment: 110, health: 45, travel: 340, subscriptions: 55 } },
  { month: 'Aug 2026', categories: { rent: 1450, groceries: 475, dining: 250, shopping: 205, utilities: 200, transport: 128, entertainment: 90, health: 55, travel: 0, subscriptions: 55 } },
  { month: 'Sep 2026', categories: { rent: 1450, groceries: 480, dining: 230, shopping: 260, utilities: 210, transport: 118, entertainment: 85, health: 70, travel: 0, subscriptions: 55 } },
];

const RANGE_OPTIONS = [3, 6, 12] as const;
type RangeMonths = (typeof RANGE_OPTIONS)[number];

function monthTotal(month: MonthSpending): number {
  return CATEGORY_KEYS.reduce((sum, key) => sum + month.categories[key], 0);
}

const currencyFormatter = new Intl.NumberFormat(undefined, {
  style: 'currency',
  currency: CURRENCY,
  maximumFractionDigits: 0,
});

const percentFormatter = new Intl.NumberFormat(undefined, {
  style: 'percent',
  maximumFractionDigits: 1,
});

export default function Screen() {
  const [range, setRange] = useState<RangeMonths>(6);

  const rangeData = useMemo(() => MONTHLY_SPENDING.slice(-range), [range]);

  const chartData = useMemo(
    () => rangeData.map((month) => ({ month: month.month, total: monthTotal(month) })),
    [rangeData],
  );

  const totalSpend = useMemo(() => chartData.reduce((sum, m) => sum + m.total, 0), [chartData]);

  const topCategories = useMemo(() => {
    const totals = new Map<CategoryKey, number>(CATEGORY_KEYS.map((key) => [key, 0]));
    for (const month of rangeData) {
      for (const key of CATEGORY_KEYS) {
        totals.set(key, totals.get(key)! + month.categories[key]);
      }
    }
    return Array.from(totals.entries())
      .map(([key, amount]) => ({
        key,
        amount,
        label: CATEGORY_LABELS[key],
        share: totalSpend > 0 ? amount / totalSpend : 0,
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);
  }, [rangeData, totalSpend]);

  const latestMonth = chartData[chartData.length - 1]?.month;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <Eyebrow>Spending</Eyebrow>
          <h1 className={styles.heading}>Spending summary</h1>
        </div>
        <ToggleButtonGroup
          aria-label="Time range"
          selectedKeys={[String(range)]}
          disallowEmptySelection
          onSelectionChange={(keys) => {
            const [value] = Array.from(keys);
            if (value) setRange(Number(value) as RangeMonths);
          }}
        >
          {RANGE_OPTIONS.map((months) => (
            <ToggleButton key={months} id={String(months)}>
              {months} months
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </div>

      <Card>
        <CardHeader>
          <CardDescription>Total spending</CardDescription>
          <CardTitle className={styles.totalTitle}>
            <Amount value={totalSpend} currency={CURRENCY} size="lg" />
            <span className={styles.totalCaption}>over the last {range} months</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <BarChart
            aria-label="Monthly spending"
            data={chartData}
            x="month"
            xLabel="Month"
            highlight={latestMonth}
            series={[{ key: 'total', label: 'Spending' }]}
            format={{ value: { style: 'currency', currency: CURRENCY, maximumFractionDigits: 0 } }}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle level={2}>Top categories</CardTitle>
          <CardDescription>The five largest categories over the last {range} months</CardDescription>
        </CardHeader>
        <CardContent variant="inset">
          <ul className={styles.categoryList}>
            {topCategories.map((category) => (
              <li key={category.key}>
                <Meter
                  label={category.label}
                  value={category.amount}
                  maxValue={totalSpend}
                  valueLabel={`${currencyFormatter.format(category.amount)} · ${percentFormatter.format(category.share)}`}
                />
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

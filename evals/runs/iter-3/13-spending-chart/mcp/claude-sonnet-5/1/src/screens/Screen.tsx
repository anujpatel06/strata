import { useMemo, useState, type ReactNode } from 'react';
import {
  Amount,
  BarChart,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Eyebrow,
  IconTile,
  Meter,
  ToggleButton,
  ToggleButtonGroup,
  type Key,
} from '@syntara/react';
import {
  IconBolt,
  IconBuildingStore,
  IconCar,
  IconHeartPulse,
  IconMovie,
  IconPlane,
  IconRefresh,
  IconShoppingBag,
  IconShoppingCart,
} from '@syntara/icons';
import styles from './Screen.module.css';

const CURRENCY = 'USD';

// Twelve months of mock spend, Oct 25 through Sep 26, oldest first.
const MONTHS = ['Oct 25', 'Nov 25', 'Dec 25', 'Jan 26', 'Feb 26', 'Mar 26', 'Apr 26', 'May 26', 'Jun 26', 'Jul 26', 'Aug 26', 'Sep 26'];

const CATEGORIES: { name: string; icon: ReactNode; values: number[] }[] = [
  { name: 'Groceries', icon: <IconShoppingCart />, values: [380, 410, 395, 430, 405, 440, 420, 450, 415, 460, 435, 470] },
  { name: 'Dining out', icon: <IconBuildingStore />, values: [220, 240, 205, 260, 235, 270, 250, 285, 260, 300, 275, 310] },
  { name: 'Transport', icon: <IconCar />, values: [140, 150, 135, 160, 145, 155, 150, 165, 140, 170, 155, 175] },
  { name: 'Utilities', icon: <IconBolt />, values: [190, 185, 200, 210, 195, 205, 215, 200, 190, 205, 215, 220] },
  { name: 'Shopping', icon: <IconShoppingBag />, values: [260, 300, 340, 220, 410, 250, 290, 320, 260, 380, 300, 260] },
  { name: 'Entertainment', icon: <IconMovie />, values: [80, 95, 110, 70, 120, 85, 100, 90, 75, 130, 95, 105] },
  { name: 'Health', icon: <IconHeartPulse />, values: [60, 55, 70, 300, 65, 60, 75, 60, 180, 65, 70, 60] },
  { name: 'Travel', icon: <IconPlane />, values: [0, 0, 650, 0, 0, 0, 900, 0, 0, 0, 0, 480] },
  { name: 'Subscriptions', icon: <IconRefresh />, values: [42, 42, 48, 48, 48, 54, 54, 54, 54, 60, 60, 60] },
];

const RANGES: { id: string; label: string; months: number }[] = [
  { id: '3', label: '3 months', months: 3 },
  { id: '6', label: '6 months', months: 6 },
  { id: '12', label: '12 months', months: 12 },
];

const currencyFormat = { style: 'currency' as const, currency: CURRENCY, maximumFractionDigits: 0 };

export default function Screen() {
  const [range, setRange] = useState<Set<Key>>(new Set(['6']));
  const months = RANGES.find((r) => r.id === [...range][0])?.months ?? 6;
  const start = MONTHS.length - months;

  const monthlySpend = useMemo(
    () =>
      MONTHS.slice(start).map((month, i) => ({
        month,
        amount: CATEGORIES.reduce((sum, cat) => sum + cat.values[start + i], 0),
      })),
    [start],
  );

  const totalSpend = useMemo(() => monthlySpend.reduce((sum, m) => sum + m.amount, 0), [monthlySpend]);

  const topCategories = useMemo(
    () =>
      CATEGORIES.map((cat) => ({
        name: cat.name,
        icon: cat.icon,
        amount: cat.values.slice(start).reduce((sum, v) => sum + v, 0),
      }))
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 5),
    [start],
  );

  const rangeLabel = RANGES.find((r) => r.months === months)?.label ?? '6 months';

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <Eyebrow>Spending summary</Eyebrow>
          <h1 className={styles.title}>Last {rangeLabel}</h1>
        </div>
        <ToggleButtonGroup
          aria-label="Time range"
          selectedKeys={range}
          onSelectionChange={setRange}
          disallowEmptySelection
        >
          {RANGES.map((r) => (
            <ToggleButton key={r.id} id={r.id}>
              {r.label}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </header>

      <Card>
        <CardHeader>
          <CardDescription>Total spending, last {rangeLabel}</CardDescription>
          <CardTitle>
            <Amount value={totalSpend} currency={CURRENCY} size="lg" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <BarChart
            aria-label={`Monthly spending, last ${rangeLabel}`}
            data={monthlySpend}
            x="month"
            xLabel="Month"
            highlight={monthlySpend[monthlySpend.length - 1]?.month}
            series={[{ key: 'amount', label: 'Spending' }]}
            format={{ value: currencyFormat }}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle level={2}>Top categories</CardTitle>
          <CardDescription>The five largest categories, last {rangeLabel}</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className={styles.categoryList}>
            {topCategories.map((cat) => {
              const share = (cat.amount / totalSpend) * 100;
              return (
                <li key={cat.name} className={styles.categoryRow}>
                  <IconTile tint="auto" name={cat.name}>
                    {cat.icon}
                  </IconTile>
                  <Meter
                    className={styles.meter}
                    label={cat.name}
                    value={cat.amount}
                    maxValue={totalSpend}
                    formatOptions={currencyFormat}
                    caption={`${share.toFixed(0)}% of total`}
                  />
                </li>
              );
            })}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

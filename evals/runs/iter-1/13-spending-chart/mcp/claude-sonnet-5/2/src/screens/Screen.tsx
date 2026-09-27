'use client';

import {
  Amount,
  BarChart,
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Eyebrow,
  IconTile,
  Meter,
  ToggleButton,
  ToggleButtonGroup,
} from '@strata/react';
import {
  IconBolt,
  IconCar,
  IconDeviceTv,
  IconDots,
  IconHeartbeat,
  IconHome,
  IconPlane,
  IconShoppingBag,
  IconShoppingCart,
  IconToolsKitchen2,
  type Icon as StrataIcon,
} from '@strata/icons';
import { useId, useMemo, useState } from 'react';
import styles from './Screen.module.css';

const CURRENCY = 'USD';

interface CategoryDef {
  id: string;
  label: string;
  icon: StrataIcon;
  base: number;
}

const CATEGORIES: CategoryDef[] = [
  { id: 'rent', label: 'Rent & housing', icon: IconHome, base: 1450 },
  { id: 'groceries', label: 'Groceries', icon: IconShoppingCart, base: 420 },
  { id: 'dining', label: 'Dining out', icon: IconToolsKitchen2, base: 260 },
  { id: 'shopping', label: 'Shopping', icon: IconShoppingBag, base: 230 },
  { id: 'transport', label: 'Transport', icon: IconCar, base: 180 },
  { id: 'utilities', label: 'Utilities', icon: IconBolt, base: 150 },
  { id: 'travel', label: 'Travel', icon: IconPlane, base: 140 },
  { id: 'health', label: 'Health', icon: IconHeartbeat, base: 110 },
  { id: 'entertainment', label: 'Entertainment', icon: IconDeviceTv, base: 90 },
  { id: 'other', label: 'Other', icon: IconDots, base: 70 },
];

const MONTH_COUNT = 12;

/** Deterministic pseudo-random in [0, 1), so the mock data is stable across renders. */
function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

const now = new Date();
const MONTHLY_DATA = Array.from({ length: MONTH_COUNT }, (_, i) => {
  const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (MONTH_COUNT - 1 - i), 1));
  const categories: Record<string, number> = {};
  CATEGORIES.forEach((c, ci) => {
    const variance = 0.75 + seededRandom(i * 97 + ci * 13 + 1) * 0.5;
    categories[c.id] = Math.round((c.base * variance) / 10) * 10;
  });
  return { date, categories };
});

type PeriodId = '3' | '6' | '12';
const PERIODS: { id: PeriodId; months: number; label: string }[] = [
  { id: '3', months: 3, label: '3 months' },
  { id: '6', months: 6, label: '6 months' },
  { id: '12', months: 12, label: '12 months' },
];

export default function Screen() {
  const uid = useId();
  const ids = { chart: `${uid}-chart`, categories: `${uid}-categories` };

  const [periodId, setPeriodId] = useState<PeriodId>('6');
  const period = PERIODS.find((p) => p.id === periodId) ?? PERIODS[1];

  const fmt = useMemo(() => {
    const money = new Intl.NumberFormat(undefined, { style: 'currency', currency: CURRENCY, maximumFractionDigits: 0 });
    const share = new Intl.NumberFormat(undefined, { style: 'percent', maximumFractionDigits: 1 });
    return { money: (n: number) => money.format(n), share: (n: number) => share.format(n) };
  }, []);

  const selectedMonths = useMemo(() => MONTHLY_DATA.slice(-period.months), [period.months]);

  const chartData = useMemo(
    () =>
      selectedMonths.map((m) => ({
        month: m.date,
        spend: CATEGORIES.reduce((sum, c) => sum + m.categories[c.id], 0),
      })),
    [selectedMonths],
  );

  const periodTotal = useMemo(() => chartData.reduce((sum, m) => sum + m.spend, 0), [chartData]);

  const topCategories = useMemo(() => {
    const totals = CATEGORIES.map((c) => ({
      ...c,
      amount: selectedMonths.reduce((sum, m) => sum + m.categories[c.id], 0),
    }));
    return totals
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5)
      .map((c) => ({ ...c, share: periodTotal ? c.amount / periodTotal : 0 }));
  }, [selectedMonths, periodTotal]);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Eyebrow>Spending</Eyebrow>
        <h1 className={styles.title}>Spending summary</h1>
        <p className={styles.subtitle}>How your spending has moved over time, and where most of it goes.</p>
      </header>

      <Card rim>
        <CardHeader className={styles.chartHead}>
          <div>
            <CardDescription>Total spending</CardDescription>
            <CardTitle level={2} id={ids.chart} className={styles.totalTitle}>
              <Amount value={periodTotal} currency={CURRENCY} size="lg" />
            </CardTitle>
          </div>
          <CardAction>
            <ToggleButtonGroup
              aria-label="Time range"
              size="sm"
              selectionMode="single"
              disallowEmptySelection
              selectedKeys={[periodId]}
              onSelectionChange={(keys) => {
                const next = [...keys][0];
                if (next) setPeriodId(next as PeriodId);
              }}
            >
              {PERIODS.map((p) => (
                <ToggleButton key={p.id} id={p.id}>
                  {p.label}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
          </CardAction>
        </CardHeader>
        <CardContent>
          <BarChart
            key={periodId}
            aria-labelledby={ids.chart}
            data={chartData}
            x="month"
            xLabel="Month"
            series={[{ key: 'spend', label: 'Spending' }]}
            format={{ x: { month: 'short' }, value: { style: 'currency', currency: CURRENCY, maximumFractionDigits: 0 } }}
          />
        </CardContent>
      </Card>

      <Card rim>
        <CardHeader>
          <CardTitle level={2} id={ids.categories}>
            Top categories
          </CardTitle>
          <CardDescription>The five largest categories over the last {period.label}</CardDescription>
        </CardHeader>
        <CardContent>
          <ol className={styles.categoryList} aria-labelledby={ids.categories}>
            {topCategories.map((c) => (
              <li key={c.id} className={styles.categoryRow}>
                <IconTile tint="auto" name={c.id} size="sm">
                  <c.icon />
                </IconTile>
                <div className={styles.meterWrap}>
                  <Meter
                    label={c.label}
                    value={c.amount}
                    maxValue={periodTotal}
                    valueLabel={fmt.money(c.amount)}
                    caption={`${fmt.share(c.share)} of spend`}
                  />
                </div>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}

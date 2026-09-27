import { useId, useMemo, useState, type JSX } from 'react';
import {
  Amount,
  BarChart,
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  IconTile,
  Meter,
  ToggleButton,
  ToggleButtonGroup,
  type IconTileProps,
  type MeterProps,
} from '@strata/react';
import {
  IconApple,
  IconBolt,
  IconCar,
  IconHeartPulse,
  IconHome,
  IconMovie,
  IconShoppingBag,
  IconShoppingCart,
  type Icon as StrataIcon,
} from '@strata/icons';
import styles from './Screen.module.css';

const CURRENCY = 'USD';

/** Widths people can pick between. */
const PERIODS = [3, 6, 12] as const;
type Period = (typeof PERIODS)[number];

type CategoryId = 'housing' | 'groceries' | 'dining' | 'transport' | 'shopping' | 'utilities' | 'entertainment' | 'health';

interface CategoryMeta {
  id: CategoryId;
  label: string;
  icon: StrataIcon;
  tint: IconTileProps['tint'];
  tone: MeterProps['tone'];
}

const CATEGORIES: CategoryMeta[] = [
  { id: 'housing', label: 'Housing', icon: IconHome, tint: 'brand', tone: 'brand' },
  { id: 'groceries', label: 'Groceries', icon: IconShoppingCart, tint: 'success', tone: 'success' },
  { id: 'dining', label: 'Dining out', icon: IconApple, tint: 'warning', tone: 'warning' },
  { id: 'transport', label: 'Transport', icon: IconCar, tint: 'info', tone: 'info' },
  { id: 'shopping', label: 'Shopping', icon: IconShoppingBag, tint: 'accent', tone: 'accent' },
  { id: 'utilities', label: 'Utilities', icon: IconBolt, tint: 'solid', tone: 'neutral' },
  { id: 'entertainment', label: 'Entertainment', icon: IconMovie, tint: 'danger', tone: 'danger' },
  { id: 'health', label: 'Health', icon: IconHeartPulse, tint: 'warning', tone: 'warning' },
];

// Mock monthly spend per category, oldest to newest, for the 12 months up to this one.
const MOCK_AMOUNTS: Record<CategoryId, number[]> = {
  housing: [1800, 1800, 1800, 1800, 1800, 1800, 1800, 1800, 1800, 1800, 1800, 1800],
  groceries: [420, 460, 510, 480, 400, 440, 470, 490, 460, 500, 430, 450],
  dining: [180, 220, 340, 260, 150, 190, 210, 240, 260, 300, 230, 270],
  transport: [120, 110, 95, 130, 140, 125, 115, 150, 160, 145, 130, 135],
  shopping: [150, 180, 520, 220, 90, 130, 160, 140, 200, 260, 170, 190],
  utilities: [160, 175, 210, 230, 220, 190, 170, 150, 160, 180, 200, 210],
  entertainment: [60, 80, 150, 70, 50, 65, 75, 90, 100, 120, 85, 95],
  health: [40, 30, 260, 50, 300, 45, 35, 60, 40, 55, 45, 50],
};

const MONTH_COUNT = 12;

const startOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1);

const monthsAgo = (date: Date, count: number) => {
  const start = startOfMonth(date);
  start.setMonth(start.getMonth() - count);
  return start;
};

interface Month {
  date: Date;
  amounts: Record<CategoryId, number>;
}

function buildMonths(now: Date): Month[] {
  return Array.from({ length: MONTH_COUNT }, (_, i) => {
    const offset = MONTH_COUNT - 1 - i;
    const amounts = Object.fromEntries(
      CATEGORIES.map((cat) => [cat.id, MOCK_AMOUNTS[cat.id][i] ?? 0]),
    ) as Record<CategoryId, number>;
    return { date: monthsAgo(now, offset), amounts };
  });
}

const sum = (values: number[]) => values.reduce((a, b) => a + b, 0);

export default function Screen(): JSX.Element {
  const uid = useId();
  const [period, setPeriod] = useState<Period>(6);

  const months = useMemo(() => buildMonths(new Date()), []);
  const shown = months.slice(-period);

  const chartData = shown.map((month) => ({
    date: month.date,
    spend: sum(CATEGORIES.map((cat) => month.amounts[cat.id])),
  }));
  const total = sum(chartData.map((d) => d.spend));
  const lastMonth = chartData[chartData.length - 1];

  const topCategories = CATEGORIES.map((cat) => ({
    ...cat,
    amount: sum(shown.map((month) => month.amounts[cat.id])),
  }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5)
    .map((cat) => ({ ...cat, share: total ? cat.amount / total : 0 }));

  const ids = {
    chart: `${uid}-chart`,
    categories: `${uid}-categories`,
  };

  return (
    <div className={styles.root}>
      <header className={styles.header}>
        <h1 className={styles.title}>Spending summary</h1>
        <p className={styles.subtitle}>Where your money went, and how it's trending.</p>
      </header>

      <Card className={styles.card}>
        <CardHeader className={styles.chartHeader}>
          <div>
            <CardTitle level={2} id={ids.chart}>
              Monthly spending
            </CardTitle>
            <Amount value={Math.round(total)} currency={CURRENCY} size="lg" className={styles.total} />
            <CardDescription>
              Total over the last {period} {period === 1 ? 'month' : 'months'}
            </CardDescription>
          </div>
          <CardAction>
            <ToggleButtonGroup
              aria-label="Months shown"
              size="sm"
              selectionMode="single"
              disallowEmptySelection
              selectedKeys={[String(period)]}
              onSelectionChange={(keys) => {
                const next = [...keys][0];
                if (next) setPeriod(Number(next) as Period);
              }}
            >
              {PERIODS.map((n) => (
                <ToggleButton key={n} id={String(n)}>
                  {n}M
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
          </CardAction>
        </CardHeader>
        <CardContent>
          <BarChart
            key={period}
            aria-labelledby={ids.chart}
            data={chartData}
            x="date"
            xLabel="Month"
            highlight={lastMonth?.date}
            series={[{ key: 'spend', label: 'Spending' }]}
            format={{
              value: { style: 'currency', currency: CURRENCY, maximumFractionDigits: 0 },
              x: { month: 'short', year: '2-digit' },
            }}
            height={280}
          />
        </CardContent>
      </Card>

      <Card className={styles.card}>
        <CardHeader>
          <CardTitle level={2} id={ids.categories}>
            Top categories
          </CardTitle>
          <CardDescription>
            The five biggest categories over the last {period} {period === 1 ? 'month' : 'months'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className={styles.categoryList} aria-labelledby={ids.categories}>
            {topCategories.map((cat) => {
              const Icon = cat.icon;
              return (
                <li key={cat.id} className={styles.categoryRow}>
                  <IconTile tint={cat.tint} size="md">
                    <Icon />
                  </IconTile>
                  <Meter
                    className={styles.meter}
                    label={cat.label}
                    value={cat.share}
                    maxValue={1}
                    tone={cat.tone}
                    caption={<Amount value={cat.amount} currency={CURRENCY} size="sm" />}
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

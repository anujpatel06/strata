import { useMemo, useState, type ComponentType } from 'react';
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
  IconDots,
  IconHeartPulse,
  IconHome,
  IconMovie,
  IconPlane,
  IconShoppingBag,
  IconShoppingCart,
} from '@syntara/icons';
import styles from './Screen.module.css';

type CategoryId =
  | 'housing'
  | 'groceries'
  | 'dining'
  | 'transport'
  | 'utilities'
  | 'entertainment'
  | 'health'
  | 'shopping'
  | 'travel'
  | 'other';

const CATEGORY_META: Record<CategoryId, { label: string; Icon: ComponentType }> = {
  housing: { label: 'Housing', Icon: IconHome },
  groceries: { label: 'Groceries', Icon: IconShoppingCart },
  dining: { label: 'Dining out', Icon: IconBuildingStore },
  transport: { label: 'Transport', Icon: IconCar },
  utilities: { label: 'Utilities', Icon: IconBolt },
  entertainment: { label: 'Entertainment', Icon: IconMovie },
  health: { label: 'Health', Icon: IconHeartPulse },
  shopping: { label: 'Shopping', Icon: IconShoppingBag },
  travel: { label: 'Travel', Icon: IconPlane },
  other: { label: 'Other', Icon: IconDots },
};

type MonthSpending = { month: string; categories: Record<CategoryId, number> };

// Twelve months of mock spending, oldest to newest, ending on the current month.
const MONTHLY_SPENDING: MonthSpending[] = [
  { month: 'Oct 2025', categories: { housing: 1450, groceries: 460, dining: 210, transport: 160, utilities: 180, entertainment: 90, health: 60, shopping: 140, travel: 0, other: 45 } },
  { month: 'Nov 2025', categories: { housing: 1450, groceries: 480, dining: 250, transport: 175, utilities: 220, entertainment: 100, health: 80, shopping: 220, travel: 0, other: 50 } },
  { month: 'Dec 2025', categories: { housing: 1450, groceries: 510, dining: 320, transport: 150, utilities: 260, entertainment: 140, health: 50, shopping: 480, travel: 380, other: 70 } },
  { month: 'Jan 2026', categories: { housing: 1450, groceries: 440, dining: 190, transport: 165, utilities: 240, entertainment: 70, health: 210, shopping: 150, travel: 0, other: 40 } },
  { month: 'Feb 2026', categories: { housing: 1450, groceries: 430, dining: 200, transport: 170, utilities: 200, entertainment: 85, health: 90, shopping: 120, travel: 0, other: 35 } },
  { month: 'Mar 2026', categories: { housing: 1450, groceries: 450, dining: 230, transport: 180, utilities: 170, entertainment: 95, health: 60, shopping: 160, travel: 0, other: 45 } },
  { month: 'Apr 2026', categories: { housing: 1450, groceries: 470, dining: 240, transport: 185, utilities: 150, entertainment: 110, health: 50, shopping: 180, travel: 420, other: 50 } },
  { month: 'May 2026', categories: { housing: 1450, groceries: 490, dining: 260, transport: 190, utilities: 140, entertainment: 120, health: 70, shopping: 200, travel: 0, other: 55 } },
  { month: 'Jun 2026', categories: { housing: 1450, groceries: 500, dining: 280, transport: 200, utilities: 160, entertainment: 130, health: 45, shopping: 210, travel: 650, other: 60 } },
  { month: 'Jul 2026', categories: { housing: 1450, groceries: 480, dining: 300, transport: 210, utilities: 190, entertainment: 140, health: 55, shopping: 190, travel: 0, other: 55 } },
  { month: 'Aug 2026', categories: { housing: 1450, groceries: 510, dining: 320, transport: 220, utilities: 210, entertainment: 150, health: 65, shopping: 230, travel: 0, other: 60 } },
  { month: 'Sep 2026', categories: { housing: 1450, groceries: 495, dining: 280, transport: 205, utilities: 175, entertainment: 120, health: 75, shopping: 175, travel: 0, other: 50 } },
];

const CURRENCY = 'USD';

const PERIODS: { id: '3' | '6' | '12'; label: string; months: number }[] = [
  { id: '3', label: '3 months', months: 3 },
  { id: '6', label: '6 months', months: 6 },
  { id: '12', label: '12 months', months: 12 },
];

function monthTotal(month: MonthSpending) {
  return Object.values(month.categories).reduce((sum, amount) => sum + amount, 0);
}

export default function Screen() {
  const [period, setPeriod] = useState<Set<Key>>(new Set(['6']));
  const periodId = String([...period][0] ?? '6');
  const months = PERIODS.find((p) => p.id === periodId)?.months ?? 6;

  const selectedMonths = useMemo(() => MONTHLY_SPENDING.slice(-months), [months]);

  const chartData = useMemo(
    () => selectedMonths.map((m) => ({ month: m.month, spend: monthTotal(m) })),
    [selectedMonths],
  );

  const totalSpend = useMemo(() => chartData.reduce((sum, d) => sum + d.spend, 0), [chartData]);

  const topCategories = useMemo(() => {
    const totals = new Map<CategoryId, number>();
    for (const m of selectedMonths) {
      for (const [id, amount] of Object.entries(m.categories) as [CategoryId, number][]) {
        totals.set(id, (totals.get(id) ?? 0) + amount);
      }
    }
    return [...totals.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([id, amount]) => ({ id, amount }));
  }, [selectedMonths]);

  const latestMonth = selectedMonths[selectedMonths.length - 1];

  return (
    <div className={styles.screen}>
      <header className={styles.header}>
        <div>
          <Eyebrow>Spending</Eyebrow>
          <h1 className={styles.title}>Spending summary</h1>
          <p className={styles.subtitle}>Monthly spending and top categories over the selected period.</p>
        </div>
        <ToggleButtonGroup
          aria-label="Time range"
          selectedKeys={period}
          onSelectionChange={setPeriod}
          disallowEmptySelection
        >
          {PERIODS.map((p) => (
            <ToggleButton key={p.id} id={p.id}>
              {p.label}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </header>

      <Card>
        <CardHeader>
          <CardDescription>Total spending, last {months} months</CardDescription>
          <CardTitle level={2}>
            <Amount value={totalSpend} currency={CURRENCY} size="md" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <BarChart
            aria-label={`Monthly spending, last ${months} months`}
            data={chartData}
            x="month"
            xLabel="Month"
            highlight={latestMonth.month}
            series={[{ key: 'spend', label: 'Spending' }]}
            format={{ value: { style: 'currency', currency: CURRENCY, maximumFractionDigits: 0 } }}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle level={2}>Top categories</CardTitle>
          <CardDescription>The five biggest categories in this period</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className={styles.categoryList}>
            {topCategories.map(({ id, amount }) => {
              const { label, Icon } = CATEGORY_META[id];
              return (
                <li key={id} className={styles.categoryRow}>
                  <IconTile tint="auto" name={label}>
                    <Icon />
                  </IconTile>
                  <div className={styles.categoryInfo}>
                    <div className={styles.categoryHead}>
                      <span className={styles.categoryName}>{label}</span>
                      <Amount value={amount} currency={CURRENCY} size="sm" />
                    </div>
                    <Meter
                      aria-label={`${label}, share of total spending`}
                      value={amount}
                      maxValue={totalSpend}
                      tone="brand"
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

import { useMemo, useState, type ReactNode } from 'react';
import { useLocale } from 'react-aria-components';
import {
  Amount,
  Badge,
  BarChart,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  IconTile,
  Meter,
  StatTile,
  ToggleButton,
  ToggleButtonGroup,
} from '@strata/react';
import {
  IconApple,
  IconBolt,
  IconBuilding,
  IconCar,
  IconHeartPulse,
  IconMovie,
  IconShoppingBag,
  IconShoppingCart,
} from '@strata/icons';
import styles from './Screen.module.css';

type Range = 3 | 6 | 12;

interface Category {
  key: string;
  label: string;
  icon: ReactNode;
  /** 12 months of spend in INR, oldest to newest. */
  values: number[];
}

const CURRENCY = 'INR';
const RANGE_OPTIONS: Range[] = [3, 6, 12];

const CATEGORIES: Category[] = [
  {
    key: 'housing',
    label: 'Housing & rent',
    icon: <IconBuilding />,
    values: [32000, 32000, 32000, 32000, 34500, 32000, 32000, 32000, 32000, 36200, 32000, 32000],
  },
  {
    key: 'groceries',
    label: 'Groceries',
    icon: <IconShoppingCart />,
    values: [9800, 10200, 9650, 10400, 10850, 11200, 10600, 11950, 14200, 15300, 11100, 10450],
  },
  {
    key: 'dining',
    label: 'Dining & takeout',
    icon: <IconApple />,
    values: [4200, 4650, 5100, 4800, 5400, 6100, 5800, 6400, 7200, 6850, 5600, 5200],
  },
  {
    key: 'transport',
    label: 'Transport & fuel',
    icon: <IconCar />,
    values: [3600, 3850, 4100, 3950, 4400, 4700, 4300, 4600, 5100, 4950, 4250, 4050],
  },
  {
    key: 'shopping',
    label: 'Shopping',
    icon: <IconShoppingBag />,
    values: [3200, 2800, 4600, 3900, 5200, 4100, 3800, 6200, 8900, 11400, 5600, 4200],
  },
  {
    key: 'utilities',
    label: 'Utilities & bills',
    icon: <IconBolt />,
    values: [4100, 4300, 5200, 5900, 6400, 6100, 5700, 5300, 4600, 4200, 4400, 4800],
  },
  {
    key: 'entertainment',
    label: 'Entertainment',
    icon: <IconMovie />,
    values: [2100, 1850, 2400, 2600, 2300, 2900, 3100, 2700, 3400, 3900, 2600, 2200],
  },
  {
    key: 'health',
    label: 'Health & fitness',
    icon: <IconHeartPulse />,
    values: [1600, 1750, 1400, 2100, 1900, 1650, 2300, 1500, 1800, 2600, 2000, 1750],
  },
];

function sum(values: number[]): number {
  return values.reduce((total, value) => total + value, 0);
}

/** The last `count` calendar months, oldest first, ending this month. */
function monthsBack(count: number): Date[] {
  const now = new Date();
  return Array.from({ length: count }, (_, i) => new Date(now.getFullYear(), now.getMonth() - (count - 1 - i), 1));
}

export default function Screen() {
  const { locale } = useLocale();
  const [range, setRange] = useState<Range>(6);

  const months = useMemo(() => monthsBack(12), []);
  const sliceStart = 12 - range;
  const visibleMonths = months.slice(sliceStart);
  const rangeLabel = `Last ${range} months`;

  const monthFormatter = useMemo(() => {
    const spansMultipleYears = visibleMonths[0].getFullYear() !== visibleMonths[visibleMonths.length - 1].getFullYear();
    return new Intl.DateTimeFormat(locale, spansMultipleYears ? { month: 'short', year: '2-digit' } : { month: 'short' });
  }, [locale, visibleMonths]);

  const chartData = visibleMonths.map((date, i) => ({
    month: monthFormatter.format(date),
    amount: sum(CATEGORIES.map((category) => category.values[sliceStart + i])),
  }));

  const currentTotal = sum(chartData.map((row) => row.amount));

  const prevStart = sliceStart - range;
  const previousTotal = prevStart >= 0
    ? sum(CATEGORIES.map((category) => sum(category.values.slice(prevStart, sliceStart))))
    : undefined;
  const delta = previousTotal !== undefined && previousTotal > 0
    ? (currentTotal - previousTotal) / previousTotal
    : undefined;

  const categoryTotals = CATEGORIES.map((category) => ({
    ...category,
    total: sum(category.values.slice(sliceStart)),
  }));
  const topCategories = [...categoryTotals].sort((a, b) => b.total - a.total).slice(0, 5);
  const otherCount = categoryTotals.length - topCategories.length;
  const otherTotal = currentTotal - sum(topCategories.map((category) => category.total));

  const percentFormatter = useMemo(
    () => new Intl.NumberFormat(locale, { style: 'percent', maximumFractionDigits: 0 }),
    [locale],
  );

  return (
    <div className={styles.screen}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Spending summary</h1>
          <p className={styles.subtitle}>Where your money went, at a glance.</p>
        </div>
        <ToggleButtonGroup
          className={styles.rangeGroup}
          aria-label="Months to show"
          selectionMode="single"
          disallowEmptySelection
          selectedKeys={[String(range)]}
          onSelectionChange={(keys) => {
            const [next] = keys;
            if (next !== undefined) setRange(Number(next) as Range);
          }}
        >
          {RANGE_OPTIONS.map((option) => (
            <ToggleButton key={option} id={String(option)}>{option}M</ToggleButton>
          ))}
        </ToggleButtonGroup>
      </header>

      <Card>
        <CardHeader divider>
          <CardTitle level={2}>Monthly spending</CardTitle>
          <CardDescription>{rangeLabel}</CardDescription>
        </CardHeader>
        <CardContent className={styles.chartContent}>
          <StatTile
            variant="ghost"
            label="Total spent"
            value={<Amount value={currentTotal} currency={CURRENCY} size="lg" />}
            delta={delta}
            deltaLabel={`vs previous ${range} months`}
            positiveIsGood={false}
            caption={`Across ${rangeLabel.toLowerCase()}`}
          />
          <BarChart
            aria-label={`Monthly spending, ${rangeLabel.toLowerCase()}`}
            data={chartData}
            x="month"
            xLabel="Month"
            series={[{ key: 'amount', label: 'Spending' }]}
            format={{ value: { style: 'currency', currency: CURRENCY, maximumFractionDigits: 0 } }}
            highlight={chartData[chartData.length - 1]?.month}
            height={240}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader divider>
          <CardTitle level={2}>Top categories</CardTitle>
          <CardDescription>Your 5 biggest categories, {rangeLabel.toLowerCase()}</CardDescription>
        </CardHeader>
        <CardContent>
          <ol className={styles.categoryList}>
            {topCategories.map((category) => {
              const share = currentTotal > 0 ? category.total / currentTotal : 0;
              return (
                <li key={category.key} className={styles.categoryRow}>
                  <IconTile tint="auto" name={category.label} size="md">
                    {category.icon}
                  </IconTile>
                  <div className={styles.categoryMain}>
                    <span className={styles.categoryLabel}>{category.label}</span>
                    <Meter
                      aria-label={`${category.label} share of spending`}
                      value={share * 100}
                      showValue={false}
                    />
                  </div>
                  <div className={styles.categoryFigures}>
                    <Amount value={category.total} currency={CURRENCY} size="sm" />
                    <Badge tone="neutral" variant="soft" size="sm">
                      {percentFormatter.format(share)}
                    </Badge>
                  </div>
                </li>
              );
            })}
          </ol>
        </CardContent>
        {otherCount > 0 && (
          <CardFooter divider className={styles.footer}>
            {otherCount} more {otherCount === 1 ? 'category' : 'categories'} · {percentFormatter.format(currentTotal > 0 ? otherTotal / currentTotal : 0)} of spending
          </CardFooter>
        )}
      </Card>
    </div>
  );
}

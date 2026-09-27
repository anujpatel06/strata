import { useMemo, useState, type ReactNode } from 'react';
import { useLocale } from 'react-aria-components';
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
  StatTile,
  StatTileGroup,
  ToggleButton,
  ToggleButtonGroup,
} from '@strata/react';
import {
  IconApple,
  IconBolt,
  IconCar,
  IconDeviceDesktop,
  IconHome,
  IconMovie,
  IconShoppingBag,
  IconShoppingCart,
} from '@strata/icons';
import styles from './Screen.module.css';

type RangeMonths = 3 | 6 | 12;

const RANGE_OPTIONS: RangeMonths[] = [3, 6, 12];

/** Two years of history, so a "previous period" comparison always exists for every range. */
const TOTAL_MONTHS = 24;

const CATEGORIES = [
  { id: 'housing', label: 'Housing', icon: <IconHome /> },
  { id: 'groceries', label: 'Groceries', icon: <IconShoppingCart /> },
  { id: 'dining', label: 'Dining out', icon: <IconApple /> },
  { id: 'transport', label: 'Transport', icon: <IconCar /> },
  { id: 'utilities', label: 'Utilities', icon: <IconBolt /> },
  { id: 'shopping', label: 'Shopping', icon: <IconShoppingBag /> },
  { id: 'entertainment', label: 'Entertainment', icon: <IconMovie /> },
  { id: 'subscriptions', label: 'Subscriptions', icon: <IconDeviceDesktop /> },
] as const satisfies { id: string; label: string; icon: ReactNode }[];

type CategoryId = (typeof CATEGORIES)[number]['id'];

/** Mock monthly spend per category, oldest to newest, 24 months (two years of history). */
const MONTHLY_SPEND: Record<CategoryId, number[]> = {
  housing: [
    1350, 1350, 1350, 1350, 1350, 1400, 1400, 1400, 1400, 1400, 1450, 1450, 1450, 1450, 1450,
    1450, 1500, 1500, 1500, 1500, 1500, 1500, 1500, 1500,
  ],
  groceries: [
    350, 365, 335, 385, 360, 410, 370, 395, 375, 405, 385, 400, 390, 410, 375, 430, 405, 460, 415,
    440, 420, 455, 430, 445,
  ],
  dining: [
    150, 175, 140, 205, 165, 185, 150, 215, 175, 195, 160, 205, 180, 210, 165, 240, 195, 220, 175,
    255, 205, 230, 190, 245,
  ],
  transport: [
    140, 125, 150, 120, 160, 140, 130, 165, 145, 170, 135, 155, 150, 140, 165, 130, 175, 155, 145,
    180, 160, 190, 150, 170,
  ],
  utilities: [
    110, 105, 145, 100, 95, 135, 150, 110, 100, 140, 145, 105, 120, 115, 160, 110, 105, 150, 165,
    120, 110, 155, 160, 115,
  ],
  shopping: [
    130, 100, 290, 95, 150, 110, 320, 120, 135, 270, 125, 170, 150, 120, 340, 110, 180, 130, 380,
    140, 160, 320, 150, 200,
  ],
  entertainment: [
    50, 65, 40, 80, 60, 45, 90, 55, 70, 45, 65, 75, 60, 80, 45, 95, 70, 55, 110, 65, 85, 50, 75, 90,
  ],
  subscriptions: [
    45, 45, 48, 48, 50, 50, 52, 52, 55, 55, 58, 58, 58, 58, 60, 60, 62, 62, 65, 65, 65, 68, 68, 70,
  ],
};

function currencyForLocale(locale: string): string {
  const region = locale.split('-')[1]?.toUpperCase();
  if (region === 'AE') return 'AED';
  if (region === 'IN') return 'INR';
  return 'USD';
}

/** Short month labels for the trailing `count` months, ending this month. */
function getMonthLabels(count: number, locale: string): string[] {
  const now = new Date();
  const format = new Intl.DateTimeFormat(locale, { month: 'short' });
  return Array.from({ length: count }, (_, i) => {
    const offset = count - 1 - i;
    return format.format(new Date(now.getFullYear(), now.getMonth() - offset, 1));
  });
}

function sum(values: number[]): number {
  return values.reduce((total, value) => total + value, 0);
}

export default function Screen() {
  const { locale } = useLocale();
  const currency = currencyForLocale(locale);
  const [range, setRange] = useState<RangeMonths>(6);

  const monthLabels = useMemo(() => getMonthLabels(TOTAL_MONTHS, locale), [locale]);

  const startIndex = TOTAL_MONTHS - range;
  const prevStartIndex = TOTAL_MONTHS - range * 2;

  const chartData = monthLabels.slice(startIndex).map((month, i) => ({
    month,
    total: sum(CATEGORIES.map((c) => MONTHLY_SPEND[c.id][startIndex + i])),
  }));

  const total = sum(chartData.map((row) => row.total));
  const average = total / range;

  const prevTotal = sum(
    CATEGORIES.map((c) => sum(MONTHLY_SPEND[c.id].slice(prevStartIndex, startIndex))),
  );
  const delta = prevTotal > 0 ? (total - prevTotal) / prevTotal : 0;

  const topCategories = CATEGORIES.map((c) => ({
    ...c,
    amount: sum(MONTHLY_SPEND[c.id].slice(startIndex)),
  }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);

  return (
    <div className={styles.screen}>
      <header className={styles.header}>
        <div>
          <Eyebrow>Spending summary</Eyebrow>
          <h1 className={styles.title}>Where your money went</h1>
        </div>
        <ToggleButtonGroup
          aria-label="Time range"
          disallowEmptySelection
          selectedKeys={[String(range)]}
          onSelectionChange={(keys) => {
            const [key] = keys;
            if (key != null) setRange(Number(key) as RangeMonths);
          }}
        >
          {RANGE_OPTIONS.map((months) => (
            <ToggleButton key={months} id={String(months)}>
              {months} months
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </header>

      <StatTileGroup className={styles.stats}>
        <StatTile
          label="Total spent"
          value={<Amount value={total} currency={currency} size="lg" />}
          delta={delta}
          deltaLabel={`vs previous ${range} months`}
          positiveIsGood={false}
        />
        <StatTile
          label="Monthly average"
          value={<Amount value={average} currency={currency} size="lg" />}
          caption={`Over the last ${range} months`}
        />
      </StatTileGroup>

      <Card>
        <CardHeader>
          <CardTitle level={2}>Monthly spending</CardTitle>
          <CardDescription>Total spend by month, last {range} months</CardDescription>
        </CardHeader>
        <CardContent>
          <BarChart
            aria-label={`Monthly spending, last ${range} months`}
            data={chartData}
            x="month"
            series={[{ key: 'total', label: 'Spending' }]}
            format={{
              value: { style: 'currency', currency, maximumFractionDigits: 0 },
              axis: { style: 'currency', currency, notation: 'compact', maximumFractionDigits: 1 },
            }}
            highlight={chartData[chartData.length - 1]?.month}
            height={240}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle level={2}>Top categories</CardTitle>
          <CardDescription>The five biggest categories, last {range} months</CardDescription>
        </CardHeader>
        <CardContent className={styles.categories}>
          {topCategories.map((category) => {
            const share = total > 0 ? category.amount / total : 0;
            const shareLabel = share.toLocaleString(locale, {
              style: 'percent',
              maximumFractionDigits: 1,
            });
            return (
              <div key={category.id} className={styles.categoryRow}>
                <IconTile tint="auto" name={category.label} size="sm">
                  {category.icon}
                </IconTile>
                <div className={styles.categoryBody}>
                  <div className={styles.categoryTop}>
                    <span className={styles.categoryName}>{category.label}</span>
                    <Amount value={category.amount} currency={currency} size="sm" />
                  </div>
                  <Meter
                    aria-label={`${category.label} share of total spending`}
                    value={category.amount}
                    minValue={0}
                    maxValue={total}
                    showValue={false}
                  />
                  <span className={styles.categoryShare}>{shareLabel} of spending</span>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}

import { useEffect, useMemo, useRef, useState } from 'react';
import styles from './Screen.module.css';

type CategoryId =
  | 'groceries'
  | 'dining'
  | 'transport'
  | 'shopping'
  | 'utilities'
  | 'entertainment'
  | 'health'
  | 'travel'
  | 'housing'
  | 'subscriptions';

interface MonthEntry {
  key: string; // 'YYYY-MM'
  amounts: Record<CategoryId, number>;
}

interface CategoryMeta {
  id: CategoryId;
  name: string;
  color: string;
}

const CATEGORY_META: CategoryMeta[] = [
  { id: 'housing', name: 'Housing', color: '#64748b' },
  { id: 'groceries', name: 'Groceries', color: '#f97316' },
  { id: 'shopping', name: 'Shopping', color: '#a855f7' },
  { id: 'dining', name: 'Dining & takeout', color: '#ef4444' },
  { id: 'utilities', name: 'Utilities', color: '#06b6d4' },
  { id: 'transport', name: 'Transport', color: '#3b82f6' },
  { id: 'travel', name: 'Travel', color: '#eab308' },
  { id: 'entertainment', name: 'Entertainment', color: '#ec4899' },
  { id: 'health', name: 'Health & fitness', color: '#22c55e' },
  { id: 'subscriptions', name: 'Subscriptions', color: '#14b8a6' },
];

// 12 months of mock spending, oldest first, ending with the current month.
const MOCK_MONTHS: MonthEntry[] = [
  {
    key: '2025-10',
    amounts: {
      groceries: 14200, dining: 8600, transport: 6200, shopping: 9800, utilities: 5400,
      entertainment: 3200, health: 4100, travel: 0, housing: 22000, subscriptions: 1450,
    },
  },
  {
    key: '2025-11',
    amounts: {
      groceries: 13800, dining: 9100, transport: 5900, shopping: 11200, utilities: 5600,
      entertainment: 2900, health: 3800, travel: 0, housing: 22000, subscriptions: 1450,
    },
  },
  {
    key: '2025-12',
    amounts: {
      groceries: 15600, dining: 12400, transport: 6800, shopping: 18500, utilities: 6200,
      entertainment: 4800, health: 3600, travel: 21000, housing: 22000, subscriptions: 1600,
    },
  },
  {
    key: '2026-01',
    amounts: {
      groceries: 13500, dining: 7800, transport: 6000, shopping: 7200, utilities: 6800,
      entertainment: 2600, health: 5200, travel: 0, housing: 22000, subscriptions: 1450,
    },
  },
  {
    key: '2026-02',
    amounts: {
      groceries: 13100, dining: 8200, transport: 5700, shopping: 6800, utilities: 6100,
      entertainment: 3000, health: 4600, travel: 0, housing: 22000, subscriptions: 1450,
    },
  },
  {
    key: '2026-03',
    amounts: {
      groceries: 14000, dining: 8900, transport: 6100, shopping: 8300, utilities: 5800,
      entertainment: 3400, health: 4000, travel: 0, housing: 22000, subscriptions: 1500,
    },
  },
  {
    key: '2026-04',
    amounts: {
      groceries: 14300, dining: 9300, transport: 6300, shopping: 9100, utilities: 7200,
      entertainment: 3300, health: 3900, travel: 0, housing: 22000, subscriptions: 1500,
    },
  },
  {
    key: '2026-05',
    amounts: {
      groceries: 14700, dining: 9600, transport: 6500, shopping: 9700, utilities: 8600,
      entertainment: 3500, health: 3700, travel: 0, housing: 22000, subscriptions: 1550,
    },
  },
  {
    key: '2026-06',
    amounts: {
      groceries: 14100, dining: 10200, transport: 6700, shopping: 10400, utilities: 9400,
      entertainment: 4200, health: 3500, travel: 15800, housing: 22000, subscriptions: 1550,
    },
  },
  {
    key: '2026-07',
    amounts: {
      groceries: 13900, dining: 9800, transport: 6400, shopping: 8800, utilities: 9100,
      entertainment: 3800, health: 3600, travel: 0, housing: 22000, subscriptions: 1550,
    },
  },
  {
    key: '2026-08',
    amounts: {
      groceries: 14500, dining: 9400, transport: 6200, shopping: 9200, utilities: 8300,
      entertainment: 3600, health: 3800, travel: 0, housing: 22000, subscriptions: 1600,
    },
  },
  {
    key: '2026-09',
    amounts: {
      groceries: 14800, dining: 9700, transport: 6600, shopping: 10600, utilities: 6900,
      entertainment: 4000, health: 4200, travel: 0, housing: 22000, subscriptions: 1600,
    },
  },
];

const PERIOD_OPTIONS = [3, 6, 12] as const;
type Period = (typeof PERIOD_OPTIONS)[number];

const CURRENCY_BY_LOCALE: Record<string, string> = {
  'en-IN': 'INR',
  'ar-AE': 'AED',
};

function monthKeyToDate(key: string): Date {
  const [year, month] = key.split('-').map(Number);
  return new Date(year, month - 1, 1);
}

function monthTotal(entry: MonthEntry): number {
  return CATEGORY_META.reduce((sum, c) => sum + entry.amounts[c.id], 0);
}

export default function Screen() {
  const rootRef = useRef<HTMLDivElement>(null);
  const [locale, setLocale] = useState('en-IN');
  const [period, setPeriod] = useState<Period>(6);

  useEffect(() => {
    const lang = rootRef.current?.closest('[lang]')?.getAttribute('lang');
    if (lang) setLocale(lang);
  }, []);

  const currency = CURRENCY_BY_LOCALE[locale] ?? 'USD';

  const amountFormatter = useMemo(
    () => new Intl.NumberFormat(locale, { style: 'currency', currency, maximumFractionDigits: 0 }),
    [locale, currency],
  );
  const shareFormatter = useMemo(
    () => new Intl.NumberFormat(locale, { style: 'percent', minimumFractionDigits: 1, maximumFractionDigits: 1 }),
    [locale],
  );
  const monthLabelFormatter = useMemo(
    () => new Intl.DateTimeFormat(locale, { month: 'short' }),
    [locale],
  );
  const monthYearFormatter = useMemo(
    () => new Intl.DateTimeFormat(locale, { month: 'short', year: 'numeric' }),
    [locale],
  );

  const monthsInRange = useMemo(() => MOCK_MONTHS.slice(-period), [period]);

  const chartData = useMemo(
    () =>
      monthsInRange.map((entry) => ({
        key: entry.key,
        total: monthTotal(entry),
        label: monthLabelFormatter.format(monthKeyToDate(entry.key)),
        fullLabel: monthYearFormatter.format(monthKeyToDate(entry.key)),
      })),
    [monthsInRange, monthLabelFormatter, monthYearFormatter],
  );

  const maxMonthTotal = useMemo(
    () => Math.max(1, ...chartData.map((m) => m.total)),
    [chartData],
  );

  const totalSpend = useMemo(
    () => chartData.reduce((sum, m) => sum + m.total, 0),
    [chartData],
  );

  const topCategories = useMemo(() => {
    const totalsByCategory = CATEGORY_META.map((meta) => ({
      ...meta,
      amount: monthsInRange.reduce((sum, entry) => sum + entry.amounts[meta.id], 0),
    }));
    return totalsByCategory
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5)
      .map((c) => ({ ...c, share: totalSpend > 0 ? c.amount / totalSpend : 0 }));
  }, [monthsInRange, totalSpend]);

  const rangeLabel =
    chartData.length > 0
      ? `${chartData[0].fullLabel} – ${chartData[chartData.length - 1].fullLabel}`
      : '';

  return (
    <div className={styles.screen} ref={rootRef}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Spending summary</h1>
          <p className={styles.subtitle}>{rangeLabel}</p>
        </div>
        <div className={styles.periodGroup} role="group" aria-label="Time range">
          {PERIOD_OPTIONS.map((option) => (
            <button
              key={option}
              type="button"
              className={styles.periodButton}
              data-active={period === option || undefined}
              aria-pressed={period === option}
              onClick={() => setPeriod(option)}
            >
              {option}M
            </button>
          ))}
        </div>
      </header>

      <section className={styles.panel} aria-label="Monthly spending chart">
        <div className={styles.totalRow}>
          <span className={styles.totalLabel}>Total spent</span>
          <span className={styles.totalAmount}>{amountFormatter.format(totalSpend)}</span>
        </div>

        <div className={styles.chartScroll}>
          <div className={styles.chart} aria-hidden="true">
            {chartData.map((month) => (
              <div className={styles.barColumn} key={month.key}>
                <div className={styles.barTrack}>
                  <div
                    className={styles.bar}
                    style={{ blockSize: `${(month.total / maxMonthTotal) * 100}%` }}
                    title={`${month.fullLabel}: ${amountFormatter.format(month.total)}`}
                  />
                </div>
                <span className={styles.barLabel}>{month.label}</span>
              </div>
            ))}
          </div>
        </div>

        <p className={styles.srOnly}>
          Monthly spending:{' '}
          {chartData.map((m) => `${m.fullLabel}: ${amountFormatter.format(m.total)}`).join(', ')}
        </p>
      </section>

      <section className={styles.panel} aria-label="Top spending categories">
        <h2 className={styles.sectionTitle}>Top categories</h2>
        <ul className={styles.categoryList}>
          {topCategories.map((category, index) => (
            <li className={styles.categoryRow} key={category.id}>
              <span className={styles.categoryRank}>{index + 1}</span>
              <span
                className={styles.categorySwatch}
                style={{ backgroundColor: category.color }}
                aria-hidden="true"
              />
              <span className={styles.categoryName}>{category.name}</span>
              <span className={styles.categoryBarTrack}>
                <span
                  className={styles.categoryBarFill}
                  style={{ inlineSize: `${category.share * 100}%`, backgroundColor: category.color }}
                />
              </span>
              <span className={styles.categoryAmount}>{amountFormatter.format(category.amount)}</span>
              <span className={styles.categoryShare}>{shareFormatter.format(category.share)}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

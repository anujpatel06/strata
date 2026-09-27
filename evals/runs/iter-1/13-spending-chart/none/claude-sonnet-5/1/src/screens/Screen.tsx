import { useState } from 'react';
import styles from './Screen.module.css';

type CategoryId =
  | 'housing'
  | 'groceries'
  | 'dining'
  | 'transport'
  | 'utilities'
  | 'shopping'
  | 'entertainment'
  | 'health'
  | 'travel'
  | 'subscriptions';

const CATEGORY_NAMES: Record<CategoryId, string> = {
  housing: 'Housing',
  groceries: 'Groceries',
  dining: 'Dining out',
  transport: 'Transport',
  utilities: 'Utilities',
  shopping: 'Shopping',
  entertainment: 'Entertainment',
  health: 'Health & fitness',
  travel: 'Travel',
  subscriptions: 'Subscriptions',
};

type MonthData = {
  label: string;
  values: Record<CategoryId, number>;
};

// Mock data: twelve months of spending by category, oldest to newest.
const MONTHS: MonthData[] = [
  { label: "Oct '25", values: { housing: 32000, subscriptions: 1450, groceries: 13200, dining: 6800, transport: 4200, utilities: 4200, shopping: 8600, entertainment: 2600, health: 3200, travel: 4200 } },
  { label: "Nov '25", values: { housing: 32000, subscriptions: 1450, groceries: 12800, dining: 7200, transport: 4500, utilities: 3900, shopping: 19800, entertainment: 3400, health: 3400, travel: 0 } },
  { label: "Dec '25", values: { housing: 32000, subscriptions: 1600, groceries: 15400, dining: 9800, transport: 5100, utilities: 4600, shopping: 12400, entertainment: 4200, health: 3600, travel: 26800 } },
  { label: "Jan '26", values: { housing: 32000, subscriptions: 1450, groceries: 13100, dining: 6200, transport: 4300, utilities: 5200, shopping: 9200, entertainment: 2200, health: 4800, travel: 0 } },
  { label: "Feb '26", values: { housing: 32000, subscriptions: 1450, groceries: 12600, dining: 5800, transport: 4100, utilities: 6100, shopping: 7800, entertainment: 2100, health: 4200, travel: 0 } },
  { label: "Mar '26", values: { housing: 32000, subscriptions: 1450, groceries: 13900, dining: 7100, transport: 4600, utilities: 7400, shopping: 8900, entertainment: 2900, health: 3900, travel: 15600 } },
  { label: "Apr '26", values: { housing: 32000, subscriptions: 1600, groceries: 14200, dining: 7600, transport: 4800, utilities: 8600, shopping: 9600, entertainment: 3300, health: 3700, travel: 8200 } },
  { label: "May '26", values: { housing: 32000, subscriptions: 1450, groceries: 13700, dining: 8200, transport: 5200, utilities: 8900, shopping: 10800, entertainment: 3600, health: 3500, travel: 0 } },
  { label: "Jun '26", values: { housing: 32000, subscriptions: 1450, groceries: 14600, dining: 7400, transport: 4700, utilities: 8100, shopping: 9100, entertainment: 3100, health: 3300, travel: 0 } },
  { label: "Jul '26", values: { housing: 32000, subscriptions: 1450, groceries: 15100, dining: 8900, transport: 5000, utilities: 6700, shopping: 8700, entertainment: 3500, health: 3600, travel: 3200 } },
  { label: "Aug '26", values: { housing: 32000, subscriptions: 1450, groceries: 14300, dining: 8100, transport: 4900, utilities: 5200, shopping: 9900, entertainment: 3200, health: 3800, travel: 0 } },
  { label: "Sep '26", values: { housing: 32000, subscriptions: 1600, groceries: 14800, dining: 7700, transport: 5300, utilities: 4400, shopping: 10200, entertainment: 2900, health: 3900, travel: 6800 } },
];

const RANGE_OPTIONS = [3, 6, 12] as const;
type RangeOption = (typeof RANGE_OPTIONS)[number];

const SHARE_COLORS = ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#0ea5e9'];

function monthTotal(month: MonthData): number {
  return (Object.values(month.values) as number[]).reduce((sum, value) => sum + value, 0);
}

function formatCurrency(amount: number): string {
  const locale = typeof document !== 'undefined' ? document.documentElement.lang : undefined;
  return new Intl.NumberFormat(locale || 'en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatPercent(share: number): string {
  return `${(share * 100).toFixed(1)}%`;
}

export default function Screen() {
  const [range, setRange] = useState<RangeOption>(6);

  const months = MONTHS.slice(-range);
  const monthlyTotals = months.map((month) => ({ label: month.label, total: monthTotal(month) }));
  const maxMonthlyTotal = Math.max(...monthlyTotals.map((m) => m.total), 1);
  const grandTotal = monthlyTotals.reduce((sum, m) => sum + m.total, 0);

  const categoryTotals = (Object.keys(CATEGORY_NAMES) as CategoryId[])
    .map((id) => ({
      id,
      name: CATEGORY_NAMES[id],
      amount: months.reduce((sum, month) => sum + month.values[id], 0),
    }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);

  return (
    <div className={styles.screen}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Spending summary</h1>
          <p className={styles.subtitle}>Last {range} months</p>
        </div>
        <div className={styles.rangeGroup} role="group" aria-label="Select time range">
          {RANGE_OPTIONS.map((option) => (
            <button
              key={option}
              type="button"
              className={styles.rangeButton}
              aria-pressed={range === option}
              onClick={() => setRange(option)}
            >
              {option}m
            </button>
          ))}
        </div>
      </header>

      <div className={styles.summaryRow}>
        <span className={styles.totalLabel}>Total spent</span>
        <span className={styles.totalValue}>{formatCurrency(grandTotal)}</span>
      </div>

      <section className={styles.chartSection}>
        <h2 className={styles.sectionTitle}>Monthly spending</h2>
        <div className={styles.chart} aria-hidden="true">
          {monthlyTotals.map((month) => (
            <div key={month.label} className={styles.chartBarWrapper} title={`${month.label}: ${formatCurrency(month.total)}`}>
              <div
                className={styles.chartBar}
                style={{ blockSize: `${Math.max((month.total / maxMonthlyTotal) * 100, 4)}%` }}
              />
              <span className={styles.chartBarLabel}>{month.label}</span>
            </div>
          ))}
        </div>
        <table className={styles.srOnly}>
          <caption>Monthly spending for the last {range} months</caption>
          <thead>
            <tr>
              <th scope="col">Month</th>
              <th scope="col">Amount</th>
            </tr>
          </thead>
          <tbody>
            {monthlyTotals.map((month) => (
              <tr key={month.label}>
                <th scope="row">{month.label}</th>
                <td>{formatCurrency(month.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className={styles.categoriesSection}>
        <h2 className={styles.sectionTitle}>Top categories</h2>
        <ol className={styles.categoryList}>
          {categoryTotals.map((category, index) => {
            const share = grandTotal > 0 ? category.amount / grandTotal : 0;
            const color = SHARE_COLORS[index % SHARE_COLORS.length];
            return (
              <li key={category.id} className={styles.categoryItem}>
                <span className={styles.categoryRank}>{index + 1}</span>
                <div className={styles.categoryInfo}>
                  <div className={styles.categoryHeadingRow}>
                    <span className={styles.categoryName}>{category.name}</span>
                    <span className={styles.categoryAmount}>{formatCurrency(category.amount)}</span>
                  </div>
                  <div className={styles.categoryBarTrack}>
                    <div
                      className={styles.categoryBarFill}
                      style={{ inlineSize: formatPercent(share), backgroundColor: color }}
                    />
                  </div>
                  <span className={styles.categoryShare}>{formatPercent(share)} of total</span>
                </div>
              </li>
            );
          })}
        </ol>
      </section>
    </div>
  );
}

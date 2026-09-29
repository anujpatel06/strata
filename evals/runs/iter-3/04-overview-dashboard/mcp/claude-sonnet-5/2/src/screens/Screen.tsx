import { useId, useMemo, type JSX } from 'react';
import { useLocale } from 'react-aria-components';
import { Alert, Button, Card, CardContent, CardHeader, CardTitle, IconTile, StatTile, StatTileGroup } from '@syntara/react';
import type { IconTileTint } from '@syntara/react';
import { IconArrowDownLeft, IconArrowUpRight, IconRefresh, IconShoppingBag, IconUserPlus, type Icon } from '@syntara/icons';
import styles from './Screen.module.css';

/* ------------------------------------------------------------------ *
 * Mock data — no backend
 * ------------------------------------------------------------------ */

interface HeadlineStat {
  id: string;
  label: string;
  kind: 'currency' | 'points' | 'percent';
  value: number;
  delta: number;
  deltaLabel: string;
  positiveIsGood?: boolean;
}

const stats: HeadlineStat[] = [
  { id: 'balance', label: 'Total balance', kind: 'currency', value: 24850, delta: 0.042, deltaLabel: 'vs last month' },
  {
    id: 'spending',
    label: 'Monthly spending',
    kind: 'currency',
    value: 3180,
    delta: 0.086,
    deltaLabel: 'vs last month',
    positiveIsGood: false,
  },
  { id: 'rewards', label: 'Rewards points', kind: 'points', value: 12450, delta: -0.021, deltaLabel: 'vs last month' },
  {
    id: 'utilization',
    label: 'Credit utilization',
    kind: 'percent',
    value: 0.32,
    delta: -0.05,
    deltaLabel: 'vs last month',
    positiveIsGood: false,
  },
];

const cardBanner = {
  lastFour: '4821',
  expires: 'October 2026',
};

interface Activity {
  id: string;
  title: string;
  category: string;
  date: string;
  amount: number;
  icon: Icon;
  tint: IconTileTint;
}

const activities: Activity[] = [
  { id: 'a1', title: 'Whole Foods Market', category: 'Groceries', date: '2026-09-27', amount: -86.42, icon: IconShoppingBag, tint: 'none' },
  { id: 'a2', title: 'Salary deposit', category: 'Income', date: '2026-09-25', amount: 4200, icon: IconArrowDownLeft, tint: 'success' },
  { id: 'a3', title: 'Streaming subscription', category: 'Subscriptions', date: '2026-09-24', amount: -15.99, icon: IconRefresh, tint: 'none' },
  { id: 'a4', title: 'Transfer to savings', category: 'Transfers', date: '2026-09-22', amount: -500, icon: IconArrowUpRight, tint: 'none' },
  { id: 'a5', title: 'Referral bonus', category: 'Rewards', date: '2026-09-20', amount: 25, icon: IconUserPlus, tint: 'success' },
];

/* ------------------------------------------------------------------ *
 * Formatting — Intl in the page's locale, never by hand
 * ------------------------------------------------------------------ */

const MINUS = '−'; // U+2212: reads as a number sign, same bidi class as "-".

function useFormat() {
  const { locale } = useLocale();
  return useMemo(() => {
    const currency = new Intl.NumberFormat(locale, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
    const signedCurrency = new Intl.NumberFormat(locale, { style: 'currency', currency: 'USD', signDisplay: 'exceptZero' });
    const number = new Intl.NumberFormat(locale, { maximumFractionDigits: 0 });
    const percent = new Intl.NumberFormat(locale, { style: 'percent', maximumFractionDigits: 0 });
    const day = new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short', timeZone: 'UTC' });
    const withMinus = (nf: Intl.NumberFormat, v: number) =>
      nf
        .formatToParts(v)
        .map((p) => (p.type === 'minusSign' ? p.value.replace('-', MINUS) : p.value))
        .join('');
    return {
      stat: (s: HeadlineStat) =>
        s.kind === 'currency'
          ? withMinus(currency, s.value)
          : s.kind === 'percent'
            ? percent.format(s.value)
            : `${withMinus(number, s.value)} pts`,
      amount: (v: number) => withMinus(signedCurrency, v),
      date: (iso: string) => day.format(new Date(`${iso}T00:00:00Z`)),
    };
  }, [locale]);
}

/* ------------------------------------------------------------------ *
 * Screen
 * ------------------------------------------------------------------ */

export default function Screen(): JSX.Element {
  const uid = useId();
  const fmt = useFormat();

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <h1 className={styles.title}>Account overview</h1>
        <p className={styles.subtitle}>Your balance, spending and recent activity at a glance.</p>
      </div>

      <StatTileGroup className={styles.stats}>
        {stats.map((stat) => (
          <StatTile
            key={stat.id}
            label={stat.label}
            value={fmt.stat(stat)}
            delta={stat.delta}
            deltaLabel={stat.deltaLabel}
            positiveIsGood={stat.positiveIsGood ?? true}
          />
        ))}
      </StatTileGroup>

      <Alert
        tone="warning"
        title="Card expiring next month"
        action={
          <Button variant="contrast" size="sm">
            Order replacement
          </Button>
        }
      >
        Your card ending {cardBanner.lastFour} expires in {cardBanner.expires}. Order a replacement to avoid a break in
        service.
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle level={2} id={`${uid}-activity`}>
            Recent activity
          </CardTitle>
        </CardHeader>
        <CardContent variant="inset">
          <ul className={styles.activityList} aria-labelledby={`${uid}-activity`}>
            {activities.map((activity) => {
              const Icon = activity.icon;
              return (
                <li key={activity.id} className={styles.activityRow}>
                  <IconTile tint={activity.tint}>
                    <Icon />
                  </IconTile>
                  <span className={styles.activityText}>
                    <span className={styles.activityTitle}>{activity.title}</span>
                    <span className={styles.activityMeta}>
                      {fmt.date(activity.date)} · {activity.category}
                    </span>
                  </span>
                  <span className={activity.amount > 0 ? `${styles.amount} ${styles.amountIn}` : styles.amount}>
                    {fmt.amount(activity.amount)}
                  </span>
                </li>
              );
            })}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

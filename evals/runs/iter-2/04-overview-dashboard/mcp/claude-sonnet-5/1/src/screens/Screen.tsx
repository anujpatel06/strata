import {
  Alert,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  IconTile,
  StatTile,
  StatTileGroup,
} from '@strata/react';
import { IconArrowDownLeft, IconArrowUpRight } from '@strata/icons';
import styles from './Screen.module.css';

interface HeadlineStat {
  label: string;
  value: string;
  delta: number;
  positiveIsGood: boolean;
}

const stats: HeadlineStat[] = [
  { label: 'Total balance', value: '$18,420.50', delta: 0.042, positiveIsGood: true },
  { label: 'Rewards points', value: '12,480', delta: 0.081, positiveIsGood: true },
  { label: 'Monthly spending', value: '$2,340.00', delta: -0.063, positiveIsGood: false },
  { label: 'Open disputes', value: '2', delta: -0.25, positiveIsGood: false },
];

interface Activity {
  id: string;
  title: string;
  category: string;
  date: string;
  amount: number;
}

const activities: Activity[] = [
  { id: 'a1', title: 'Grocery Mart', category: 'Groceries', date: '2026-09-26', amount: -84.2 },
  { id: 'a2', title: 'Payroll deposit', category: 'Income', date: '2026-09-25', amount: 3200 },
  { id: 'a3', title: 'Electric Co.', category: 'Utilities', date: '2026-09-24', amount: -142.5 },
  { id: 'a4', title: 'Coffee House', category: 'Dining', date: '2026-09-23', amount: -6.75 },
  { id: 'a5', title: 'Refund · Online Store', category: 'Shopping', date: '2026-09-22', amount: 45 },
];

const currencyFormat = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  signDisplay: 'exceptZero',
});
const dateFormat = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });

const cx = (...classes: Array<string | false | undefined>) => classes.filter(Boolean).join(' ');

export default function Screen() {
  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <h1 className={styles.title}>Account overview</h1>
        <p className={styles.subtitle}>Your balances, activity and account health at a glance.</p>
      </div>

      <StatTileGroup className={styles.stats}>
        {stats.map((stat) => (
          <StatTile
            key={stat.label}
            label={stat.label}
            value={stat.value}
            delta={stat.delta}
            deltaLabel="vs last month"
            positiveIsGood={stat.positiveIsGood}
          />
        ))}
      </StatTileGroup>

      <Alert
        tone="warning"
        title="Card expiring next month"
        action={
          <Button size="sm" variant="contrast">
            Order replacement
          </Button>
        }
      >
        Your card ending 4821 expires on 31 October. Order a replacement now to avoid interruption.
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle level={2}>Recent activity</CardTitle>
        </CardHeader>
        <CardContent variant="inset">
          <ul className={styles.activityList}>
            {activities.map((activity) => {
              const isCredit = activity.amount > 0;
              return (
                <li key={activity.id} className={styles.activityRow}>
                  <IconTile tint={isCredit ? 'success' : 'neutral'}>
                    {isCredit ? <IconArrowDownLeft /> : <IconArrowUpRight />}
                  </IconTile>
                  <div className={styles.activityDesc}>
                    <span className={styles.activityTitle}>{activity.title}</span>
                    <span className={styles.activityMeta}>
                      {activity.category} · {dateFormat.format(new Date(`${activity.date}T00:00:00Z`))}
                    </span>
                  </div>
                  <span className={cx(styles.activityAmount, isCredit && styles.activityAmountIn)}>
                    {currencyFormat.format(activity.amount)}
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

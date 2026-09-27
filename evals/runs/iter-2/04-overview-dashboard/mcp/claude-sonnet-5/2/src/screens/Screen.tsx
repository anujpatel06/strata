import { useId, type ReactNode } from 'react';
import {
  Alert,
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  IconTile,
  StatTile,
  StatTileGroup,
} from '@strata/react';
import {
  IconArrowsExchange,
  IconBolt,
  IconBuildingBank,
  IconRefresh,
  IconShoppingBag,
} from '@strata/icons';
import styles from './Screen.module.css';

const currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
const signedCurrency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', signDisplay: 'exceptZero' });
const percent = new Intl.NumberFormat('en-US', { style: 'percent', maximumFractionDigits: 0 });
const dateFormat = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' });

interface Stat {
  label: string;
  value: string;
  delta: number;
  positiveIsGood: boolean;
}

const stats: Stat[] = [
  { label: 'Total balance', value: currency.format(18240), delta: 0.048, positiveIsGood: true },
  { label: 'Monthly spending', value: currency.format(2340), delta: 0.112, positiveIsGood: false },
  { label: 'Savings rate', value: percent.format(0.18), delta: -0.032, positiveIsGood: true },
  { label: 'Open disputes', value: '2', delta: -0.5, positiveIsGood: false },
];

interface Activity {
  id: string;
  title: string;
  meta: string;
  date: string;
  amount: number;
  status: 'completed' | 'pending';
  icon: ReactNode;
}

const activities: Activity[] = [
  { id: '1', title: 'Salary deposit', meta: 'Acme Corp', date: '2026-09-26', amount: 4200, status: 'completed', icon: <IconBuildingBank /> },
  { id: '2', title: 'Grocery store', meta: 'Fresh Mart', date: '2026-09-25', amount: -86.42, status: 'completed', icon: <IconShoppingBag /> },
  { id: '3', title: 'Electricity bill', meta: 'City Power', date: '2026-09-23', amount: -142.1, status: 'pending', icon: <IconBolt /> },
  { id: '4', title: 'Streaming subscription', meta: 'Streamly', date: '2026-09-21', amount: -14.99, status: 'completed', icon: <IconRefresh /> },
  { id: '5', title: 'Refund', meta: 'Online Store', date: '2026-09-19', amount: 32.5, status: 'completed', icon: <IconArrowsExchange /> },
];

export default function Screen() {
  const uid = useId();
  const activityHeadingId = `${uid}-activity`;

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Account overview</h1>
        <p className={styles.subtitle}>Your balances, spending and recent activity at a glance.</p>
      </header>

      <StatTileGroup>
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

      <Alert tone="warning" title="Card expiring next month" action={<Button size="sm" variant="contrast">Order replacement</Button>}>
        Your Visa card ending 4821 expires on October 31. Order a replacement to avoid interruptions.
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle level={2} id={activityHeadingId}>
            Recent activity
          </CardTitle>
        </CardHeader>
        <CardContent variant="inset">
          <ul className={styles.activityList} aria-labelledby={activityHeadingId}>
            {activities.map((activity) => (
              <li key={activity.id} className={styles.activityRow}>
                <IconTile tint="auto" name={activity.title}>
                  {activity.icon}
                </IconTile>
                <div className={styles.activityInfo}>
                  <span className={styles.activityTitle}>{activity.title}</span>
                  <span className={styles.activityMeta}>
                    {dateFormat.format(new Date(`${activity.date}T00:00:00Z`))} · {activity.meta}
                  </span>
                </div>
                <Badge variant="status" tone={activity.status === 'completed' ? 'success' : 'info'} size="sm">
                  {activity.status === 'completed' ? 'Completed' : 'Pending'}
                </Badge>
                <span className={styles.activityAmount}>{signedCurrency.format(activity.amount)}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

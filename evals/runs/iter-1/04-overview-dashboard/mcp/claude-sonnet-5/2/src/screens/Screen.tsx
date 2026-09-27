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
import {
  IconArrowDownLeft,
  IconBuildingBank,
  IconCreditCard,
  IconFileText,
  IconWallet,
} from '@strata/icons';
import type { ReactNode } from 'react';
import styles from './Screen.module.css';

interface Stat {
  label: string;
  value: string;
  delta: number;
  positiveIsGood?: boolean;
}

const stats: Stat[] = [
  { label: 'Total balance', value: '₹2,14,500', delta: 0.048 },
  { label: 'Monthly spending', value: '₹32,180', delta: -0.062, positiveIsGood: false },
  { label: 'Savings rate', value: '24%', delta: 0.015 },
  { label: 'Open support tickets', value: '3', delta: -0.4, positiveIsGood: false },
];

interface Activity {
  id: string;
  title: string;
  meta: string;
  date: string;
  amount: string;
  incoming: boolean;
  icon: ReactNode;
}

const activities: Activity[] = [
  {
    id: 'a1',
    title: 'Salary deposit',
    meta: 'Direct credit',
    date: '25 Sep 2026',
    amount: '+₹85,000.00',
    incoming: true,
    icon: <IconBuildingBank aria-hidden />,
  },
  {
    id: 'a2',
    title: 'Grocery store',
    meta: 'Card ending 4821',
    date: '24 Sep 2026',
    amount: '−₹2,340.50',
    incoming: false,
    icon: <IconCreditCard aria-hidden />,
  },
  {
    id: 'a3',
    title: 'Electricity bill',
    meta: 'Autopay',
    date: '22 Sep 2026',
    amount: '−₹1,860.00',
    incoming: false,
    icon: <IconFileText aria-hidden />,
  },
  {
    id: 'a4',
    title: 'Transfer to savings',
    meta: 'Scheduled transfer',
    date: '20 Sep 2026',
    amount: '−₹10,000.00',
    incoming: false,
    icon: <IconWallet aria-hidden />,
  },
  {
    id: 'a5',
    title: 'Refund · Online store',
    meta: 'Returned item',
    date: '18 Sep 2026',
    amount: '+₹1,299.00',
    incoming: true,
    icon: <IconArrowDownLeft aria-hidden />,
  },
];

export default function Screen() {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Account overview</h1>
        <p className={styles.subtitle}>A summary of your account activity this month.</p>
      </header>

      <StatTileGroup className={styles.stats}>
        {stats.map((stat) => (
          <StatTile
            key={stat.label}
            label={stat.label}
            value={stat.value}
            delta={stat.delta}
            deltaLabel="vs last month"
            positiveIsGood={stat.positiveIsGood ?? true}
          />
        ))}
      </StatTileGroup>

      <Alert
        tone="warning"
        title="Card expiring next month"
        action={
          <Button variant="outline" size="sm">
            Order replacement
          </Button>
        }
      >
        Your card ending 4821 expires on 31 October 2026. Order a replacement to avoid interruption.
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle level={2}>Recent activity</CardTitle>
        </CardHeader>
        <CardContent variant="inset">
          <ul className={styles.activityList}>
            {activities.map((activity) => (
              <li key={activity.id} className={styles.activityItem}>
                <IconTile tint="auto" name={activity.title}>
                  {activity.icon}
                </IconTile>
                <div className={styles.activityText}>
                  <span className={styles.activityTitle}>{activity.title}</span>
                  <span className={styles.activityMeta}>
                    {activity.date} · {activity.meta}
                  </span>
                </div>
                <span className={activity.incoming ? styles.amountIn : styles.amount}>
                  {activity.amount}
                </span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

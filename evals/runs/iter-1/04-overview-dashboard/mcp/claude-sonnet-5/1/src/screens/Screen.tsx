import {
  Alert,
  Amount,
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
  IconBuildingBank,
  IconMovie,
  IconReceiptRefund,
  IconShoppingBag,
  IconWallet,
} from '@strata/icons';
import type { ReactNode } from 'react';
import styles from './Screen.module.css';

interface Stat {
  id: string;
  label: string;
  value: string;
  delta: number;
  positiveIsGood: boolean;
  sparkline: number[];
}

const stats: Stat[] = [
  {
    id: 'balance',
    label: 'Account balance',
    value: '$18,420.50',
    delta: 0.042,
    positiveIsGood: true,
    sparkline: [16800, 17100, 16950, 17400, 17650, 17900, 18100, 18000, 18300, 18420],
  },
  {
    id: 'spending',
    label: 'Spent this month',
    value: '$3,214.80',
    delta: 0.081,
    positiveIsGood: false,
    sparkline: [2400, 2550, 2700, 2650, 2800, 2950, 3000, 3100, 3180, 3214],
  },
  {
    id: 'rewards',
    label: 'Reward points',
    value: '8,240 pts',
    delta: -0.035,
    positiveIsGood: true,
    sparkline: [8800, 8700, 8650, 8600, 8550, 8480, 8420, 8380, 8300, 8240],
  },
  {
    id: 'tickets',
    label: 'Open support tickets',
    value: '2',
    delta: -0.5,
    positiveIsGood: false,
    sparkline: [5, 5, 4, 4, 4, 3, 3, 2, 2, 2],
  },
];

interface Activity {
  id: string;
  title: string;
  meta: string;
  amount: number;
  icon: ReactNode;
}

const activities: Activity[] = [
  { id: 'a1', title: 'Salary deposit', meta: 'Today · Income', amount: 4250, icon: <IconBuildingBank /> },
  { id: 'a2', title: 'Whole Foods Market', meta: 'Yesterday · Groceries', amount: -86.42, icon: <IconShoppingBag /> },
  { id: 'a3', title: 'Refund: online return', meta: '2 days ago · Shopping', amount: 34.99, icon: <IconReceiptRefund /> },
  { id: 'a4', title: 'Streaming subscription', meta: '3 days ago · Entertainment', amount: -15.99, icon: <IconMovie /> },
  { id: 'a5', title: 'Transfer to savings', meta: '4 days ago · Transfer', amount: -500, icon: <IconWallet /> },
];

export default function Screen() {
  return (
    <div className={styles.root}>
      <header className={styles.header}>
        <h1 className={styles.title}>Account overview</h1>
        <p className={styles.subtitle}>Your balances, spending and recent activity.</p>
      </header>

      <StatTileGroup>
        {stats.map((stat) => (
          <StatTile
            key={stat.id}
            label={stat.label}
            value={stat.value}
            delta={stat.delta}
            deltaLabel="vs last month"
            positiveIsGood={stat.positiveIsGood}
            sparkline={stat.sparkline}
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
        Your card ending 4821 expires on 31 October 2026.
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
                  <span className={styles.activityMeta}>{activity.meta}</span>
                </div>
                <Amount
                  value={activity.amount}
                  currency="USD"
                  size="sm"
                  tone={activity.amount > 0 ? 'success' : 'neutral'}
                  formatOptions={{ signDisplay: 'exceptZero' }}
                />
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

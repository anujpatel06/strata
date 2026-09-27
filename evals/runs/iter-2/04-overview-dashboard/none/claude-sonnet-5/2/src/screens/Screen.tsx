import {
  Alert,
  Amount,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Eyebrow,
  IconTile,
  StatTile,
  StatTileGroup,
} from '@strata/react';
import {
  IconArrowsExchange,
  IconBuildingStore,
  IconCreditCard,
  IconReceiptRefund,
  IconShoppingBag,
  IconWallet,
} from '@strata/icons';
import type { ReactNode } from 'react';
import styles from './Screen.module.css';

const headlineStats: Array<{
  label: string;
  value: ReactNode;
  delta: number;
  deltaLabel: string;
  positiveIsGood: boolean;
}> = [
  {
    label: 'Total balance',
    value: <Amount value={412_680} currency="INR" size="lg" />,
    delta: 0.042,
    deltaLabel: 'vs last month',
    positiveIsGood: true,
  },
  {
    label: 'Income this month',
    value: <Amount value={96_000} currency="INR" size="lg" />,
    delta: 0.028,
    deltaLabel: 'vs last month',
    positiveIsGood: true,
  },
  {
    label: 'Spending this month',
    value: <Amount value={58_240} currency="INR" size="lg" />,
    delta: -0.065,
    deltaLabel: 'vs last month',
    positiveIsGood: false,
  },
  {
    label: 'Savings rate',
    value: '39%',
    delta: -0.031,
    deltaLabel: 'vs last month',
    positiveIsGood: true,
  },
];

const card = {
  last4: '4821',
  expiresOn: 'October 2026',
};

type Activity = {
  id: string;
  title: string;
  merchant: string;
  date: string;
  amount: number;
  direction: 'in' | 'out';
  icon: 'shopping' | 'transfer' | 'refund' | 'store' | 'wallet';
};

const recentActivities: Activity[] = [
  { id: 'a1', title: 'Grocery run', merchant: 'Fresh Mart', date: 'Today, 9:40 am', amount: 3240, direction: 'out', icon: 'shopping' },
  { id: 'a2', title: 'Transfer to Priya Raman', merchant: 'Bank transfer', date: 'Yesterday, 6:15 pm', amount: 12000, direction: 'out', icon: 'transfer' },
  { id: 'a3', title: 'Refund from Skyline Airways', merchant: 'Flight cancellation', date: '25 Sep, 11:05 am', amount: 8450, direction: 'in', icon: 'refund' },
  { id: 'a4', title: 'Coffee & pastries', merchant: 'Blue Bean Cafe', date: '24 Sep, 8:20 am', amount: 480, direction: 'out', icon: 'store' },
  { id: 'a5', title: 'Salary deposit', merchant: 'Acme Corp', date: '22 Sep, 12:00 am', amount: 96000, direction: 'in', icon: 'wallet' },
];

const activityIcons = {
  shopping: IconShoppingBag,
  transfer: IconArrowsExchange,
  refund: IconReceiptRefund,
  store: IconBuildingStore,
  wallet: IconWallet,
} as const;

export default function Screen() {
  return (
    <div className={styles.screen}>
      <header className={styles.header}>
        <Eyebrow>Wallet · September 2026</Eyebrow>
        <h1 className={styles.title}>Account overview</h1>
      </header>

      <StatTileGroup className={styles.stats}>
        {headlineStats.map((stat) => (
          <StatTile
            key={stat.label}
            size="lg"
            label={stat.label}
            value={stat.value}
            delta={stat.delta}
            deltaLabel={stat.deltaLabel}
            positiveIsGood={stat.positiveIsGood}
          />
        ))}
      </StatTileGroup>

      <Alert
        tone="warning"
        title={`Card ending ${card.last4} expires next month`}
        icon={<IconCreditCard />}
        action={
          <Button size="sm" variant="contrast">
            Update card
          </Button>
        }
      >
        It expires in {card.expiresOn}. Update your details so payments and subscriptions keep working.
      </Alert>

      <Card variant="outline">
        <CardHeader>
          <CardTitle level={2}>Recent activity</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className={styles.activityList}>
            {recentActivities.map((activity) => {
              const ActivityIcon = activityIcons[activity.icon];
              return (
                <li key={activity.id} className={styles.activityRow}>
                  <IconTile size="md" tint={activity.direction === 'in' ? 'success' : 'none'}>
                    <ActivityIcon />
                  </IconTile>
                  <div className={styles.activityDetails}>
                    <span className={styles.activityTitle}>{activity.title}</span>
                    <span className={styles.activityMeta}>
                      {activity.merchant} · {activity.date}
                    </span>
                  </div>
                  <Amount
                    className={styles.activityAmount}
                    value={activity.amount}
                    currency="INR"
                    size="sm"
                    tone={activity.direction === 'in' ? 'success' : 'neutral'}
                    formatOptions={activity.direction === 'in' ? { signDisplay: 'always' } : undefined}
                  />
                </li>
              );
            })}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

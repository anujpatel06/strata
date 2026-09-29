import {
  Alert,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  IconTile,
  StatTile,
  StatTileGroup,
} from '@syntara/react';
import {
  IconBuildingBank,
  IconCreditCard,
  IconFileInvoice,
  IconReceiptRefund,
  IconShoppingBag,
  IconWallet,
} from '@syntara/icons';
import styles from './Screen.module.css';

const LOCALE = 'en-IN';
const CURRENCY = 'INR';

const currencyFormatter = new Intl.NumberFormat(LOCALE, {
  style: 'currency',
  currency: CURRENCY,
  maximumFractionDigits: 0,
});
const signedCurrencyFormatter = new Intl.NumberFormat(LOCALE, {
  style: 'currency',
  currency: CURRENCY,
  maximumFractionDigits: 0,
  signDisplay: 'exceptZero',
});
const dateFormatter = new Intl.DateTimeFormat(LOCALE, { day: 'numeric', month: 'short' });

interface HeadlineStat {
  label: string;
  value: string;
  delta: number;
  deltaLabel: string;
  positiveIsGood: boolean;
}

const stats: HeadlineStat[] = [
  {
    label: 'Account balance',
    value: currencyFormatter.format(184250),
    delta: 0.064,
    deltaLabel: 'vs last month',
    positiveIsGood: true,
  },
  {
    label: 'Savings goal',
    value: '68%',
    delta: 0.05,
    deltaLabel: 'vs last month',
    positiveIsGood: true,
  },
  {
    label: 'Monthly spending',
    value: currencyFormatter.format(42180),
    delta: -0.082,
    deltaLabel: 'vs last month',
    positiveIsGood: false,
  },
  {
    label: 'Open disputes',
    value: '3',
    delta: -0.25,
    deltaLabel: 'vs last month',
    positiveIsGood: false,
  },
];

interface Activity {
  id: string;
  title: string;
  category: string;
  date: string;
  amount: number;
  icon: React.ReactNode;
}

const activities: Activity[] = [
  {
    id: 'act-1',
    title: 'Green Valley Grocers',
    category: 'Groceries',
    date: '2026-09-27',
    amount: -1240,
    icon: <IconShoppingBag />,
  },
  {
    id: 'act-2',
    title: 'Salary deposit',
    category: 'Income',
    date: '2026-09-26',
    amount: 85000,
    icon: <IconBuildingBank />,
  },
  {
    id: 'act-3',
    title: 'Electricity bill',
    category: 'Utilities',
    date: '2026-09-25',
    amount: -2150,
    icon: <IconFileInvoice />,
  },
  {
    id: 'act-4',
    title: 'Refund · Flight ticket',
    category: 'Travel',
    date: '2026-09-24',
    amount: 6400,
    icon: <IconReceiptRefund />,
  },
  {
    id: 'act-5',
    title: 'Transfer to savings',
    category: 'Transfer',
    date: '2026-09-22',
    amount: -10000,
    icon: <IconWallet />,
  },
];

export default function Screen() {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Account overview</h1>
        <p className={styles.subtitle}>A snapshot of your account this month.</p>
      </header>

      <StatTileGroup className={styles.stats}>
        {stats.map((stat) => (
          <StatTile
            key={stat.label}
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
        icon={<IconCreditCard aria-hidden />}
        title="Card expiring next month"
        action={
          <Button variant="contrast" size="sm">
            Order replacement
          </Button>
        }
      >
        Your card ending 4821 expires on 31 Oct 2026. Order a replacement now to avoid interruptions.
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle level={2}>Recent activity</CardTitle>
          <CardDescription>Your five most recent transactions.</CardDescription>
        </CardHeader>
        <CardContent variant="inset">
          <ul className={styles.activityList}>
            {activities.map((activity) => (
              <li key={activity.id} className={styles.activityRow}>
                <IconTile tint="auto" name={activity.title}>
                  {activity.icon}
                </IconTile>
                <div className={styles.activityText}>
                  <span className={styles.activityTitle}>{activity.title}</span>
                  <span className={styles.activityMeta}>
                    {dateFormatter.format(new Date(`${activity.date}T00:00:00Z`))} · {activity.category}
                  </span>
                </div>
                <span className={activity.amount > 0 ? `${styles.activityAmount} ${styles.activityAmountIn}` : styles.activityAmount}>
                  {signedCurrencyFormatter.format(activity.amount)}
                </span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

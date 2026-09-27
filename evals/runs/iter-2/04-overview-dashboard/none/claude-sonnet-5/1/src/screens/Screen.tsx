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
  IconArchive,
  IconBuildingStore,
  IconCoins,
  IconCreditCard,
  IconPiggyBank,
  IconReceiptRefund,
  IconShoppingBag,
} from '@strata/icons';
import styles from './Screen.module.css';

const headlineStats = [
  {
    label: 'Total balance',
    value: 412650,
    delta: 0.042,
    positiveIsGood: true,
  },
  {
    label: 'Income this month',
    value: 96200,
    delta: 0.081,
    positiveIsGood: true,
  },
  {
    label: 'Spending this month',
    value: 58340,
    delta: -0.034,
    positiveIsGood: false,
  },
  {
    label: 'Savings rate',
    value: 21,
    unit: '%',
    delta: -0.018,
    positiveIsGood: true,
  },
] as const;

const expiringCard = {
  last4: '4821',
  expiry: 'October 2026',
};

const recentActivities = [
  {
    id: 'act-1',
    title: 'Whole Foods Market',
    category: 'Groceries',
    date: '26 Sep',
    amount: -4820,
    icon: IconShoppingBag,
  },
  {
    id: 'act-2',
    title: 'Salary — Initech Ltd',
    category: 'Income',
    date: '25 Sep',
    amount: 96200,
    icon: IconCoins,
  },
  {
    id: 'act-3',
    title: 'Refund — Zara',
    category: 'Shopping',
    date: '23 Sep',
    amount: 1899,
    icon: IconReceiptRefund,
  },
  {
    id: 'act-4',
    title: 'Blue Bottle Coffee',
    category: 'Dining',
    date: '22 Sep',
    amount: -420,
    icon: IconBuildingStore,
  },
  {
    id: 'act-5',
    title: 'Storage unit — 2BHK Movers',
    category: 'Storage',
    date: '20 Sep',
    amount: -3200,
    icon: IconArchive,
  },
] as const;

export default function Screen() {
  return (
    <div className={styles.screen}>
      <header className={styles.header}>
        <Eyebrow icon={<IconPiggyBank />} tone="brand">
          Account overview
        </Eyebrow>
        <h1 className={styles.title}>Here's where things stand</h1>
      </header>

      <StatTileGroup className={styles.stats}>
        {headlineStats.map((stat) => (
          <StatTile
            key={stat.label}
            size="lg"
            label={stat.label}
            value={
              'unit' in stat ? (
                `${stat.value}${stat.unit}`
              ) : (
                <Amount value={stat.value} currency="INR" size="lg" compact />
              )
            }
            delta={stat.delta}
            deltaLabel="vs last month"
            positiveIsGood={stat.positiveIsGood}
          />
        ))}
      </StatTileGroup>

      <Alert
        className={styles.banner}
        tone="warning"
        icon={<IconCreditCard />}
        title={`Card ending ${expiringCard.last4} expires next month`}
        action={
          <Button size="sm" variant="outline">
            Update card
          </Button>
        }
      >
        This card expires in {expiringCard.expiry}. Update your payment details to avoid interrupted
        payments.
      </Alert>

      <Card className={styles.activityCard}>
        <CardHeader>
          <CardTitle level={2}>Recent activity</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className={styles.activityList}>
            {recentActivities.map((activity) => (
              <li key={activity.id} className={styles.activityRow}>
                <IconTile tint="auto" name={activity.title} alt="">
                  <activity.icon />
                </IconTile>
                <div className={styles.activityDetails}>
                  <span className={styles.activityTitle}>{activity.title}</span>
                  <span className={styles.activityMeta}>
                    {activity.category} · {activity.date}
                  </span>
                </div>
                <Amount
                  className={styles.activityAmount}
                  value={activity.amount}
                  currency="INR"
                  size="sm"
                  tone={activity.amount >= 0 ? 'success' : 'neutral'}
                  formatOptions={{ signDisplay: 'always' }}
                />
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

import styles from './Screen.module.css';

type Metric = {
  id: string;
  label: string;
  value: string;
  changeLabel: string;
  direction: 'up' | 'down';
};

type Activity = {
  id: string;
  description: string;
  date: string;
  amount: string;
  direction: 'up' | 'down';
};

const metrics: Metric[] = [
  {
    id: 'balance',
    label: 'Total balance',
    value: '$48,320.50',
    changeLabel: '4.2% vs last month',
    direction: 'up',
  },
  {
    id: 'spending',
    label: 'Monthly spending',
    value: '$3,845.12',
    changeLabel: '12.6% vs last month',
    direction: 'up',
  },
  {
    id: 'credit',
    label: 'Available credit',
    value: '$9,150.00',
    changeLabel: '3.4% vs last month',
    direction: 'down',
  },
  {
    id: 'savings',
    label: 'Savings goal progress',
    value: '62%',
    changeLabel: '2.1% vs last month',
    direction: 'down',
  },
];

const expiringCard = {
  name: 'Platinum card',
  last4: '4821',
  expiry: 'October 2026',
};

const activities: Activity[] = [
  {
    id: 'a1',
    description: 'Grocery Store',
    date: 'Sep 26, 2026',
    amount: '-$86.42',
    direction: 'down',
  },
  {
    id: 'a2',
    description: 'Salary Deposit',
    date: 'Sep 25, 2026',
    amount: '+$3,200.00',
    direction: 'up',
  },
  {
    id: 'a3',
    description: 'Electric Bill',
    date: 'Sep 23, 2026',
    amount: '-$142.10',
    direction: 'down',
  },
  {
    id: 'a4',
    description: 'Transfer to Savings',
    date: 'Sep 21, 2026',
    amount: '-$500.00',
    direction: 'down',
  },
  {
    id: 'a5',
    description: 'Coffee Shop',
    date: 'Sep 20, 2026',
    amount: '-$5.75',
    direction: 'down',
  },
];

function ChangeIndicator({ direction, changeLabel }: { direction: 'up' | 'down'; changeLabel: string }) {
  return (
    <span
      className={`${styles.change} ${direction === 'up' ? styles.changeUp : styles.changeDown}`}
    >
      <span className={styles.changeArrow} aria-hidden="true">
        {direction === 'up' ? '↑' : '↓'}
      </span>
      {changeLabel}
    </span>
  );
}

export default function Screen() {
  return (
    <div className={styles.screen}>
      <header className={styles.header}>
        <h1 className={styles.title}>Account overview</h1>
        <p className={styles.subtitle}>Here's how your account has been doing.</p>
      </header>

      <ul className={styles.metrics}>
        {metrics.map((metric) => (
          <li key={metric.id} className={styles.metricCard}>
            <p className={styles.metricLabel}>{metric.label}</p>
            <p className={styles.metricValue}>{metric.value}</p>
            <ChangeIndicator direction={metric.direction} changeLabel={metric.changeLabel} />
          </li>
        ))}
      </ul>

      <div className={styles.banner} role="status">
        <div className={styles.bannerIcon} aria-hidden="true">
          !
        </div>
        <p className={styles.bannerText}>
          Your {expiringCard.name} ending in {expiringCard.last4} expires in {expiringCard.expiry}. Renew it to
          avoid interruptions to your payments.
        </p>
      </div>

      <section className={styles.activitySection}>
        <h2 className={styles.sectionTitle}>Recent activity</h2>
        <ul className={styles.activityList}>
          {activities.map((activity) => (
            <li key={activity.id} className={styles.activityItem}>
              <div className={styles.activityDetails}>
                <p className={styles.activityDescription}>{activity.description}</p>
                <p className={styles.activityDate}>{activity.date}</p>
              </div>
              <span
                className={`${styles.activityAmount} ${
                  activity.direction === 'up' ? styles.changeUp : styles.changeDown
                }`}
              >
                {activity.amount}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

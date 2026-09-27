import styles from './Screen.module.css';

type Trend = 'up' | 'down';

interface HeadlineStat {
  id: string;
  label: string;
  value: string;
  change: string;
  trend: Trend;
}

interface Activity {
  id: string;
  title: string;
  detail: string;
  date: string;
  amount: string;
  trend: Trend;
}

const headlineStats: HeadlineStat[] = [
  { id: 'balance', label: 'Total balance', value: '$24,850.12', change: '+4.2% since last month', trend: 'up' },
  { id: 'income', label: 'Income', value: '$6,120.00', change: '+2.8% since last month', trend: 'up' },
  { id: 'spending', label: 'Spending', value: '$3,940.55', change: '-6.1% since last month', trend: 'down' },
  { id: 'savings', label: 'Savings rate', value: '18%', change: '-3 pts since last month', trend: 'down' },
];

const cardExpiry = {
  cardName: 'Platinum card •••• 4821',
  expiresOn: 'October 2026',
};

const recentActivity: Activity[] = [
  { id: '1', title: 'Grocery Mart', detail: 'Groceries', date: 'Today', amount: '-$86.40', trend: 'down' },
  { id: '2', title: 'Payroll deposit', detail: 'Income', date: 'Yesterday', amount: '+$3,200.00', trend: 'up' },
  { id: '3', title: 'Electric Co.', detail: 'Utilities', date: '2 days ago', amount: '-$142.10', trend: 'down' },
  { id: '4', title: 'Coffee House', detail: 'Dining', date: '3 days ago', amount: '-$6.75', trend: 'down' },
  { id: '5', title: 'Transfer to savings', detail: 'Transfer', date: '4 days ago', amount: '-$500.00', trend: 'down' },
];

export default function Screen() {
  return (
    <div className={styles.screen}>
      <header className={styles.header}>
        <h1 className={styles.title}>Account overview</h1>
        <p className={styles.subtitle}>Here's what's happening with your account this month.</p>
      </header>

      <section className={styles.stats} aria-label="Headline numbers">
        {headlineStats.map((stat) => (
          <div key={stat.id} className={styles.statCard}>
            <p className={styles.statLabel}>{stat.label}</p>
            <p className={styles.statValue}>{stat.value}</p>
            <p className={`${styles.statChange} ${stat.trend === 'up' ? styles.up : styles.down}`}>
              <span className={styles.statChangeIcon} aria-hidden="true">
                {stat.trend === 'up' ? '▲' : '▼'}
              </span>
              {stat.change}
            </p>
          </div>
        ))}
      </section>

      <div className={styles.banner} role="status">
        <div className={styles.bannerIcon} aria-hidden="true">
          !
        </div>
        <div className={styles.bannerBody}>
          <p className={styles.bannerTitle}>Your card expires soon</p>
          <p className={styles.bannerText}>
            {cardExpiry.cardName} expires in {cardExpiry.expiresOn}. Update your card details to avoid
            interruptions.
          </p>
        </div>
        <button type="button" className={styles.bannerAction}>
          Update card
        </button>
      </div>

      <section className={styles.activity} aria-label="Recent activity">
        <h2 className={styles.sectionTitle}>Recent activity</h2>
        <ul className={styles.activityList}>
          {recentActivity.map((item) => (
            <li key={item.id} className={styles.activityItem}>
              <div className={styles.activityInfo}>
                <p className={styles.activityTitle}>{item.title}</p>
                <p className={styles.activityDetail}>{item.detail}</p>
              </div>
              <div className={styles.activityMeta}>
                <p className={`${styles.activityAmount} ${item.trend === 'up' ? styles.up : styles.down}`}>
                  {item.amount}
                </p>
                <p className={styles.activityDate}>{item.date}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

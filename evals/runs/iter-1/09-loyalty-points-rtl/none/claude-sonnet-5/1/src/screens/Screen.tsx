import styles from './Screen.module.css';

type PointChange = {
  id: string;
  description: string;
  date: string; // ISO date
  points: number; // positive = earned, negative = spent
};

const account = {
  memberName: 'Anuj Patel',
  balance: 12480,
  currentTier: 'Gold',
  nextTier: 'Platinum',
  pointsToNextTier: 2520,
  tierProgress: 0.62,
};

const recentChanges: PointChange[] = [
  { id: 'c1', description: 'Purchase at Store #482', date: '2026-09-24', points: 340 },
  { id: 'c2', description: 'Redeemed for $10 voucher', date: '2026-09-18', points: -1000 },
  { id: 'c3', description: 'Purchase at Store #201', date: '2026-09-11', points: 180 },
  { id: 'c4', description: 'Redeemed for free shipping', date: '2026-09-02', points: -500 },
  { id: 'c5', description: 'Birthday bonus', date: '2026-08-27', points: 500 },
  { id: 'c6', description: 'Purchase at Store #113', date: '2026-08-15', points: 220 },
];

function formatPoints(value: number): string {
  return new Intl.NumberFormat('en-US').format(value);
}

function formatDate(iso: string): string {
  const date = new Date(`${iso}T00:00:00`);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function handleRedeem() {
  // Mock action: no backend to call in this environment.
  window.alert('Redeem points: choose a reward to continue.');
}

export default function Screen() {
  const progressPercent = Math.round(account.tierProgress * 100);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <p className={styles.eyebrow}>Loyalty Points</p>
        <h1 className={styles.balanceValue}>{formatPoints(account.balance)}</h1>
        <p className={styles.balanceLabel}>points available</p>
      </header>

      <section className={styles.tierCard} aria-labelledby="tier-heading">
        <div className={styles.tierRow}>
          <span className={styles.tierBadge}>{account.currentTier} member</span>
          <span className={styles.tierNext}>Next: {account.nextTier}</span>
        </div>
        <h2 id="tier-heading" className={styles.tierHeading}>
          {formatPoints(account.pointsToNextTier)} points to {account.nextTier}
        </h2>
        <div
          className={styles.progressTrack}
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progressPercent}
          aria-label={`Progress toward ${account.nextTier} tier`}
        >
          <div className={styles.progressFill} style={{ inlineSize: `${progressPercent}%` }} />
        </div>
        <p className={styles.progressCaption}>{progressPercent}% of the way there</p>
      </section>

      <button type="button" className={styles.redeemButton} onClick={handleRedeem}>
        Redeem points
      </button>

      <section className={styles.history} aria-labelledby="history-heading">
        <h2 id="history-heading" className={styles.historyHeading}>
          Recent activity
        </h2>
        <ul className={styles.historyList}>
          {recentChanges.map((change) => {
            const isEarned = change.points > 0;
            return (
              <li key={change.id} className={styles.historyItem}>
                <div className={styles.historyDetails}>
                  <span className={styles.historyDescription}>{change.description}</span>
                  <span className={styles.historyDate}>{formatDate(change.date)}</span>
                </div>
                <span
                  className={isEarned ? styles.pointsEarned : styles.pointsSpent}
                  aria-label={`${isEarned ? 'Earned' : 'Spent'} ${formatPoints(Math.abs(change.points))} points`}
                >
                  {isEarned ? '+' : '−'}
                  {formatPoints(Math.abs(change.points))}
                </span>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}

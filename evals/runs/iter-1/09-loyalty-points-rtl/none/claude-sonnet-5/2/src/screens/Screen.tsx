import { useState } from 'react';
import styles from './Screen.module.css';

type PointChange = {
  id: string;
  description: string;
  date: string;
  amount: number;
  kind: 'earned' | 'spent';
};

type LoyaltyData = {
  memberName: string;
  pointsBalance: number;
  currentTier: string;
  nextTier: string;
  currentTierThreshold: number;
  nextTierThreshold: number;
  recentChanges: PointChange[];
};

const loyaltyData: LoyaltyData = {
  memberName: 'Anuj',
  pointsBalance: 12450,
  currentTier: 'Silver',
  nextTier: 'Gold',
  currentTierThreshold: 5000,
  nextTierThreshold: 15000,
  recentChanges: [
    { id: 'c1', description: 'Purchase reward', date: '2026-09-24', amount: 820, kind: 'earned' },
    { id: 'c2', description: 'Redeemed for discount code', date: '2026-09-20', amount: -1500, kind: 'spent' },
    { id: 'c3', description: 'Referral bonus', date: '2026-09-15', amount: 540, kind: 'earned' },
    { id: 'c4', description: 'Redeemed for gift card', date: '2026-09-09', amount: -600, kind: 'spent' },
    { id: 'c5', description: 'Purchase reward', date: '2026-09-03', amount: 210, kind: 'earned' },
    { id: 'c6', description: 'Birthday bonus', date: '2026-08-28', amount: 150, kind: 'earned' },
  ],
};

const numberFormatter = new Intl.NumberFormat('en-US');
const dateFormatter = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

function formatAmount(amount: number): string {
  const sign = amount >= 0 ? '+' : '−';
  return `${sign}${numberFormatter.format(Math.abs(amount))}`;
}

function formatDate(iso: string): string {
  return dateFormatter.format(new Date(`${iso}T00:00:00`));
}

export default function Screen() {
  const [redeemStatus, setRedeemStatus] = useState<'idle' | 'requested'>('idle');

  const { memberName, pointsBalance, currentTier, nextTier, currentTierThreshold, nextTierThreshold, recentChanges } =
    loyaltyData;

  const pointsIntoTier = pointsBalance - currentTierThreshold;
  const tierSpan = nextTierThreshold - currentTierThreshold;
  const progressPercent = Math.min(100, Math.max(0, (pointsIntoTier / tierSpan) * 100));
  const pointsToNextTier = Math.max(0, nextTierThreshold - pointsBalance);

  return (
    <div className={styles.screen}>
      <header className={styles.header}>
        <p className={styles.eyebrow}>Loyalty points</p>
        <h1 className={styles.balance}>{numberFormatter.format(pointsBalance)} pts</h1>
        <p className={styles.subtext}>{memberName}, here's your current balance</p>
      </header>

      <section className={styles.tierCard} aria-labelledby="tier-heading">
        <div className={styles.tierHeadingRow}>
          <h2 id="tier-heading" className={styles.tierHeading}>
            {currentTier} tier
          </h2>
          <span className={styles.tierNext}>Next: {nextTier}</span>
        </div>
        <div
          className={styles.progressTrack}
          role="progressbar"
          aria-valuenow={Math.round(progressPercent)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Progress toward ${nextTier} tier`}
        >
          <div className={styles.progressFill} style={{ width: `${progressPercent}%` }} />
        </div>
        <p className={styles.tierDetail}>
          {pointsToNextTier > 0
            ? `${numberFormatter.format(pointsToNextTier)} pts to ${nextTier}`
            : `You've reached ${nextTier}`}
        </p>
      </section>

      <div className={styles.actions}>
        <button
          type="button"
          className={styles.redeemButton}
          onClick={() => setRedeemStatus('requested')}
          disabled={redeemStatus === 'requested'}
        >
          Redeem
        </button>
        {redeemStatus === 'requested' && (
          <p className={styles.redeemConfirmation} role="status">
            Redemption request sent. Rewards will appear in your account shortly.
          </p>
        )}
      </div>

      <section aria-labelledby="activity-heading">
        <h2 id="activity-heading" className={styles.activityHeading}>
          Recent activity
        </h2>
        <ul className={styles.activityList}>
          {recentChanges.map((change) => (
            <li key={change.id} className={styles.activityItem}>
              <div className={styles.activityInfo}>
                <span className={styles.activityDescription}>{change.description}</span>
                <span className={styles.activityDate}>{formatDate(change.date)}</span>
              </div>
              <span
                className={
                  change.kind === 'earned'
                    ? `${styles.activityAmount} ${styles.amountEarned}`
                    : `${styles.activityAmount} ${styles.amountSpent}`
                }
              >
                {formatAmount(change.amount)}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Eyebrow,
  IconTile,
  Meter,
} from '@strata/react';
import { IconArrowDownLeft, IconArrowUpRight, IconGift, IconTrophy } from '@strata/icons';
import type { JSX } from 'react';
import styles from './Screen.module.css';

type PointChange = {
  id: string;
  description: string;
  date: string;
  kind: 'earned' | 'redeemed';
  points: number;
};

const member = {
  balance: 3240,
  tier: 'Gold',
  nextTier: 'Platinum',
  nextTierThreshold: 5000,
};

const pointChanges: PointChange[] = [
  { id: 'pc-1', description: 'Coffee Bar purchase', date: '2026-09-24', kind: 'earned', points: 120 },
  { id: 'pc-2', description: 'Free drink reward', date: '2026-09-20', kind: 'redeemed', points: 500 },
  { id: 'pc-3', description: 'Weekly grocery run', date: '2026-09-15', kind: 'earned', points: 75 },
  { id: 'pc-4', description: 'Referral bonus', date: '2026-09-10', kind: 'earned', points: 200 },
  { id: 'pc-5', description: 'Gift card redemption', date: '2026-09-05', kind: 'redeemed', points: 1000 },
  { id: 'pc-6', description: 'Birthday bonus', date: '2026-08-29', kind: 'earned', points: 50 },
];

const numberFormat = new Intl.NumberFormat('en-US');
const dateFormat = new Intl.DateTimeFormat('en-US', { day: 'numeric', month: 'short', year: 'numeric' });

function formatDate(iso: string): string {
  return dateFormat.format(new Date(`${iso}T00:00:00Z`));
}

export default function Screen(): JSX.Element {
  const pointsToNextTier = Math.max(0, member.nextTierThreshold - member.balance);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <Eyebrow>Loyalty</Eyebrow>
          <h1 className={styles.title}>Your points</h1>
          <p className={styles.subtitle}>Track your balance, tier progress and recent activity.</p>
        </div>
        <Button>
          <IconGift aria-hidden />
          Redeem points
        </Button>
      </header>

      <div className={styles.summaryGrid}>
        <Card>
          <CardHeader>
            <CardTitle level={2}>Points balance</CardTitle>
            <CardDescription>Available to redeem</CardDescription>
          </CardHeader>
          <CardContent className={styles.balanceContent}>
            <p className={styles.balance}>
              {numberFormat.format(member.balance)} <span className={styles.balanceUnit}>pts</span>
            </p>
            <div className={styles.tierRow}>
              <IconTile tint="brand" size="sm">
                <IconTrophy aria-hidden />
              </IconTile>
              <Badge tone="brand">{member.tier} tier</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle level={2}>Next tier</CardTitle>
            <CardDescription>{pointsToNextTier > 0 ? `${numberFormat.format(pointsToNextTier)} points to ${member.nextTier}` : `You've reached ${member.nextTier}`}</CardDescription>
          </CardHeader>
          <CardContent>
            <Meter
              variant="card"
              label={`Progress to ${member.nextTier}`}
              value={member.balance}
              maxValue={member.nextTierThreshold}
              valueLabel={`${numberFormat.format(member.balance)} pts`}
              caption={`of ${numberFormat.format(member.nextTierThreshold)} for ${member.nextTier}`}
            />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle level={2}>Recent point changes</CardTitle>
          <CardDescription>Your last six updates</CardDescription>
        </CardHeader>
        <CardContent variant="inset">
          <ul className={styles.list}>
            {pointChanges.map((change) => {
              const earned = change.kind === 'earned';
              return (
                <li key={change.id} className={styles.row}>
                  <IconTile tint={earned ? 'success' : 'neutral'} size="sm">
                    {earned ? <IconArrowUpRight aria-hidden /> : <IconArrowDownLeft aria-hidden />}
                  </IconTile>
                  <div className={styles.rowText}>
                    <span className={styles.rowTitle}>{change.description}</span>
                    <span className={styles.rowMeta}>
                      <time dateTime={change.date}>{formatDate(change.date)}</time>
                      {' · '}
                      {earned ? 'Earned' : 'Redeemed'}
                    </span>
                  </div>
                  <span className={earned ? styles.rowAmountPositive : styles.rowAmountNegative}>
                    {earned ? '+' : '−'}
                    {numberFormat.format(change.points)} pts
                  </span>
                </li>
              );
            })}
          </ul>
        </CardContent>
        <CardFooter>
          <Button variant="outline">View all activity</Button>
        </CardFooter>
      </Card>
    </div>
  );
}

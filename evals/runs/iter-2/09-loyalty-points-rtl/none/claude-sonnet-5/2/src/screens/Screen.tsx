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
import { IconArrowDown, IconArrowUp, IconCoins, IconGift, IconTrophy } from '@strata/icons';
import styles from './Screen.module.css';

type PointChange = {
  id: string;
  description: string;
  date: string;
  type: 'earned' | 'spent';
  points: number;
};

const pointsBalance = 12480;
const nextTierThreshold = 20000;
const nextTierName = 'Platinum';
const currentTierName = 'Gold';
const pointsToNextTier = nextTierThreshold - pointsBalance;

const recentChanges: PointChange[] = [
  {
    id: 'pc-1',
    description: 'Grocery purchase at FreshMart',
    date: '24 Sep 2026',
    type: 'earned',
    points: 540,
  },
  {
    id: 'pc-2',
    description: 'Redeemed for a $25 gift card',
    date: '18 Sep 2026',
    type: 'spent',
    points: 2000,
  },
  {
    id: 'pc-3',
    description: 'Bonus for daily app check-in',
    date: '12 Sep 2026',
    type: 'earned',
    points: 120,
  },
  {
    id: 'pc-4',
    description: 'Flight booking to Dubai',
    date: '5 Sep 2026',
    type: 'earned',
    points: 860,
  },
  {
    id: 'pc-5',
    description: 'Redeemed for a coffee voucher',
    date: '29 Aug 2026',
    type: 'spent',
    points: 350,
  },
  {
    id: 'pc-6',
    description: 'Referral bonus',
    date: '21 Aug 2026',
    type: 'earned',
    points: 75,
  },
];

function formatPoints(value: number) {
  return value.toLocaleString('en-US');
}

export default function Screen() {
  return (
    <div className={styles.screen}>
      <header className={styles.pageHeader}>
        <Eyebrow>Loyalty</Eyebrow>
        <h1 className={styles.pageTitle}>Points &amp; rewards</h1>
      </header>

      <Card className={styles.balanceCard}>
        <CardHeader>
          <div className={styles.balanceHeaderRow}>
            <div>
              <CardTitle level={2}>Your balance</CardTitle>
              <CardDescription>Keep earning to unlock {nextTierName} perks.</CardDescription>
            </div>
            <Badge tone="brand" variant="soft" icon={<IconTrophy />}>
              {currentTierName} tier
            </Badge>
          </div>
        </CardHeader>
        <CardContent className={styles.balanceContent}>
          <div className={styles.balanceRow}>
            <IconTile tint="solid" size="lg" alt="">
              <IconCoins />
            </IconTile>
            <div>
              <p className={styles.balanceValue}>
                {formatPoints(pointsBalance)} <span className={styles.balanceUnit}>pts</span>
              </p>
              <p className={styles.balanceCaption}>Worth up to $310 in rewards</p>
            </div>
          </div>
          <Meter
            label={`Progress to ${nextTierName}`}
            value={pointsBalance}
            maxValue={nextTierThreshold}
            showValue
            valueLabel={`${formatPoints(pointsBalance)} / ${formatPoints(nextTierThreshold)} pts`}
            caption={`${formatPoints(pointsToNextTier)} pts to go`}
            tone="brand"
          />
        </CardContent>
        <CardFooter>
          <Button variant="primary">
            <IconGift />
            Redeem points
          </Button>
        </CardFooter>
      </Card>

      <Card className={styles.historyCard}>
        <CardHeader divider>
          <CardTitle level={2}>Recent activity</CardTitle>
          <CardDescription>Your last 6 point changes</CardDescription>
        </CardHeader>
        <CardContent variant="inset">
          <ul className={styles.list}>
            {recentChanges.map((change) => (
              <li key={change.id} className={styles.listItem}>
                <IconTile size="sm" tint={change.type === 'earned' ? 'success' : 'none'} alt="">
                  {change.type === 'earned' ? <IconArrowUp /> : <IconArrowDown />}
                </IconTile>
                <div className={styles.listItemBody}>
                  <p className={styles.listItemDescription}>{change.description}</p>
                  <p className={styles.listItemDate}>{change.date}</p>
                </div>
                <span
                  className={
                    change.type === 'earned'
                      ? `${styles.amount} ${styles.amountEarned}`
                      : `${styles.amount} ${styles.amountSpent}`
                  }
                >
                  {change.type === 'earned' ? '+' : '−'}
                  {formatPoints(change.points)} pts
                </span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

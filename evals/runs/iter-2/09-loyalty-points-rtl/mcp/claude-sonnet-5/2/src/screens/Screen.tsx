import {
  Badge,
  Button,
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Eyebrow,
  IconTile,
  Meter,
} from '@strata/react';
import { IconArrowDownRight, IconArrowUpRight, IconGift, IconStar } from '@strata/icons';
import styles from './Screen.module.css';

interface PointChange {
  id: string;
  description: string;
  date: string;
  points: number;
  direction: 'earned' | 'spent';
}

const POINTS_BALANCE = 12480;
const CURRENT_TIER = 'Silver';
const NEXT_TIER = 'Gold';
const TIER_FLOOR = 5000;
const TIER_CEILING = 15000;
const POINTS_TO_NEXT_TIER = TIER_CEILING - POINTS_BALANCE;

const RECENT_CHANGES: PointChange[] = [
  { id: 'pc-1', description: 'Order #48213 delivered', date: '24 Sep 2026', points: 320, direction: 'earned' },
  { id: 'pc-2', description: 'Wrote a product review', date: '18 Sep 2026', points: 150, direction: 'earned' },
  { id: 'pc-3', description: 'Redeemed for a ₹500 voucher', date: '12 Sep 2026', points: 1200, direction: 'spent' },
  { id: 'pc-4', description: 'Referral bonus — Priya joined', date: '5 Sep 2026', points: 500, direction: 'earned' },
  { id: 'pc-5', description: 'Redeemed for free shipping', date: '29 Aug 2026', points: 450, direction: 'spent' },
  { id: 'pc-6', description: 'Order #47950 delivered', date: '21 Aug 2026', points: 80, direction: 'earned' },
];

function formatPoints(value: number): string {
  return new Intl.NumberFormat('en-US').format(value);
}

export default function Screen() {
  return (
    <div className={styles.page}>
      <Eyebrow>Loyalty</Eyebrow>
      <h1 className={styles.heading}>Points</h1>

      <Card className={styles.card}>
        <CardHeader>
          <CardTitle level={2}>Your balance</CardTitle>
          <CardDescription>Keep earning to reach {NEXT_TIER}</CardDescription>
          <CardAction>
            <Badge tone="brand" icon={<IconStar aria-hidden />}>
              {CURRENT_TIER}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardContent className={styles.balanceContent}>
          <div className={styles.balanceRow}>
            <span className={styles.balanceValue}>{formatPoints(POINTS_BALANCE)}</span>
            <span className={styles.balanceUnit}>points</span>
          </div>
          <Meter
            variant="card"
            label={`Progress to ${NEXT_TIER}`}
            value={POINTS_BALANCE}
            minValue={TIER_FLOOR}
            maxValue={TIER_CEILING}
            valueLabel={`${formatPoints(POINTS_BALANCE)} points`}
            caption={`${formatPoints(POINTS_TO_NEXT_TIER)} to ${NEXT_TIER}`}
            tone="brand"
          />
        </CardContent>
        <CardFooter divider>
          <Button size="sm">
            <IconGift aria-hidden />
            Redeem points
          </Button>
        </CardFooter>
      </Card>

      <Card className={styles.card}>
        <CardHeader divider>
          <CardTitle level={2}>Recent activity</CardTitle>
          <CardDescription>Your last 6 point changes</CardDescription>
        </CardHeader>
        <CardContent variant="inset">
          <ul className={styles.list}>
            {RECENT_CHANGES.map((change) => (
              <li key={change.id} className={styles.row}>
                <IconTile size="sm" tint={change.direction === 'earned' ? 'success' : 'none'}>
                  {change.direction === 'earned' ? <IconArrowUpRight aria-hidden /> : <IconArrowDownRight aria-hidden />}
                </IconTile>
                <div className={styles.rowText}>
                  <span className={styles.rowTitle}>{change.description}</span>
                  <span className={styles.rowDate}>{change.date}</span>
                </div>
                <span
                  className={
                    change.direction === 'earned'
                      ? `${styles.rowAmount} ${styles.earned}`
                      : `${styles.rowAmount} ${styles.spent}`
                  }
                >
                  {change.direction === 'earned' ? '+' : '−'}
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

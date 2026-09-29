import { useLocale } from 'react-aria-components';
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
} from '@syntara/react';
import { IconArrowDownRight, IconArrowUpRight, IconGift, IconTrophy } from '@syntara/icons';
import styles from './Screen.module.css';

type PointChange = {
  id: string;
  description: string;
  date: string;
  points: number;
  kind: 'earned' | 'spent';
};

const balance = 3240;
const currentTier = 'Gold';
const nextTier = 'Platinum';
const nextTierThreshold = 5000;
const pointsToNextTier = nextTierThreshold - balance;

const recentChanges: PointChange[] = [
  { id: 'c1', description: 'Purchase at Riverside Market', date: '2026-09-25', points: 240, kind: 'earned' },
  { id: 'c2', description: 'Redeemed for a free coffee', date: '2026-09-22', points: 150, kind: 'spent' },
  { id: 'c3', description: 'Purchase at Downtown Store', date: '2026-09-18', points: 480, kind: 'earned' },
  { id: 'c4', description: 'Referral bonus', date: '2026-09-12', points: 500, kind: 'earned' },
  { id: 'c5', description: 'Redeemed for a gift card', date: '2026-09-05', points: 1000, kind: 'spent' },
  { id: 'c6', description: 'Purchase at Riverside Market', date: '2026-08-29', points: 160, kind: 'earned' },
];

export default function Screen() {
  const { locale } = useLocale();
  const numberFormat = new Intl.NumberFormat(locale);
  const dateFormat = new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <div className={styles.screen}>
      <header className={styles.header}>
        <Eyebrow icon={<IconTrophy aria-hidden />}>Loyalty</Eyebrow>
        <h1 className={styles.heading}>Your points</h1>
      </header>

      <Card className={styles.balanceCard}>
        <CardContent className={styles.balanceContent}>
          <div className={styles.balanceRow}>
            <div>
              <p className={styles.balanceLabel}>Current balance</p>
              <p className={styles.balanceValue}>
                {numberFormat.format(balance)} <span className={styles.balanceUnit}>points</span>
              </p>
            </div>
            <Badge tone="brand" icon={<IconTrophy aria-hidden />}>
              {currentTier} member
            </Badge>
          </div>
          <Meter
            aria-label={`Progress to ${nextTier}`}
            value={balance}
            maxValue={nextTierThreshold}
            valueLabel={`${numberFormat.format(balance)} points`}
            caption={`${numberFormat.format(pointsToNextTier)} points to ${nextTier}`}
            tone="brand"
          />
        </CardContent>
        <CardFooter>
          <Button>
            <IconGift aria-hidden />
            Redeem points
          </Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle level={2}>Recent activity</CardTitle>
          <CardDescription>Your last six point changes</CardDescription>
        </CardHeader>
        <CardContent variant="inset">
          <ul className={styles.list}>
            {recentChanges.map((change) => (
              <li key={change.id} className={styles.row}>
                <div className={styles.rowMain}>
                  <IconTile size="sm" tint={change.kind === 'earned' ? 'success' : 'none'}>
                    {change.kind === 'earned' ? <IconArrowUpRight aria-hidden /> : <IconArrowDownRight aria-hidden />}
                  </IconTile>
                  <div className={styles.rowText}>
                    <p className={styles.rowTitle}>{change.description}</p>
                    <p className={styles.rowDate}>{dateFormat.format(new Date(change.date))}</p>
                  </div>
                </div>
                <span className={styles.rowAmount} data-kind={change.kind}>
                  {change.kind === 'earned' ? '+' : '−'}
                  {numberFormat.format(change.points)} pts
                </span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

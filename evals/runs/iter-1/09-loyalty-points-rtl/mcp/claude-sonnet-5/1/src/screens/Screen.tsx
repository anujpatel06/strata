import {
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
  Tag,
} from '@strata/react';
import { IconArrowDownLeft, IconArrowUpRight, IconAward, IconGift } from '@strata/icons';
import styles from './Screen.module.css';

type ChangeKind = 'earned' | 'spent';

interface PointChange {
  id: string;
  title: string;
  date: string;
  points: number;
  kind: ChangeKind;
}

const account = {
  balance: 12480,
  tier: 'Silver',
  nextTier: 'Gold',
  nextTierAt: 15000,
};

const history: PointChange[] = [
  { id: 'pc-1', title: 'Purchase at downtown store', date: '2026-09-25', points: 320, kind: 'earned' },
  { id: 'pc-2', title: 'Referral bonus', date: '2026-09-20', points: 500, kind: 'earned' },
  { id: 'pc-3', title: 'Redeemed for a £10 voucher', date: '2026-09-18', points: 1000, kind: 'spent' },
  { id: 'pc-4', title: 'Online purchase', date: '2026-09-12', points: 180, kind: 'earned' },
  { id: 'pc-5', title: 'Redeemed for a free coffee', date: '2026-09-05', points: 150, kind: 'spent' },
  { id: 'pc-6', title: 'Birthday bonus', date: '2026-08-30', points: 250, kind: 'earned' },
];

const numberFormat = new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 });
const dateFormat = new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
/** Intl uses a hyphen-minus; use a true minus sign, like Amount and StatTile do. */
const formatPoints = (value: number) => numberFormat.format(value);
const formatSigned = (value: number) => (value >= 0 ? `+${numberFormat.format(value)}` : `−${numberFormat.format(Math.abs(value))}`);
const formatDate = (iso: string) => dateFormat.format(new Date(iso));

const cx = (...classes: Array<string | false | null | undefined>) => classes.filter(Boolean).join(' ');

export default function Screen() {
  const pointsToNextTier = Math.max(0, account.nextTierAt - account.balance);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Eyebrow lead="rule">Loyalty</Eyebrow>
        <h1 className={styles.title}>Your points</h1>
      </header>

      <div className={styles.grid}>
        <Card variant="feature" className={styles.balanceCard}>
          <CardHeader>
            <CardTitle level={2}>Points balance</CardTitle>
            <CardDescription>Member since 2023</CardDescription>
            <CardAction>
              <Tag tone="brand" uppercase leading={<IconAward aria-hidden />}>
                {account.tier}
              </Tag>
            </CardAction>
          </CardHeader>
          <CardContent className={styles.balanceContent}>
            <p className={styles.balanceFigure}>
              <span className={styles.balanceNumber}>{formatPoints(account.balance)}</span>
              <span className={styles.balanceUnit}>pts</span>
            </p>
            <Meter
              label={`Progress to ${account.nextTier}`}
              value={account.balance}
              maxValue={account.nextTierAt}
              valueLabel={`${formatPoints(account.balance)} pts`}
              caption={`${formatPoints(pointsToNextTier)} pts to ${account.nextTier}`}
              tone="brand"
            />
          </CardContent>
          <CardFooter>
            <Button variant="contrast" size="lg">
              <IconGift aria-hidden />
              Redeem points
            </Button>
          </CardFooter>
        </Card>

        <Card rim className={styles.historyCard}>
          <CardHeader>
            <CardTitle level={2}>Recent activity</CardTitle>
            <CardDescription>Your last 6 point changes</CardDescription>
          </CardHeader>
          <CardContent variant="inset">
            <ul className={styles.list}>
              {history.map((change) => (
                <li key={change.id} className={styles.row}>
                  <IconTile tint={change.kind === 'earned' ? 'success' : 'neutral'} size="sm">
                    {change.kind === 'earned' ? <IconArrowDownLeft aria-hidden /> : <IconArrowUpRight aria-hidden />}
                  </IconTile>
                  <span className={styles.rowText}>
                    <span className={styles.rowTitle}>{change.title}</span>
                    <span className={styles.rowMeta}>
                      {change.kind === 'earned' ? 'Earned' : 'Spent'} ·{' '}
                      <time dateTime={change.date}>{formatDate(change.date)}</time>
                    </span>
                  </span>
                  <span className={cx(styles.rowAmount, change.kind === 'earned' && styles.positive)}>
                    {formatSigned(change.kind === 'earned' ? change.points : -change.points)} pts
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
          <CardFooter>
            <p className={styles.footnote}>Points expire 24 months after they're earned.</p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

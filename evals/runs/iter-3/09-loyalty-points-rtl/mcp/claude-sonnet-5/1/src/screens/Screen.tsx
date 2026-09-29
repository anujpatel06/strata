import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  DataTable,
  Meter,
  StatTile,
  toast,
  ToastRegion,
  type DataTableColumn,
} from '@syntara/react';
import { IconArrowDownRight, IconArrowUpRight, IconGift, IconTrophy } from '@syntara/icons';
import styles from './Screen.module.css';

interface PointChange {
  id: string;
  /** ISO date, no time component. */
  date: string;
  description: string;
  /** Points, positive when earned and negative when spent. */
  points: number;
}

const member = {
  tier: 'Silver',
  nextTier: 'Gold',
  balance: 8240,
  tierFloor: 5000,
  nextTierThreshold: 15000,
};

const recentChanges: PointChange[] = [
  { id: 'pc-1', date: '2026-09-25', description: 'Flight to Dubai booked', points: 540 },
  { id: 'pc-2', date: '2026-09-20', description: 'Redeemed for airport lounge access', points: -2500 },
  { id: 'pc-3', date: '2026-09-14', description: 'Hotel stay — Marina Bay', points: 860 },
  { id: 'pc-4', date: '2026-09-05', description: 'Weekly grocery run', points: 120 },
  { id: 'pc-5', date: '2026-08-29', description: 'Redeemed for a gift card', points: -1000 },
  { id: 'pc-6', date: '2026-08-18', description: 'Referral bonus', points: 300 },
];

const pointsFormat = new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 });
const signedPointsFormat = new Intl.NumberFormat(undefined, { maximumFractionDigits: 0, signDisplay: 'exceptZero' });
const dateFormat = new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'short', year: 'numeric' });

/** A true minus sign reads correctly as a number sign, including on right-to-left pages. */
const MINUS = '−';

function formatSignedPoints(value: number): string {
  return signedPointsFormat
    .formatToParts(value)
    .map((part) => (part.type === 'minusSign' ? MINUS : part.value))
    .join('');
}

function formatDate(iso: string): string {
  return dateFormat.format(new Date(`${iso}T00:00:00Z`));
}

const columns: DataTableColumn<PointChange>[] = [
  {
    id: 'date',
    header: 'Date',
    cell: (row) => <time dateTime={row.date}>{formatDate(row.date)}</time>,
  },
  {
    id: 'description',
    header: 'Activity',
    isRowHeader: true,
    cell: (row) => row.description,
  },
  {
    id: 'points',
    header: 'Points',
    align: 'end',
    cell: (row) => (
      <span className={row.points > 0 ? styles.pointsEarned : styles.pointsSpent}>
        {row.points > 0 ? <IconArrowUpRight aria-hidden /> : <IconArrowDownRight aria-hidden />}
        {formatSignedPoints(row.points)} pts
      </span>
    ),
  },
];

export default function Screen() {
  const pointsToNextTier = member.nextTierThreshold - member.balance;

  const handleRedeem = () => {
    toast({
      title: 'Redemption started',
      description: 'We’ll email you when your reward is ready to use.',
      tone: 'success',
    });
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Loyalty points</h1>
          <p className={styles.subtitle}>Track what you’ve earned and spent, and see what’s next.</p>
        </div>
        <Button onPress={handleRedeem}>
          <IconGift aria-hidden />
          Redeem points
        </Button>
      </header>

      <div className={styles.summary}>
        <StatTile
          label="Points balance"
          value={`${pointsFormat.format(member.balance)} pts`}
          caption={`${member.tier} member`}
          icon={<IconTrophy aria-hidden />}
          size="lg"
        />

        <Card>
          <CardHeader>
            <CardTitle level={2}>
              Progress to {member.nextTier}
            </CardTitle>
            <CardDescription>{pointsFormat.format(pointsToNextTier)} points to go</CardDescription>
          </CardHeader>
          <CardContent>
            <Meter
              aria-label={`Progress to ${member.nextTier}`}
              value={member.balance}
              minValue={member.tierFloor}
              maxValue={member.nextTierThreshold}
              valueLabel={`${pointsFormat.format(member.balance)} pts`}
              caption={`of ${pointsFormat.format(member.nextTierThreshold)} for ${member.nextTier}`}
            />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle level={2}>Recent activity</CardTitle>
          <CardDescription>Your last six point changes</CardDescription>
        </CardHeader>
        <CardContent variant="inset">
          <DataTable aria-label="Recent point changes" columns={columns} rows={recentChanges} getRowId={(row) => row.id} />
        </CardContent>
      </Card>

      <ToastRegion />
    </div>
  );
}

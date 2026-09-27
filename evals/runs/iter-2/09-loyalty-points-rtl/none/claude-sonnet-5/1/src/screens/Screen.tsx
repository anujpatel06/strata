import { useMemo, useState } from 'react';
import { useLocale } from 'react-aria-components';
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
  Dialog,
  DialogTrigger,
  Eyebrow,
  IconTile,
  Meter,
  Radio,
  RadioGroup,
} from '@strata/react';
import { IconCoins, IconGift, IconTrophy } from '@strata/icons';
import styles from './Screen.module.css';

interface Tier {
  id: string;
  label: string;
  threshold: number;
}

interface Transaction {
  id: string;
  date: string;
  description: string;
  points: number;
  kind: 'earned' | 'redeemed';
}

interface Reward {
  id: string;
  label: string;
  cost: number;
  description: string;
}

const TIERS: Tier[] = [
  { id: 'bronze', label: 'Bronze', threshold: 0 },
  { id: 'silver', label: 'Silver', threshold: 2000 },
  { id: 'gold', label: 'Gold', threshold: 5000 },
  { id: 'platinum', label: 'Platinum', threshold: 10000 },
];

const REWARDS: Reward[] = [
  { id: 'shipping', label: 'Free standard shipping', cost: 250, description: 'Applied automatically to your next order.' },
  { id: 'off5', label: '$5 off your next order', cost: 500, description: 'A one-time discount code, sent by email.' },
  { id: 'double', label: 'Double points weekend pass', cost: 800, description: 'Earn 2x points on every order for 48 hours.' },
  { id: 'gift15', label: '$15 gift card', cost: 1500, description: 'Sent to your account email within 24 hours.' },
];

const INITIAL_BALANCE = 3240;

const INITIAL_TRANSACTIONS: Transaction[] = [
  { id: 't1', date: '2026-09-24', description: 'Order #48213', points: 180, kind: 'earned' },
  { id: 't2', date: '2026-09-19', description: 'Referral bonus — Priya S.', points: 250, kind: 'earned' },
  { id: 't3', date: '2026-09-12', description: 'Redeemed: Free standard shipping', points: -250, kind: 'redeemed' },
  { id: 't4', date: '2026-09-05', description: 'Order #47950', points: 96, kind: 'earned' },
  { id: 't5', date: '2026-08-28', description: 'Redeemed: $5 off your next order', points: -500, kind: 'redeemed' },
  { id: 't6', date: '2026-08-21', description: 'Welcome bonus', points: 100, kind: 'earned' },
];

const TODAY = '2026-09-27';

function getTierProgress(balance: number) {
  let currentIndex = 0;
  for (let i = 0; i < TIERS.length; i++) {
    if (balance >= TIERS[i].threshold) currentIndex = i;
  }
  return { current: TIERS[currentIndex], next: TIERS[currentIndex + 1] ?? null };
}

export default function Screen() {
  const { locale } = useLocale();
  const [balance, setBalance] = useState(INITIAL_BALANCE);
  const [transactions, setTransactions] = useState<Transaction[]>(INITIAL_TRANSACTIONS);
  const [selectedReward, setSelectedReward] = useState<string | undefined>(undefined);

  const numberFormatter = useMemo(() => new Intl.NumberFormat(locale), [locale]);
  const dateFormatter = useMemo(
    () => new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short', year: 'numeric' }),
    [locale],
  );

  const formatPoints = (n: number) => `${numberFormatter.format(n)} pts`;
  const formatSigned = (n: number) => `${n >= 0 ? '+' : '−'}${numberFormatter.format(Math.abs(n))} pts`;
  const formatDate = (iso: string) => dateFormatter.format(new Date(`${iso}T00:00:00`));

  const { current: currentTier, next: nextTier } = getTierProgress(balance);
  const pointsToNext = nextTier ? nextTier.threshold - balance : 0;
  const reward = REWARDS.find((r) => r.id === selectedReward) ?? null;

  const handleRedeem = () => {
    if (!reward) return;
    setBalance((b) => b - reward.cost);
    setTransactions((ts) =>
      [
        {
          id: `redeem-${Date.now()}`,
          date: TODAY,
          description: `Redeemed: ${reward.label}`,
          points: -reward.cost,
          kind: 'redeemed' as const,
        },
        ...ts,
      ].slice(0, 6),
    );
    setSelectedReward(undefined);
  };

  return (
    <div className={styles.screen}>
      <header className={styles.header}>
        <Eyebrow lead="rule">Loyalty</Eyebrow>
        <h1 className={styles.title}>Your points</h1>
      </header>

      <div className={styles.grid}>
        <Card className={styles.balanceCard}>
          <CardHeader>
            <CardTitle level={2}>Points balance</CardTitle>
            <CardDescription>Member tier</CardDescription>
            <CardAction>
              <Badge tone="brand" variant="soft" icon={<IconTrophy />}>
                {currentTier.label}
              </Badge>
            </CardAction>
          </CardHeader>
          <CardContent className={styles.balanceContent}>
            <p className={styles.balanceValue}>{numberFormatter.format(balance)}</p>
            <p className={styles.balanceUnit}>Points</p>

            {nextTier ? (
              <div className={styles.progress}>
                <Meter
                  label={`Progress to ${nextTier.label}`}
                  value={balance}
                  minValue={currentTier.threshold}
                  maxValue={nextTier.threshold}
                  valueLabel={formatPoints(balance)}
                  caption={`of ${formatPoints(nextTier.threshold)}`}
                  tone="brand"
                />
                <p className={styles.tierNote}>
                  {formatPoints(pointsToNext)} to {nextTier.label}
                </p>
              </div>
            ) : (
              <p className={styles.tierNote}>You&rsquo;ve reached our top tier.</p>
            )}
          </CardContent>
          <CardFooter divider>
            <DialogTrigger
              onOpenChange={(isOpen) => {
                if (!isOpen) setSelectedReward(undefined);
              }}
            >
              <Button variant="primary">
                <IconGift /> Redeem points
              </Button>
              <Dialog
                title="Redeem your points"
                description={`You have ${formatPoints(balance)} available.`}
                size="sm"
                footer={({ close }) => (
                  <>
                    <Button variant="outline" onPress={close}>
                      Cancel
                    </Button>
                    <Button
                      variant="primary"
                      isDisabled={!reward}
                      onPress={() => {
                        handleRedeem();
                        close();
                      }}
                    >
                      Redeem
                    </Button>
                  </>
                )}
              >
                <RadioGroup aria-label="Rewards" variant="card" value={selectedReward} onChange={setSelectedReward}>
                  {REWARDS.map((r) => (
                    <Radio key={r.id} value={r.id} description={r.description} isDisabled={r.cost > balance}>
                      <span className={styles.rewardLabel}>
                        <span>{r.label}</span>
                        <span className={styles.rewardCost}>{formatPoints(r.cost)}</span>
                      </span>
                    </Radio>
                  ))}
                </RadioGroup>
              </Dialog>
            </DialogTrigger>
          </CardFooter>
        </Card>

        <Card className={styles.activityCard}>
          <CardHeader divider>
            <CardTitle level={2}>Recent activity</CardTitle>
            <CardDescription>Your last six point changes</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className={styles.list}>
              {transactions.map((t) => (
                <li key={t.id} className={styles.row}>
                  <IconTile size="sm" tint={t.kind === 'earned' ? 'success' : 'accent'}>
                    {t.kind === 'earned' ? <IconCoins /> : <IconGift />}
                  </IconTile>
                  <div className={styles.rowText}>
                    <p className={styles.rowDescription}>{t.description}</p>
                    <p className={styles.rowDate}>{formatDate(t.date)}</p>
                  </div>
                  <span className={t.kind === 'earned' ? styles.amountEarned : styles.amountSpent}>
                    {formatSigned(t.points)}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

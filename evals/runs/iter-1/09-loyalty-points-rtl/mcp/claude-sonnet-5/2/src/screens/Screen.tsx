import { useState } from 'react';
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
import { IconArrowDownRight, IconArrowUpRight, IconGift } from '@strata/icons';
import styles from './Screen.module.css';

type PointChange = {
  id: string;
  description: string;
  date: string;
  points: number;
  kind: 'earned' | 'redeemed';
};

const currentTier = 'Silver';
const nextTier = 'Gold';
const tierFloor = 2000;
const tierCeiling = 5000;

const history: PointChange[] = [
  { id: 't1', description: 'Flight to Dubai', date: '20 Sep 2026', points: 450, kind: 'earned' },
  { id: 't2', description: 'Redeemed for airport lounge pass', date: '15 Sep 2026', points: 800, kind: 'redeemed' },
  { id: 't3', description: 'Hotel stay, Marina Bay', date: '5 Sep 2026', points: 620, kind: 'earned' },
  { id: 't4', description: 'Grocery partner purchase', date: '28 Aug 2026', points: 85, kind: 'earned' },
  { id: 't5', description: 'Redeemed for gift card', date: '19 Aug 2026', points: 1200, kind: 'redeemed' },
  { id: 't6', description: 'Referral bonus', date: '2 Aug 2026', points: 300, kind: 'earned' },
];

const rewards = [
  { id: 'lounge', name: 'Airport lounge pass', cost: 800, description: 'One-time access at partner airport lounges' },
  { id: 'voucher', name: 'Shopping voucher', cost: 1200, description: 'Redeemable at partner retailers' },
  { id: 'upgrade', name: 'Seat upgrade', cost: 2500, description: 'One cabin upgrade on your next flight' },
];

export default function Screen() {
  const [balance, setBalance] = useState(3240);
  const [selectedReward, setSelectedReward] = useState<string | null>(null);

  const pointsToNextTier = Math.max(0, tierCeiling - balance);

  function confirmRedemption(close: () => void) {
    const reward = rewards.find((r) => r.id === selectedReward);
    if (!reward) return;
    setBalance((current) => current - reward.cost);
    setSelectedReward(null);
    close();
  }

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <Eyebrow>Rewards</Eyebrow>
        <h1 className={styles.title}>Loyalty points</h1>
      </header>

      <Card variant="feature">
        <CardHeader>
          <CardTitle level={2}>Your balance</CardTitle>
          <CardDescription>{currentTier} member</CardDescription>
          <CardAction>
            <Badge tone="brand">{currentTier}</Badge>
          </CardAction>
        </CardHeader>
        <CardContent className={styles.balanceContent}>
          <div className={styles.balanceFigure}>
            <span className={styles.balanceNumber}>{balance.toLocaleString()}</span>
            <span className={styles.balanceUnit}>points</span>
          </div>
          <Meter
            aria-label={`Progress toward ${nextTier} tier`}
            value={balance}
            minValue={tierFloor}
            maxValue={tierCeiling}
            valueLabel={`${balance.toLocaleString()} points`}
            caption={
              pointsToNextTier > 0
                ? `${pointsToNextTier.toLocaleString()} points to ${nextTier}`
                : `You've reached ${nextTier}`
            }
          />
        </CardContent>
        <CardFooter>
          <DialogTrigger>
            <Button>
              <IconGift aria-hidden="true" />
              Redeem points
            </Button>
            <Dialog
              title="Redeem points"
              description={`You have ${balance.toLocaleString()} points available.`}
              footer={({ close }) => (
                <Button isDisabled={!selectedReward} onPress={() => confirmRedemption(close)}>
                  Redeem
                </Button>
              )}
            >
              <RadioGroup
                variant="card"
                label="Choose a reward"
                value={selectedReward}
                onChange={setSelectedReward}
              >
                {rewards.map((reward) => (
                  <Radio
                    key={reward.id}
                    value={reward.id}
                    description={`${reward.description} · ${reward.cost.toLocaleString()} points`}
                    isDisabled={reward.cost > balance}
                  >
                    {reward.name}
                  </Radio>
                ))}
              </RadioGroup>
            </Dialog>
          </DialogTrigger>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader divider>
          <CardTitle level={2}>Recent activity</CardTitle>
          <CardDescription>Your last six point changes</CardDescription>
        </CardHeader>
        <CardContent variant="inset">
          <ul className={styles.list}>
            {history.map((change) => (
              <li className={styles.row} key={change.id}>
                <IconTile tint={change.kind === 'earned' ? 'success' : 'none'}>
                  {change.kind === 'earned' ? <IconArrowUpRight /> : <IconArrowDownRight />}
                </IconTile>
                <div className={styles.rowDetails}>
                  <span className={styles.rowTitle}>{change.description}</span>
                  <span className={styles.rowDate}>{change.date}</span>
                </div>
                <Badge variant="status" tone={change.kind === 'earned' ? 'success' : 'neutral'}>
                  {change.kind === 'earned' ? 'Earned' : 'Redeemed'}
                </Badge>
                <span className={styles.rowAmount} data-kind={change.kind}>
                  {change.kind === 'earned' ? '+' : '−'}
                  {change.points.toLocaleString()} pts
                </span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

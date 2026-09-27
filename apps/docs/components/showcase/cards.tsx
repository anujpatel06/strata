'use client';

/**
 * The showcase cards: one small business-money product told as specific moments (a revenue week, a card limit,
 * a payout waiting on approval), composed only from @strata/react and @strata/icons. Layout glue lives in
 * cards.module.css (tokens only); every control, chart, label and colour comes from the components themselves.
 *
 * Each card takes the heading level of its title, so the grid fits under any page heading.
 */

import { DateFormatter, parseDate, type CalendarDate } from '@internationalized/date';
import {
  IconAlertTriangle,
  IconArrowDownLeft,
  IconArrowUpRight,
  IconBolt,
  IconBuildingBank,
  IconClock,
  IconArrowsExchange,
  IconCoins,
  IconCreditCard,
  IconPercentage,
  IconPiggyBank,
  IconPlus,
  IconShieldCheck,
  IconTrendingDown,
  IconTrendingUp,
  IconWallet,
} from '@strata/icons';
import {
  Amount,
  AreaChart,
  Avatar,
  Badge,
  Button,
  Calendar,
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Eyebrow,
  IconTile,
  Label,
  Meter,
  PersonChip,
  PersonChipGroup,
  Select,
  SelectItem,
  Separator,
  Sparkline,
  StatTile,
  StatTileGroup,
  Switch,
  Tag,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
} from '@strata/react';
import { useId, useState, type Key, type ReactNode } from 'react';
import {
  ACCOUNTS,
  ACTIVITY,
  ACTIVITY_STATUS,
  APPROVERS,
  COPY_LOCALE,
  CURRENCY,
  PAYEES,
  REVENUE,
  REVENUE_SPLIT,
  SCHEDULE,
  money,
  type AccountIcon,
  type Period,
} from './showcase-data';
import styles from './cards.module.css';

type Level = 2 | 3 | 4;

interface CardProps {
  /** Heading level for the card title. */
  level: Level;
}

const percent = new Intl.NumberFormat(COPY_LOCALE, { style: 'percent', maximumFractionDigits: 1, signDisplay: 'exceptZero' });
const compactMoney = new Intl.NumberFormat(COPY_LOCALE, {
  style: 'currency',
  currency: CURRENCY,
  notation: 'compact',
  maximumFractionDigits: 1,
});
/** "+$12,650.00" / "−$4,800.00", with a real minus sign. */
const signedMoney = (v: number) => `${v < 0 ? '−' : '+'}${money(Math.abs(v), 2)}`;

const firstKey = (keys: Set<Key>): string | undefined => {
  const [k] = keys;
  return k == null ? undefined : String(k);
};

/* ------------------------------------------------------------------ */

const PERIODS: Array<{ id: Period; spoken: string }> = [
  { id: '7d', spoken: 'last 7 days' },
  { id: '4w', spoken: 'last 4 weeks' },
  { id: '12m', spoken: 'last 12 months' },
];

/** The hero: net revenue with a period toggle that redraws the chart, then the month split by channel. */
export function RevenueCard({ level }: CardProps) {
  const titleId = useId();
  const [period, setPeriod] = useState<Period>('4w');
  const data = REVENUE[period];
  const up = data.delta >= 0;
  const Trend = up ? IconTrendingUp : IconTrendingDown;
  return (
    <Card variant="showcase">
      <CardHeader>
        <Eyebrow tone="brand">After fees</Eyebrow>
        <CardTitle level={level} id={titleId}>
          Net revenue
        </CardTitle>
        <CardAction>
          <ToggleButtonGroup
            aria-label="Period"
            size="sm"
            selectedKeys={[period]}
            disallowEmptySelection
            onSelectionChange={(keys) => {
              const key = firstKey(keys);
              if (key === '7d' || key === '4w' || key === '12m') setPeriod(key);
            }}
          >
            {PERIODS.map((p) => (
              <ToggleButton key={p.id} id={p.id}>
                {REVENUE[p.id].label}
                <span className="visually-hidden">, {p.spoken}</span>
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        </CardAction>
      </CardHeader>
      <CardContent className={styles.revenue}>
        <div className={styles.headline} aria-live="polite">
          <Amount value={data.total} currency={CURRENCY} locale={COPY_LOCALE} size="lg" />
          <span className={styles.headlineMeta}>
            <Badge size="sm" tone={up ? 'success' : 'danger'} icon={<Trend aria-hidden />}>
              <span dir="ltr">{percent.format(data.delta)}</span>
            </Badge>
            <span className={styles.muted}>{data.versus}</span>
          </span>
        </div>
        <AreaChart
          aria-labelledby={titleId}
          data={data.points}
          x="x"
          xLabel={data.xLabel}
          height={168}
          series={[
            { key: 'current', label: 'This period' },
            { key: 'previous', label: 'Previous period' },
          ]}
          format={{ value: (v) => money(v), axis: (v) => compactMoney.format(v) }}
        />
        <Separator />
        {/* One label for the three channels, instead of "in September" under every figure. */}
        <div className={styles.channels}>
          <Eyebrow>September by channel</Eyebrow>
          <StatTileGroup className={styles.split}>
            {REVENUE_SPLIT.map((s) => (
              <StatTile
                key={s.label}
                variant="ghost"
                size="sm"
                label={s.label}
                value={money(s.value)}
                delta={s.delta}
                deltaLabel={<span className="visually-hidden">versus August</span>}
                positiveIsGood={'positiveIsGood' in s ? s.positiveIsGood : true}
                sparkline={[...s.spark]}
              />
            ))}
          </StatTileGroup>
        </div>
      </CardContent>
    </Card>
  );
}

/* ------------------------------------------------------------------ */

const PERKS = [
  { icon: <IconClock />, title: 'Minutes, not two days', detail: 'Card sales land as soon as they settle.' },
  { icon: <IconShieldCheck />, title: 'Same checks as today', detail: 'Every payout still goes through review.' },
  { icon: <IconPercentage />, title: '1% a payout, capped at $15', detail: 'Only on the payouts you speed up.' },
];

/** The one feature card per view: brand glow, stars, rim and halo. */
export function PromoCard({ level }: CardProps) {
  return (
    <Card variant="feature" stars>
      <CardHeader>
        <span className={styles.promoTop}>
          <IconTile tint="solid" size="sm">
            <IconBolt />
          </IconTile>
          <Tag tone="brand" size="sm">
            New
          </Tag>
        </span>
        <CardTitle level={level} className={styles.promoTitle}>
          Get paid <em>the day you invoice</em>
        </CardTitle>
        <CardDescription>Instant payouts move card sales into Operating within minutes, for 1% a payout.</CardDescription>
      </CardHeader>
      <CardContent>
        <ul className={styles.perks} role="list">
          {PERKS.map((p) => (
            <li key={p.title} className={styles.perk}>
              <IconTile size="sm" tint="none">
                {p.icon}
              </IconTile>
              <span className={styles.rowText}>
                <span className={styles.strong}>{p.title}</span>
                <span className={styles.subtle}>{p.detail}</span>
              </span>
            </li>
          ))}
        </ul>
      </CardContent>
      <CardContent className={styles.promoFigure}>
        <Eyebrow>Could have landed early in September</Eyebrow>
        <Amount value={28460} currency={CURRENCY} locale={COPY_LOCALE} size="md" tone="brand" />
      </CardContent>
      <CardFooter className={styles.promoActions}>
        <Button>Turn on</Button>
        <Button variant="secondary">How it works</Button>
      </CardFooter>
    </Card>
  );
}

/* ------------------------------------------------------------------ */

const ACCOUNT_ICONS: Record<AccountIcon, ReactNode> = {
  bank: <IconBuildingBank />,
  wallet: <IconWallet />,
  piggy: <IconPiggyBank />,
  coins: <IconCoins />,
  card: <IconCreditCard />,
};

/** Balances with a 9-week trend each. The sign carries the direction; the colour only repeats it. */
export function AccountsCard({ level }: CardProps) {
  const total = ACCOUNTS.reduce((a, b) => a + b.balance, 0);
  return (
    <Card variant="showcase">
      <CardHeader>
        <CardTitle level={level}>Accounts</CardTitle>
        <CardDescription>
          {money(total)} across {ACCOUNTS.length} accounts
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ul className={`${styles.rows} ${styles.accounts}`} role="list">
          {ACCOUNTS.map((a) => (
            <li key={a.id} className={styles.row}>
              <IconTile tint="auto" name={a.name}>
                {ACCOUNT_ICONS[a.icon]}
              </IconTile>
              <span className={styles.rowText}>
                <span className={styles.strong}>{a.name}</span>
                <span className={styles.muted}>{a.detail}</span>
              </span>
              <Sparkline data={a.trend} tone={a.change >= 0 ? 'success' : 'danger'} showEndDot={false} className={styles.spark} />
              <span className={styles.rowFigure}>
                <span className={styles.number}>{money(a.balance)}</span>
                <span className={styles.change} data-tone={a.change >= 0 ? 'up' : 'down'} dir="ltr">
                  {percent.format(a.change)}
                </span>
              </span>
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter className={styles.pairFooter}>
        <Button variant="secondary">
          <IconArrowsExchange aria-hidden />
          Move money
        </Button>
        <Button variant="secondary">
          <IconPlus aria-hidden />
          Add funds
        </Button>
      </CardFooter>
    </Card>
  );
}

/* ------------------------------------------------------------------ */

/** Both ends of each meter are figures (spent, left), with the limit in the label, so nothing trails alone. */
const LIMITS = { cards: { spent: 3120, limit: 5000 }, transfers: { used: 18, free: 25 } };

export function LimitsCard({ level }: CardProps) {
  const { cards, transfers } = LIMITS;
  return (
    <Card variant="showcase">
      <CardHeader>
        <CardTitle level={level}>Spend limits</CardTitle>
        <CardDescription>Team cards reset on October 1.</CardDescription>
      </CardHeader>
      <CardContent className={styles.meters}>
        <Meter
          variant="card"
          label={`Team cards, ${money(cards.limit)} a month`}
          value={cards.spent}
          maxValue={cards.limit}
          valueLabel={`${money(cards.spent)} spent`}
          caption={`${money(cards.limit - cards.spent)} left`}
        />
        <Meter
          variant="card"
          label={`Free transfers, ${transfers.free} a month`}
          tone="accent"
          value={transfers.used}
          maxValue={transfers.free}
          valueLabel={`${transfers.used} used`}
          caption={`${transfers.free - transfers.used} left`}
        />
      </CardContent>
    </Card>
  );
}

/* ------------------------------------------------------------------ */

export function ApprovalsCard({ level }: CardProps) {
  return (
    <Card variant="showcase">
      <CardHeader>
        <CardTitle level={level}>Approvals</CardTitle>
        <CardDescription>Payouts over $2,500 need a yes from one of them.</CardDescription>
      </CardHeader>
      <CardContent>
        <PersonChipGroup aria-label="Approvers" size="sm">
          {APPROVERS.map((name) => (
            <PersonChip key={name} id={name} name={name} />
          ))}
        </PersonChipGroup>
      </CardContent>
      <CardFooter divider className={styles.between}>
        <Badge variant="status" tone="warning">
          1 payout waiting
        </Badge>
        <Button variant="contrast" size="sm">
          Review
        </Button>
      </CardFooter>
    </Card>
  );
}

/* ------------------------------------------------------------------ */

const dayFormat = new DateFormatter(COPY_LOCALE, { month: 'short', day: 'numeric', timeZone: 'UTC' });
const dayLabel = (d: CalendarDate) => dayFormat.format(d.toDate('UTC'));

export function ScheduleCard({ level }: CardProps) {
  const [date, setDate] = useState<CalendarDate>(() => parseDate('2026-10-02'));
  const due = SCHEDULE.filter((s) => s.date === date.toString());
  return (
    <Card variant="showcase">
      <CardHeader>
        <CardTitle level={level}>Scheduled</CardTitle>
        <CardDescription>{SCHEDULE.length} payments go out in October.</CardDescription>
      </CardHeader>
      <CardContent className={styles.center}>
        <Calendar aria-label="Payment schedule" value={date} onChange={(d) => setDate(d as CalendarDate)} />
      </CardContent>
      <CardContent variant="inset" className={styles.schedule} aria-live="polite">
        {due.length ? (
          due.map((s) => (
            <span key={s.title} className={styles.scheduleRow}>
              <span className={styles.strong}>
                {s.title}, {dayLabel(date)}
              </span>
              <span className={styles.number}>{signedMoney(s.amount)}</span>
            </span>
          ))
        ) : (
          <span className={styles.muted}>Nothing goes out on {dayLabel(date)}.</span>
        )}
      </CardContent>
    </Card>
  );
}

/* ------------------------------------------------------------------ */

const LIMIT = 2500;

/** The amount as typed ("4800", "4,800.5") → a number, or NaN when it isn't one. Commas are grouping only. */
const parseAmount = (text: string) => {
  const t = text.trim().replaceAll(',', '');
  return /^\d+(\.\d{1,2})?$/.test(t) ? Number(t) : Number.NaN;
};
/** Grouped, two decimals, no currency: the field's "$" prefix is the one currency cue ("4,800.00"). */
const amountText = new Intl.NumberFormat(COPY_LOCALE, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function TransferCard({ level }: CardProps) {
  const titleId = useId();
  const speedId = useId();
  const [payee, setPayee] = useState<string>('lumen');
  const [amount, setAmount] = useState(() => amountText.format(4800));
  const [speed, setSpeed] = useState('standard');
  const value = parseAmount(amount);
  const valid = value > 0;
  const name = PAYEES.find((p) => p.id === payee)?.name ?? '';
  return (
    <Card variant="showcase">
      <form className={styles.contents} onSubmit={(e) => e.preventDefault()} aria-labelledby={titleId}>
        <CardHeader>
          <CardTitle level={level} id={titleId}>
            Pay a supplier
          </CardTitle>
          <CardDescription>From Operating ·· 4821</CardDescription>
        </CardHeader>
        <CardContent className={styles.fields}>
          <Select label="Pay to" selectedKey={payee} onSelectionChange={(key) => key != null && setPayee(String(key))}>
            {PAYEES.map((p) => (
              <SelectItem
                key={p.id}
                id={p.id}
                textValue={p.name}
                description={p.detail}
                icon={<Avatar size="sm" name={p.name} alt="" />}
              >
                {p.name}
              </SelectItem>
            ))}
          </Select>
          {/* No NumberField in Strata yet, so the text is regrouped when you leave the field: type "4800", read
              "4,800.00". One currency cue (the "$" prefix); the card's copy already says the account is in USD. */}
          <TextField
            label="Amount"
            inputMode="decimal"
            prefix="$"
            value={amount}
            onChange={setAmount}
            onBlur={() => valid && setAmount(amountText.format(value))}
            isInvalid={!valid}
            errorMessage="Enter an amount, like 250.00"
            className={styles.amount}
          />
          <div className={styles.field}>
            <Label id={speedId} elementType="span">
              Arrives
            </Label>
            <ToggleButtonGroup
              aria-labelledby={speedId}
              size="sm"
              selectedKeys={[speed]}
              disallowEmptySelection
              onSelectionChange={(keys) => setSpeed(firstKey(keys) ?? 'standard')}
              className={styles.segmented}
            >
              <ToggleButton id="standard">Tomorrow, free</ToggleButton>
              <ToggleButton id="instant">In minutes, $2</ToggleButton>
            </ToggleButtonGroup>
          </div>
        </CardContent>
        <CardFooter className={styles.submit}>
          <Button type="submit" isDisabled={!valid}>
            {valid ? `Send ${money(value, 2)}` : 'Send'}
          </Button>
          <span className={styles.note} aria-live="polite">
            {valid && value > LIMIT
              ? `Over ${money(LIMIT)}, so it waits for an approver.`
              : `${name.split(' ')[0]} gets it ${speed === 'instant' ? 'in minutes' : 'tomorrow'}.`}
          </span>
        </CardFooter>
      </form>
    </Card>
  );
}

/* ------------------------------------------------------------------ */

export function AlertsCard({ level }: CardProps) {
  return (
    <Card variant="showcase">
      <CardHeader>
        <CardTitle level={level}>Alerts</CardTitle>
        <CardDescription>Push and email, as it happens.</CardDescription>
        <CardAction>
          <IconTile tint="warning" size="sm">
            <IconAlertTriangle />
          </IconTile>
        </CardAction>
      </CardHeader>
      <CardContent className={styles.switches}>
        <Switch defaultSelected description="Before anything over $2,500 leaves an account.">
          Large payouts
        </Switch>
        <Separator />
        <Switch defaultSelected description="When Operating drops under $10,000.">
          Low balance
        </Switch>
        <Separator />
        <Switch defaultSelected description="A team card is declined, with the reason.">
          Declined cards
        </Switch>
        <Separator />
        <Switch description="Every Monday: what came in, what went out.">Weekly summary</Switch>
      </CardContent>
    </Card>
  );
}

/* ------------------------------------------------------------------ */

export function ActivityCard({ level }: CardProps) {
  return (
    <Card variant="showcase">
      <CardHeader>
        <CardTitle level={level}>Activity</CardTitle>
        <CardDescription>Across all accounts, newest first.</CardDescription>
        <CardAction>
          <Button variant="ghost" size="sm">
            View all
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        <ul className={styles.rows} role="list">
          {ACTIVITY.map((a) => {
            const incoming = a.amount > 0;
            const status = ACTIVITY_STATUS[a.status];
            return (
              <li key={a.id} className={styles.row}>
                <IconTile size="sm" tint={incoming ? 'success' : 'none'}>
                  {incoming ? <IconArrowDownLeft className={styles.flip} /> : <IconArrowUpRight className={styles.flip} />}
                </IconTile>
                <span className={styles.rowText}>
                  <span className={styles.strong}>{a.title}</span>
                  <span className={styles.muted}>{a.meta}</span>
                </span>
                <span className={styles.rowFigure}>
                  <span className={styles.number}>{signedMoney(a.amount)}</span>
                  <Badge variant="status" tone={status.tone} size="sm">
                    {status.label}
                  </Badge>
                </span>
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}

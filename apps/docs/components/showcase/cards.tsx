'use client';

/**
 * The showcase cards: small, realistic product surfaces composed only from @strata/react. Layout glue lives
 * in cards.module.css (tokens only); every control, label and colour comes from the components themselves.
 */

import { parseDate } from '@internationalized/date';
import {
  IconBuildingBank,
  IconCreditCard,
  IconDownload,
  IconFileText,
  IconKey,
  IconLock,
  IconSettings,
  IconUserPlus,
  IconUsers,
  IconWallet,
} from '@tabler/icons-react';
import {
  Avatar,
  Badge,
  Button,
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Checkbox,
  DataTable,
  FileUpload,
  Kbd,
  KbdGroup,
  Menu,
  MenuItem,
  Radio,
  RadioGroup,
  RangeCalendar,
  SearchField,
  Select,
  SelectItem,
  Separator,
  StatTile,
  Switch,
  TextArea,
  TextField,
  type DataTableColumn,
  type FileUploadEntry,
} from '@strata/react';
import { useId, useState, type ReactNode } from 'react';
import { PEOPLE, RENEWALS, RENEWAL_STATUS, REVENUE_SERIES, ROLES, type Renewal } from './showcase-data';
import styles from './cards.module.css';

type Level = 2 | 3 | 4;

interface CardProps {
  /** Heading level for the card title. */
  level: Level;
}

/* ------------------------------------------------------------------ */

export function RevenueCard({ level }: CardProps) {
  const id = useId();
  return (
    <section className={styles.stack} aria-labelledby={id}>
      <HiddenHeading id={id} level={level}>
        Revenue summary
      </HiddenHeading>
      <StatTile
        size="lg"
        label="Revenue"
        value="$45,231.89"
        delta={0.201}
        deltaLabel="vs last month"
        sparkline={REVENUE_SERIES}
      />
      <div className={styles.pair}>
        <StatTile size="sm" label="Subscriptions" value="2,350" delta={0.18} deltaLabel="this month" />
        <StatTile size="sm" label="Churn" value="1.9%" delta={-0.04} positiveIsGood={false} deltaLabel="this month" />
      </div>
    </section>
  );
}

/** The tiles stand in for a titled card, so the heading outline still gets an entry. */
function HiddenHeading({ id, level, children }: { id: string; level: Level; children: ReactNode }) {
  const H = `h${level}` as const;
  return (
    <H id={id} className="visually-hidden">
      {children}
    </H>
  );
}

/* ------------------------------------------------------------------ */

export function SendMoneyCard({ level }: CardProps) {
  const [amount, setAmount] = useState('250.00');
  const [recipient, setRecipient] = useState<string>('amara');
  const person = PEOPLE.find((p) => p.id === recipient);
  const valid = /^\d+(\.\d{1,2})?$/.test(amount.trim()) && Number(amount) > 0;
  return (
    <Card>
      <form className={styles.contents} onSubmit={(e) => e.preventDefault()} aria-label="Send money">
        <CardHeader>
          <CardTitle level={level}>Send money</CardTitle>
          <CardDescription>Arrives within one working day. No fee.</CardDescription>
        </CardHeader>
        <CardContent className={styles.fields}>
          <Select
            label="Recipient"
            selectedKey={recipient}
            onSelectionChange={(key) => key != null && setRecipient(String(key))}
          >
            {PEOPLE.map((p) => (
              <SelectItem key={p.id} id={p.id} textValue={p.name} icon={<Avatar size="sm" name={p.name} alt="" />}>
                {p.name}
              </SelectItem>
            ))}
          </Select>
          <TextField
            label="Amount"
            inputMode="decimal"
            prefix="$"
            suffix="USD"
            value={amount}
            onChange={setAmount}
            isInvalid={!valid}
            errorMessage="Enter an amount, like 25.00"
          />
          <TextField label="Reference" placeholder="What’s it for?" defaultValue="Team lunch" />
        </CardContent>
        <CardFooter>
          <Button type="submit" className={styles.grow} isDisabled={!valid}>
            Send{valid ? ` $${Number(amount).toFixed(2)}` : ''} to {person?.name.split(' ')[0]}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}

/* ------------------------------------------------------------------ */

export function TeamCard({ level }: CardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle level={level}>Team members</CardTitle>
        <CardDescription>Invite your team to collaborate.</CardDescription>
        <CardAction>
          <Button variant="outline" size="sm">
            <IconUserPlus aria-hidden />
            Invite
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        <ul className={styles.list} role="list">
          {PEOPLE.map((p) => (
            <li key={p.id} className={styles.person}>
              <Avatar name={p.name} alt="" />
              <span className={styles.personText}>
                <span className={styles.strong}>{p.name}</span>
                <span className={styles.muted}>{p.email}</span>
              </span>
              <Select aria-label={`Role for ${p.name}`} defaultSelectedKey={p.role} className={styles.roleSelect}>
                {ROLES.map((r) => (
                  <SelectItem key={r.id} id={r.id} description={r.description} textValue={r.label}>
                    {r.label}
                  </SelectItem>
                ))}
              </Select>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

/* ------------------------------------------------------------------ */

const renewalColumns: DataTableColumn<Renewal>[] = [
  {
    id: 'account',
    header: 'Account',
    isRowHeader: true,
    cell: (r) => (
      <span className={styles.cellStack}>
        <span className={styles.strong}>{r.account}</span>
        <span className={styles.muted}>
          {r.plan} · {r.date}
        </span>
      </span>
    ),
  },
  {
    id: 'status',
    header: 'Status',
    cell: (r) => <Badge tone={RENEWAL_STATUS[r.status].tone}>{RENEWAL_STATUS[r.status].label}</Badge>,
  },
  { id: 'amount', header: 'Amount', align: 'end', cell: (r) => r.amount },
];

export function RenewalsCard({ level }: CardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle level={level}>Upcoming renewals</CardTitle>
        <CardDescription>Subscriptions renewing in the next 30 days.</CardDescription>
        <CardAction>
          <Button variant="ghost" size="icon" aria-label="Export renewals">
            <IconDownload aria-hidden />
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        <DataTable
          aria-label="Upcoming renewals"
          columns={renewalColumns}
          rows={RENEWALS}
          getRowId={(r) => r.id}
          density="compact"
        />
      </CardContent>
    </Card>
  );
}

/* ------------------------------------------------------------------ */

export function TimeOffCard({ level }: CardProps) {
  const [range, setRange] = useState({ start: parseDate('2026-10-12'), end: parseDate('2026-10-16') });
  const days = range.end.compare(range.start) + 1;
  return (
    <Card>
      <CardHeader>
        <CardTitle level={level}>Time off</CardTitle>
        <CardDescription>Pick the days you’ll be away.</CardDescription>
      </CardHeader>
      <CardContent className={styles.center}>
        <RangeCalendar aria-label="Time off dates" value={range} onChange={setRange} />
      </CardContent>
      <CardFooter divider className={styles.between}>
        <span className={styles.muted} aria-live="polite">
          {days} {days === 1 ? 'day' : 'days'} selected
        </span>
        <Button size="sm">Request</Button>
      </CardFooter>
    </Card>
  );
}

/* ------------------------------------------------------------------ */

export function NotificationsCard({ level }: CardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle level={level}>Notifications</CardTitle>
        <CardDescription>Choose what you hear about, and where.</CardDescription>
      </CardHeader>
      <CardContent className={styles.switches}>
        <Switch defaultSelected description="When someone mentions you or replies to your comment.">
          Mentions
        </Switch>
        <Separator />
        <Switch defaultSelected description="A summary of activity in your workspace, every Monday.">
          Weekly digest
        </Switch>
        <Separator />
        <Switch description="New features and improvements, about once a month.">Product updates</Switch>
      </CardContent>
    </Card>
  );
}

/* ------------------------------------------------------------------ */

export function CreateAccountCard({ level }: CardProps) {
  return (
    <Card>
      <form className={styles.contents} onSubmit={(e) => e.preventDefault()} aria-label="Create an account">
        <CardHeader>
          <CardTitle level={level}>Create an account</CardTitle>
          <CardDescription>Enter your email below to create your account.</CardDescription>
        </CardHeader>
        <CardContent className={styles.fields}>
          <div className={styles.pair}>
            <Button variant="outline">
              <IconBuildingBank aria-hidden />
              SSO
            </Button>
            <Button variant="outline">
              <IconKey aria-hidden />
              Passkey
            </Button>
          </div>
          <Separator label="or continue with" />
          <TextField label="Email" type="email" autoComplete="email" placeholder="you@example.com" />
          <TextField label="Password" type="password" autoComplete="new-password" description="At least 12 characters." />
          <Checkbox>I agree to the terms and privacy policy</Checkbox>
        </CardContent>
        <CardFooter>
          <Button type="submit" className={styles.grow}>
            Create account
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}

/* ------------------------------------------------------------------ */

export function ReportIssueCard({ level }: CardProps) {
  return (
    <Card>
      <form className={styles.contents} onSubmit={(e) => e.preventDefault()} aria-label="Report an issue">
        <CardHeader>
          <CardTitle level={level}>Report an issue</CardTitle>
          <CardDescription>What area are you having problems with?</CardDescription>
        </CardHeader>
        <CardContent className={`${styles.fields} ${styles.fill}`}>
          <div className={styles.pair}>
            <Select label="Area" defaultSelectedKey="billing">
              <SelectItem id="billing">Billing</SelectItem>
              <SelectItem id="account">Account</SelectItem>
              <SelectItem id="integrations">Integrations</SelectItem>
              <SelectItem id="other">Something else</SelectItem>
            </Select>
            <Select label="Severity" defaultSelectedKey="medium">
              <SelectItem id="low">Low</SelectItem>
              <SelectItem id="medium">Medium</SelectItem>
              <SelectItem id="high">High</SelectItem>
              <SelectItem id="critical">Critical</SelectItem>
            </Select>
          </div>
          <TextField label="Subject" placeholder="I need help with…" />
          <TextArea label="Description" placeholder="Include anything that helps us reproduce it." rows={3} />
        </CardContent>
        <CardFooter className={styles.between}>
          <Button variant="ghost">Cancel</Button>
          <Button type="submit">Submit</Button>
        </CardFooter>
      </form>
    </Card>
  );
}

/* ------------------------------------------------------------------ */

const sampleFile = (name: string, kb: number, type: string) =>
  new File([new Uint8Array(kb * 1024)], name, { type, lastModified: 0 });

export function UploadCard({ level }: CardProps) {
  const [entries, setEntries] = useState<FileUploadEntry[]>(() => [
    { file: sampleFile('signed-agreement.pdf', 842, 'application/pdf'), progress: 100 },
    { file: sampleFile('receipt-october.jpg', 2310, 'image/jpeg'), progress: 64 },
  ]);
  return (
    <Card>
      <CardHeader>
        <CardTitle level={level}>Upload documents</CardTitle>
        <CardDescription>Attach receipts or signed paperwork.</CardDescription>
      </CardHeader>
      <CardContent>
        <FileUpload
          label="Attachments"
          acceptedFileTypes={['image/*', '.pdf']}
          maxSize={20 * 1024 * 1024}
          allowsMultiple
          files={entries}
          onChange={(files) => setEntries(files.map((file) => entries.find((e) => e.file === file) ?? { file, progress: 100 }))}
        />
      </CardContent>
    </Card>
  );
}

/* ------------------------------------------------------------------ */

export function QuickActionsCard({ level }: CardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle level={level}>Ask or jump to</CardTitle>
        <CardDescription>Search, run a command or ask a question.</CardDescription>
        <CardAction>
          <KbdGroup>
            <Kbd>⌘</Kbd>
            <Kbd>K</Kbd>
          </KbdGroup>
        </CardAction>
      </CardHeader>
      <CardContent className={styles.fields}>
        <SearchField aria-label="Search or ask" placeholder="Search or ask a question…" />
        <Menu aria-label="Suggestions" className={styles.menu}>
          <MenuItem id="doc" icon={<IconFileText />} shortcut="⌘N">
            New document
          </MenuItem>
          <MenuItem id="invite" icon={<IconUsers />} shortcut="⌘I">
            Invite teammates
          </MenuItem>
          <MenuItem id="billing" icon={<IconCreditCard />} shortcut="⌘B">
            Billing
          </MenuItem>
          <MenuItem id="settings" icon={<IconSettings />} shortcut="⌘,">
            Settings
          </MenuItem>
        </Menu>
      </CardContent>
    </Card>
  );
}

/* ------------------------------------------------------------------ */

export function PaymentMethodCard({ level }: CardProps) {
  return (
    <Card>
      <form className={styles.contents} onSubmit={(e) => e.preventDefault()} aria-label="Payment method">
        <CardHeader>
          <CardTitle level={level}>Payment method</CardTitle>
          <CardDescription>Add a new payment method to your account.</CardDescription>
        </CardHeader>
        <CardContent className={`${styles.fields} ${styles.fill}`}>
          <RadioGroup variant="card" aria-label="Payment type" defaultValue="card">
            <Radio value="card" description="Visa, Mastercard, Amex">
              <span className={styles.radioLabel}>
                <IconCreditCard aria-hidden className={styles.icon} />
                Card
              </span>
            </Radio>
            <Radio value="bank" description="2–3 working days">
              <span className={styles.radioLabel}>
                <IconBuildingBank aria-hidden className={styles.icon} />
                Bank transfer
              </span>
            </Radio>
            <Radio value="wallet" description="Pay with a saved balance">
              <span className={styles.radioLabel}>
                <IconWallet aria-hidden className={styles.icon} />
                Wallet
              </span>
            </Radio>
          </RadioGroup>
          <TextField
            label="Card number"
            autoComplete="cc-number"
            inputMode="numeric"
            placeholder="1234 1234 1234 1234"
            suffix={<IconLock aria-hidden className={styles.icon} />}
          />
          <div className={styles.pair}>
            <TextField label="Expires" autoComplete="cc-exp" placeholder="MM / YY" />
            <TextField label="CVC" autoComplete="cc-csc" inputMode="numeric" placeholder="123" />
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" className={styles.grow}>
            Continue
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}

/* ------------------------------------------------------------------ */

export function CookieCard({ level }: CardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle level={level}>Cookie settings</CardTitle>
        <CardDescription>Manage the cookies this site may use.</CardDescription>
      </CardHeader>
      <CardContent className={`${styles.switches} ${styles.fill}`}>
        <Switch isSelected isReadOnly description="Needed to sign in and keep the site secure. Always on.">
          Strictly necessary
        </Switch>
        <Switch defaultSelected description="Remember your preferences, like language and layout.">
          Functional
        </Switch>
        <Switch description="Help us understand how the site is used, anonymously.">Performance</Switch>
      </CardContent>
      <CardFooter divider className={styles.between}>
        <Button variant="outline">Reject all</Button>
        <Button>Save preferences</Button>
      </CardFooter>
    </Card>
  );
}

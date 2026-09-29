import { useId, useState } from 'react';
import {
  AlertDialog,
  Amount,
  Avatar,
  Badge,
  Button,
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
  DatePicker,
  Dialog,
  DialogTrigger,
  EmptyState,
  Eyebrow,
  Menu,
  MenuItem,
  MenuSeparator,
  MenuTrigger,
  Select,
  SelectItem,
  Tag,
  TextField,
  ToastRegion,
  toast,
} from '@syntara/react';
import { IconCalendarEvent, IconCircleX, IconDotsVertical, IconPencil, IconPlayerPause, IconPlayerPlay, IconPlus, IconWallet } from '@syntara/icons';
import { getLocalTimeZone, parseDate, today, type DateValue } from '@internationalized/date';
import styles from './Screen.module.css';

type Frequency = 'Weekly' | 'Fortnightly' | 'Monthly' | 'Quarterly' | 'Yearly';
type PaymentStatus = 'active' | 'paused';

interface ScheduledPayment {
  id: string;
  payee: string;
  category: string;
  amount: number;
  currency: string;
  date: DateValue;
  frequency: Frequency;
  status: PaymentStatus;
}

const frequencies: Frequency[] = ['Weekly', 'Fortnightly', 'Monthly', 'Quarterly', 'Yearly'];

const initialPayments: ScheduledPayment[] = [
  { id: 'p1', payee: 'Skyline Apartments', category: 'Rent', amount: 1850, currency: 'USD', date: parseDate('2026-10-01'), frequency: 'Monthly', status: 'active' },
  { id: 'p2', payee: 'Netflix', category: 'Streaming', amount: 15.49, currency: 'USD', date: parseDate('2026-10-03'), frequency: 'Monthly', status: 'active' },
  { id: 'p3', payee: 'PowerGrid Electric', category: 'Utilities', amount: 92.3, currency: 'USD', date: parseDate('2026-10-05'), frequency: 'Monthly', status: 'active' },
  { id: 'p4', payee: 'FitZone Gym', category: 'Membership', amount: 45, currency: 'USD', date: parseDate('2026-10-12'), frequency: 'Monthly', status: 'paused' },
  { id: 'p5', payee: 'Horizon Auto Loan', category: 'Loan', amount: 410, currency: 'USD', date: parseDate('2026-10-15'), frequency: 'Monthly', status: 'active' },
  { id: 'p6', payee: 'Bright Life Insurance', category: 'Insurance', amount: 138.75, currency: 'USD', date: parseDate('2026-11-01'), frequency: 'Quarterly', status: 'active' },
];

const dateFormatter = new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'short', year: 'numeric' });

function formatDate(date: DateValue) {
  return dateFormatter.format(date.toDate(getLocalTimeZone()));
}

function ScheduleForm({ onSchedule, close }: { onSchedule: (payment: Omit<ScheduledPayment, 'id' | 'status'>) => void; close: () => void }) {
  const [payee, setPayee] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState<DateValue | null>(null);
  const [frequency, setFrequency] = useState<Frequency | null>(null);

  const amountValue = Number(amount);
  const isValid = payee.trim().length > 0 && amount.trim().length > 0 && !Number.isNaN(amountValue) && amountValue > 0 && date != null && frequency != null;

  return (
    <form
      className={styles.form}
      onSubmit={(e) => {
        e.preventDefault();
        if (!isValid || date == null || frequency == null) return;
        onSchedule({ payee: payee.trim(), category: '', amount: amountValue, currency: 'USD', date, frequency });
        close();
      }}
    >
      <TextField label="Payee" placeholder="Who gets paid" value={payee} onChange={setPayee} isRequired autoFocus />
      <TextField label="Amount" description="In US dollars" inputMode="decimal" prefix="$" value={amount} onChange={setAmount} isRequired />
      <DatePicker label="Start date" minValue={today(getLocalTimeZone())} value={date} onChange={setDate} isRequired />
      <Select
        label="Repeats"
        placeholder="Choose how often"
        selectedKey={frequency}
        onSelectionChange={(key) => setFrequency(key as Frequency | null)}
        isRequired
      >
        {frequencies.map((f) => (
          <SelectItem key={f} id={f}>
            {f}
          </SelectItem>
        ))}
      </Select>
      <div className={styles.formFooter}>
        <Button variant="outline" onPress={close} type="button">
          Cancel
        </Button>
        <Button type="submit" isDisabled={!isValid}>
          Schedule payment
        </Button>
      </div>
    </form>
  );
}

function EditForm({ payment, onSave, close }: { payment: ScheduledPayment; onSave: (id: string, changes: Pick<ScheduledPayment, 'amount' | 'date' | 'frequency'>) => void; close: () => void }) {
  const [amount, setAmount] = useState(String(payment.amount));
  const [date, setDate] = useState<DateValue | null>(payment.date);
  const [frequency, setFrequency] = useState<Frequency | null>(payment.frequency);

  const amountValue = Number(amount);
  const isValid = amount.trim().length > 0 && !Number.isNaN(amountValue) && amountValue > 0 && date != null && frequency != null;

  return (
    <form
      className={styles.form}
      onSubmit={(e) => {
        e.preventDefault();
        if (!isValid || date == null || frequency == null) return;
        onSave(payment.id, { amount: amountValue, date, frequency });
        close();
      }}
    >
      <TextField label="Amount" description="In US dollars" inputMode="decimal" prefix="$" value={amount} onChange={setAmount} isRequired autoFocus />
      <DatePicker label="Date" minValue={today(getLocalTimeZone())} value={date} onChange={setDate} isRequired />
      <Select label="Repeats" selectedKey={frequency} onSelectionChange={(key) => setFrequency(key as Frequency | null)} isRequired>
        {frequencies.map((f) => (
          <SelectItem key={f} id={f}>
            {f}
          </SelectItem>
        ))}
      </Select>
      <div className={styles.formFooter}>
        <Button variant="outline" onPress={close} type="button">
          Cancel
        </Button>
        <Button type="submit" isDisabled={!isValid}>
          Save changes
        </Button>
      </div>
    </form>
  );
}

export default function Screen() {
  const [payments, setPayments] = useState<ScheduledPayment[]>(initialPayments);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const headingId = useId();

  const editingPayment = payments.find((p) => p.id === editingId) ?? null;
  const cancellingPayment = payments.find((p) => p.id === cancellingId) ?? null;

  function togglePause(payment: ScheduledPayment) {
    const willPause = payment.status === 'active';
    setPayments((prev) => prev.map((p) => (p.id === payment.id ? { ...p, status: willPause ? 'paused' : 'active' } : p)));
    toast({ title: willPause ? `Paused payment to ${payment.payee}` : `Resumed payment to ${payment.payee}`, tone: 'success' });
  }

  function saveEdit(id: string, changes: Pick<ScheduledPayment, 'amount' | 'date' | 'frequency'>) {
    setPayments((prev) => prev.map((p) => (p.id === id ? { ...p, ...changes } : p)));
    toast({ title: 'Payment updated', tone: 'success' });
  }

  function confirmCancel() {
    if (!cancellingPayment) return;
    const { payee } = cancellingPayment;
    setPayments((prev) => prev.filter((p) => p.id !== cancellingPayment.id));
    setCancellingId(null);
    toast({ title: `Cancelled payment to ${payee}`, tone: 'success' });
  }

  function schedulePayment(payment: Omit<ScheduledPayment, 'id' | 'status'>) {
    const id = `p${Date.now()}`;
    setPayments((prev) => [...prev, { ...payment, id, status: 'active' }].sort((a, b) => a.date.compare(b.date)));
    toast({ title: `Scheduled a payment to ${payment.payee}`, tone: 'success' });
  }

  return (
    <div className={styles.page}>
      <ToastRegion />
      <header className={styles.header}>
        <div>
          <Eyebrow>Payments</Eyebrow>
          <h1 className={styles.title} id={headingId}>
            Scheduled payments
          </h1>
          <p className={styles.subtitle}>Upcoming payments due to go out. Pause, edit or cancel any of them.</p>
        </div>
        <DialogTrigger>
          <Button>
            <IconPlus aria-hidden />
            Schedule a payment
          </Button>
          <Dialog title="Schedule a payment" description="Set up a new payment to repeat automatically.">
            {({ close }) => <ScheduleForm onSchedule={schedulePayment} close={close} />}
          </Dialog>
        </DialogTrigger>
      </header>

      {payments.length === 0 ? (
        <EmptyState
          icon={<IconWallet />}
          title="No scheduled payments"
          description="When you schedule a payment, it will appear here."
          action={
            <DialogTrigger>
              <Button>Schedule a payment</Button>
              <Dialog title="Schedule a payment" description="Set up a new payment to repeat automatically.">
                {({ close }) => <ScheduleForm onSchedule={schedulePayment} close={close} />}
              </Dialog>
            </DialogTrigger>
          }
        />
      ) : (
        <ul className={styles.list} aria-labelledby={headingId}>
          {payments.map((payment) => (
            <li key={payment.id}>
              <Card>
                <CardHeader>
                  <div className={styles.identity}>
                    <Avatar name={payment.payee} shape="square" alt="" />
                    <div>
                      <CardTitle level={2}>{payment.payee}</CardTitle>
                      {payment.category && <p className={styles.category}>{payment.category}</p>}
                    </div>
                  </div>
                  <CardAction>
                    <div className={styles.cardActions}>
                      <Badge tone={payment.status === 'paused' ? 'warning' : 'success'} variant="status">
                        {payment.status === 'paused' ? 'Paused' : 'Active'}
                      </Badge>
                      <MenuTrigger>
                        <Button size="icon" variant="ghost" aria-label={`Actions for payment to ${payment.payee}`}>
                          <IconDotsVertical aria-hidden />
                        </Button>
                        <Menu
                          onAction={(key) => {
                            if (key === 'edit') setEditingId(payment.id);
                            else if (key === 'toggle-pause') togglePause(payment);
                            else if (key === 'cancel') setCancellingId(payment.id);
                          }}
                        >
                          <MenuItem id="edit" icon={<IconPencil aria-hidden />}>
                            Edit
                          </MenuItem>
                          <MenuItem id="toggle-pause" icon={payment.status === 'paused' ? <IconPlayerPlay aria-hidden /> : <IconPlayerPause aria-hidden />}>
                            {payment.status === 'paused' ? 'Resume' : 'Pause'}
                          </MenuItem>
                          <MenuSeparator />
                          <MenuItem id="cancel" tone="danger" icon={<IconCircleX aria-hidden />}>
                            Cancel payment
                          </MenuItem>
                        </Menu>
                      </MenuTrigger>
                    </div>
                  </CardAction>
                </CardHeader>
                <CardContent className={styles.details}>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Amount</span>
                    <Amount value={payment.amount} currency={payment.currency} size="sm" />
                  </div>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Date</span>
                    <span className={styles.detailValue}>
                      <IconCalendarEvent aria-hidden className={styles.detailIcon} />
                      {formatDate(payment.date)}
                    </span>
                  </div>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Repeats</span>
                    <Tag>{payment.frequency}</Tag>
                  </div>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}

      <Dialog
        key={editingPayment?.id ?? 'edit-empty'}
        title={editingPayment ? `Edit payment to ${editingPayment.payee}` : 'Edit payment'}
        isOpen={editingPayment != null}
        onOpenChange={(open) => {
          if (!open) setEditingId(null);
        }}
      >
        {({ close }) => (editingPayment ? <EditForm payment={editingPayment} onSave={saveEdit} close={close} /> : null)}
      </Dialog>

      <AlertDialog
        key={cancellingPayment?.id ?? 'cancel-empty'}
        title={cancellingPayment ? `Cancel payment to ${cancellingPayment.payee}?` : 'Cancel payment?'}
        tone="danger"
        actionLabel="Cancel payment"
        cancelLabel="Keep payment"
        isOpen={cancellingPayment != null}
        onOpenChange={(open) => {
          if (!open) setCancellingId(null);
        }}
        onAction={confirmCancel}
      >
        This payment will stop repeating and can't be restored.
      </AlertDialog>
    </div>
  );
}

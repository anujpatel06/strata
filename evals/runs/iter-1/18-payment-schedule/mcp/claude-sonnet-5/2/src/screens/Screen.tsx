import { useState } from 'react';
import type { Key } from 'react';
import {
  AlertDialog,
  Amount,
  Avatar,
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Dialog,
  Eyebrow,
  Menu,
  MenuItem,
  MenuSeparator,
  MenuTrigger,
  Select,
  SelectItem,
  TextField,
  ToastRegion,
  toast,
} from '@strata/react';
import {
  IconCalendar,
  IconCircleX,
  IconDotsVertical,
  IconPencil,
  IconPlayerPause,
  IconPlayerPlay,
  IconPlus,
} from '@strata/icons';
import styles from './Screen.module.css';

type Frequency = 'weekly' | 'fortnightly' | 'monthly' | 'quarterly' | 'yearly';
type PaymentStatus = 'active' | 'paused' | 'cancelled';
type PayeeType = 'person' | 'business';

interface Payment {
  id: string;
  payee: string;
  payeeType: PayeeType;
  amount: number;
  currency: string;
  date: string;
  frequency: Frequency;
  status: PaymentStatus;
}

type PaymentDraft = Omit<Payment, 'id' | 'status'>;

const FREQUENCIES: { id: Frequency; label: string }[] = [
  { id: 'weekly', label: 'Weekly' },
  { id: 'fortnightly', label: 'Fortnightly' },
  { id: 'monthly', label: 'Monthly' },
  { id: 'quarterly', label: 'Quarterly' },
  { id: 'yearly', label: 'Yearly' },
];

const FREQUENCY_LABEL: Record<Frequency, string> = FREQUENCIES.reduce(
  (map, f) => ({ ...map, [f.id]: f.label }),
  {} as Record<Frequency, string>,
);

const initialPayments: Payment[] = [
  { id: 'p1', payee: 'Horizon Realty', payeeType: 'business', amount: 1450, currency: 'USD', date: '3 Oct 2026', frequency: 'monthly', status: 'active' },
  { id: 'p2', payee: 'Apex Fitness', payeeType: 'business', amount: 42, currency: 'USD', date: '5 Oct 2026', frequency: 'monthly', status: 'paused' },
  { id: 'p3', payee: 'Clearwater Insurance', payeeType: 'business', amount: 186.5, currency: 'USD', date: '14 Oct 2026', frequency: 'quarterly', status: 'active' },
  { id: 'p4', payee: 'Nimbus Cloud Storage', payeeType: 'business', amount: 12.99, currency: 'USD', date: '20 Oct 2026', frequency: 'monthly', status: 'active' },
  { id: 'p5', payee: 'Priya Raman', payeeType: 'person', amount: 300, currency: 'USD', date: '9 Oct 2026', frequency: 'weekly', status: 'active' },
  { id: 'p6', payee: 'State Tax Authority', payeeType: 'business', amount: 2100, currency: 'USD', date: '15 Apr 2027', frequency: 'yearly', status: 'active' },
];

function statusTone(status: PaymentStatus): 'success' | 'warning' | 'neutral' {
  if (status === 'paused') return 'warning';
  if (status === 'cancelled') return 'neutral';
  return 'success';
}

function statusLabel(status: PaymentStatus): string {
  if (status === 'paused') return 'Paused';
  if (status === 'cancelled') return 'Cancelled';
  return 'Active';
}

function PaymentFields({
  payee,
  onPayeeChange,
  amount,
  onAmountChange,
  date,
  onDateChange,
  frequency,
  onFrequencyChange,
}: {
  payee: string;
  onPayeeChange: (value: string) => void;
  amount: string;
  onAmountChange: (value: string) => void;
  date: string;
  onDateChange: (value: string) => void;
  frequency: Frequency;
  onFrequencyChange: (value: Frequency) => void;
}) {
  return (
    <>
      <TextField label="Payee" value={payee} onChange={onPayeeChange} isRequired autoFocus />
      <TextField label="Amount" prefix="$" suffix="USD" inputMode="decimal" value={amount} onChange={onAmountChange} isRequired />
      <TextField
        label="Next payment date"
        prefix={<IconCalendar aria-hidden />}
        value={date}
        onChange={onDateChange}
        description="For example, 12 Oct 2026."
        isRequired
      />
      <Select label="Repeats" selectedKey={frequency} onSelectionChange={(key) => onFrequencyChange(key as Frequency)}>
        {FREQUENCIES.map((f) => (
          <SelectItem key={f.id} id={f.id}>
            {f.label}
          </SelectItem>
        ))}
      </Select>
    </>
  );
}

function EditPaymentDialog({
  payment,
  onClose,
  onSave,
}: {
  payment: Payment;
  onClose: () => void;
  onSave: (id: string, updates: PaymentDraft) => void;
}) {
  const [payee, setPayee] = useState(payment.payee);
  const [amount, setAmount] = useState(String(payment.amount));
  const [date, setDate] = useState(payment.date);
  const [frequency, setFrequency] = useState<Frequency>(payment.frequency);

  const amountValue = Number(amount);
  const canSave = payee.trim() !== '' && amount.trim() !== '' && !Number.isNaN(amountValue) && amountValue > 0 && date.trim() !== '';

  return (
    <Dialog
      title={`Edit payment to ${payment.payee}`}
      description="Changes apply from the next scheduled date."
      isOpen
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      footer={
        <>
          <Button variant="outline" onPress={onClose}>
            Cancel
          </Button>
          <Button
            isDisabled={!canSave}
            onPress={() =>
              onSave(payment.id, {
                payee: payee.trim(),
                amount: amountValue,
                currency: payment.currency,
                date: date.trim(),
                frequency,
                payeeType: payment.payeeType,
              })
            }
          >
            Save changes
          </Button>
        </>
      }
    >
      <PaymentFields
        payee={payee}
        onPayeeChange={setPayee}
        amount={amount}
        onAmountChange={setAmount}
        date={date}
        onDateChange={setDate}
        frequency={frequency}
        onFrequencyChange={setFrequency}
      />
    </Dialog>
  );
}

function SchedulePaymentDialog({
  onClose,
  onSchedule,
}: {
  onClose: () => void;
  onSchedule: (draft: PaymentDraft) => void;
}) {
  const [payee, setPayee] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState('');
  const [frequency, setFrequency] = useState<Frequency>('monthly');

  const amountValue = Number(amount);
  const canSchedule = payee.trim() !== '' && amount.trim() !== '' && !Number.isNaN(amountValue) && amountValue > 0 && date.trim() !== '';

  return (
    <Dialog
      title="Schedule a payment"
      description="Set up a new payment that repeats automatically."
      isOpen
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      footer={
        <>
          <Button variant="outline" onPress={onClose}>
            Cancel
          </Button>
          <Button
            isDisabled={!canSchedule}
            onPress={() =>
              onSchedule({
                payee: payee.trim(),
                amount: amountValue,
                currency: 'USD',
                date: date.trim(),
                frequency,
                payeeType: 'business',
              })
            }
          >
            Schedule payment
          </Button>
        </>
      }
    >
      <PaymentFields
        payee={payee}
        onPayeeChange={setPayee}
        amount={amount}
        onAmountChange={setAmount}
        date={date}
        onDateChange={setDate}
        frequency={frequency}
        onFrequencyChange={setFrequency}
      />
    </Dialog>
  );
}

export default function Screen() {
  const [payments, setPayments] = useState<Payment[]>(initialPayments);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [cancelingId, setCancelingId] = useState<string | null>(null);
  const [isScheduling, setIsScheduling] = useState(false);

  const editingPayment = payments.find((p) => p.id === editingId) ?? null;
  const cancelingPayment = payments.find((p) => p.id === cancelingId) ?? null;
  const upcomingCount = payments.filter((p) => p.status !== 'cancelled').length;

  function togglePause(payment: Payment) {
    const nextStatus: PaymentStatus = payment.status === 'paused' ? 'active' : 'paused';
    setPayments((prev) => prev.map((p) => (p.id === payment.id ? { ...p, status: nextStatus } : p)));
    toast({
      title: nextStatus === 'paused' ? `Paused payment to ${payment.payee}` : `Resumed payment to ${payment.payee}`,
      tone: 'success',
    });
  }

  function saveEdit(id: string, updates: PaymentDraft) {
    setPayments((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates } : p)));
    toast({ title: `Updated payment to ${updates.payee}`, tone: 'success' });
    setEditingId(null);
  }

  function confirmCancel() {
    if (!cancelingPayment) return;
    setPayments((prev) => prev.map((p) => (p.id === cancelingPayment.id ? { ...p, status: 'cancelled' } : p)));
    toast({ title: `Cancelled payment to ${cancelingPayment.payee}`, tone: 'neutral' });
  }

  function scheduleNew(draft: PaymentDraft) {
    const id = `payment-${Date.now()}`;
    setPayments((prev) => [...prev, { ...draft, id, status: 'active' }]);
    toast({ title: `Scheduled payment to ${draft.payee}`, tone: 'success' });
    setIsScheduling(false);
  }

  function handleMenuAction(key: Key, payment: Payment) {
    if (key === 'toggle') togglePause(payment);
    else if (key === 'edit') setEditingId(payment.id);
    else if (key === 'cancel') setCancelingId(payment.id);
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <Eyebrow>Payments</Eyebrow>
          <h1 className={styles.title}>Scheduled payments</h1>
          <p className={styles.subtitle}>Automatic payments leaving your account, and how often they repeat.</p>
        </div>
        <Button onPress={() => setIsScheduling(true)}>
          <IconPlus aria-hidden />
          Schedule a payment
        </Button>
      </header>

      <Card>
        <CardHeader divider>
          <CardTitle level={2}>Upcoming</CardTitle>
          <CardDescription>{upcomingCount} payments upcoming</CardDescription>
        </CardHeader>
        <CardContent variant="inset">
          <ul className={styles.list}>
            {payments.map((payment) => {
              const isCancelled = payment.status === 'cancelled';
              return (
                <li key={payment.id} className={styles.row}>
                  <div className={styles.rowMain}>
                    <Avatar name={payment.payee} shape={payment.payeeType === 'business' ? 'square' : 'circle'} />
                    <div className={styles.payeeCol}>
                      <span className={styles.payeeName}>{payment.payee}</span>
                      <span className={styles.meta}>Repeats {FREQUENCY_LABEL[payment.frequency].toLowerCase()}</span>
                    </div>
                  </div>
                  <div className={styles.rowMeta}>
                    <span className={styles.date}>{payment.date}</span>
                    <Amount value={payment.amount} currency={payment.currency} size="sm" />
                    <Badge variant="status" tone={statusTone(payment.status)}>
                      {statusLabel(payment.status)}
                    </Badge>
                  </div>
                  <div className={styles.actions}>
                    {!isCancelled && (
                      <MenuTrigger>
                        <Button variant="outline" size="icon" aria-label={`Actions for payment to ${payment.payee}`}>
                          <IconDotsVertical aria-hidden />
                        </Button>
                        <Menu onAction={(key) => handleMenuAction(key, payment)}>
                          <MenuItem id="toggle" icon={payment.status === 'paused' ? <IconPlayerPlay aria-hidden /> : <IconPlayerPause aria-hidden />}>
                            {payment.status === 'paused' ? 'Resume payment' : 'Pause payment'}
                          </MenuItem>
                          <MenuItem id="edit" icon={<IconPencil aria-hidden />}>
                            Edit details
                          </MenuItem>
                          <MenuSeparator />
                          <MenuItem id="cancel" icon={<IconCircleX aria-hidden />} tone="danger">
                            Cancel payment
                          </MenuItem>
                        </Menu>
                      </MenuTrigger>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </CardContent>
      </Card>

      {editingPayment && <EditPaymentDialog key={editingPayment.id} payment={editingPayment} onClose={() => setEditingId(null)} onSave={saveEdit} />}

      {cancelingPayment && (
        <AlertDialog
          title={`Cancel payment to ${cancelingPayment.payee}?`}
          actionLabel="Cancel payment"
          cancelLabel="Keep payment"
          tone="danger"
          isOpen
          onOpenChange={(open) => {
            if (!open) setCancelingId(null);
          }}
          onAction={confirmCancel}
        >
          This stops all future payments to {cancelingPayment.payee}. Cancelled payments can’t be restored.
        </AlertDialog>
      )}

      {isScheduling && <SchedulePaymentDialog onClose={() => setIsScheduling(false)} onSchedule={scheduleNew} />}

      <ToastRegion />
    </div>
  );
}

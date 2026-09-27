import { useState } from 'react';
import type { Icon } from '@strata/icons';
import {
  IconBolt,
  IconCreditCard,
  IconDotsVertical,
  IconDumbbell,
  IconHome,
  IconPencil,
  IconPlayerPause,
  IconPlayerPlay,
  IconPlus,
  IconRefresh,
  IconShieldCheck,
  IconTrash,
  IconWifi,
} from '@strata/icons';
import {
  AlertDialog,
  Amount,
  Badge,
  Button,
  Card,
  CardContent,
  Dialog,
  DatePicker,
  Eyebrow,
  IconTile,
  Menu,
  MenuItem,
  MenuSeparator,
  MenuTrigger,
  Select,
  SelectItem,
  Separator,
  TextField,
  ToastRegion,
  toast,
} from '@strata/react';
import { useLocale } from 'react-aria-components';
import { type CalendarDate, getLocalTimeZone, parseDate, today } from '@internationalized/date';
import styles from './Screen.module.css';

type Frequency = 'Weekly' | 'Monthly' | 'Quarterly' | 'Yearly';
type PaymentStatus = 'active' | 'paused' | 'cancelled';

interface ScheduledPayment {
  id: string;
  payee: string;
  icon: Icon;
  amount: number;
  currency: string;
  /** ISO date, e.g. "2026-10-01". */
  date: string;
  frequency: Frequency;
  status: PaymentStatus;
}

const initialPayments: ScheduledPayment[] = [
  {
    id: 'p1',
    payee: 'Greenview Apartments',
    icon: IconHome,
    amount: 45000,
    currency: 'INR',
    date: '2026-10-01',
    frequency: 'Monthly',
    status: 'active',
  },
  {
    id: 'p2',
    payee: 'Skyline Broadband',
    icon: IconWifi,
    amount: 1499,
    currency: 'INR',
    date: '2026-10-04',
    frequency: 'Monthly',
    status: 'active',
  },
  {
    id: 'p3',
    payee: 'Prime Fitness Club',
    icon: IconDumbbell,
    amount: 2200,
    currency: 'INR',
    date: '2026-10-06',
    frequency: 'Monthly',
    status: 'active',
  },
  {
    id: 'p4',
    payee: 'Aarav Mehta',
    icon: IconCreditCard,
    amount: 8000,
    currency: 'INR',
    date: '2026-10-10',
    frequency: 'Monthly',
    status: 'paused',
  },
  {
    id: 'p5',
    payee: 'Zenith Life Insurance',
    icon: IconShieldCheck,
    amount: 12750,
    currency: 'INR',
    date: '2026-10-15',
    frequency: 'Quarterly',
    status: 'active',
  },
  {
    id: 'p6',
    payee: 'CityLight Power Co.',
    icon: IconBolt,
    amount: 3180,
    currency: 'INR',
    date: '2026-10-18',
    frequency: 'Monthly',
    status: 'active',
  },
];

const frequencies: Frequency[] = ['Weekly', 'Monthly', 'Quarterly', 'Yearly'];

function formatDate(iso: string, locale: string): string {
  const [year, month, day] = iso.split('-').map(Number);
  return new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short', year: 'numeric' }).format(
    new Date(year, month - 1, day),
  );
}

type FormTarget = 'new' | ScheduledPayment | null;

interface FormValues {
  payee: string;
  amount: number;
  date: string;
  frequency: Frequency;
}

export default function Screen() {
  const { locale } = useLocale();
  const [payments, setPayments] = useState<ScheduledPayment[]>(initialPayments);
  const [formTarget, setFormTarget] = useState<FormTarget>(null);
  const [cancelTarget, setCancelTarget] = useState<ScheduledPayment | null>(null);

  function handleTogglePause(payment: ScheduledPayment) {
    const nextStatus: PaymentStatus = payment.status === 'paused' ? 'active' : 'paused';
    setPayments((prev) => prev.map((p) => (p.id === payment.id ? { ...p, status: nextStatus } : p)));
    toast({
      title: nextStatus === 'paused' ? 'Payment paused' : 'Payment resumed',
      description: payment.payee,
    });
  }

  function handleCancelConfirm() {
    if (!cancelTarget) return;
    setPayments((prev) => prev.map((p) => (p.id === cancelTarget.id ? { ...p, status: 'cancelled' } : p)));
    toast({ title: 'Payment cancelled', description: `${cancelTarget.payee} won't be charged again.` });
    setCancelTarget(null);
  }

  function handleFormSubmit(values: FormValues) {
    if (formTarget === 'new') {
      setPayments((prev) => [
        ...prev,
        { id: crypto.randomUUID(), status: 'active', currency: 'INR', icon: IconCreditCard, ...values },
      ]);
      toast({ title: 'Payment scheduled', description: values.payee });
    } else if (formTarget) {
      const id = formTarget.id;
      setPayments((prev) => prev.map((p) => (p.id === id ? { ...p, ...values } : p)));
      toast({ title: 'Payment updated', description: values.payee });
    }
    setFormTarget(null);
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <Eyebrow>Payments</Eyebrow>
          <h1 className={styles.title}>Scheduled payments</h1>
          <p className={styles.subtitle}>Payments set to repeat automatically. Pause, edit or cancel any of them.</p>
        </div>
        <Button variant="primary" onPress={() => setFormTarget('new')}>
          <IconPlus /> Schedule a payment
        </Button>
      </header>

      <Card>
        <CardContent variant="inset" className={styles.list}>
          {payments.map((payment, index) => (
            <div key={payment.id}>
              {index > 0 && <Separator />}
              <PaymentRow
                payment={payment}
                locale={locale}
                onTogglePause={() => handleTogglePause(payment)}
                onEdit={() => setFormTarget(payment)}
                onCancel={() => setCancelTarget(payment)}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      <PaymentFormDialog
        key={formTarget === null ? 'closed' : formTarget === 'new' ? 'new' : formTarget.id}
        target={formTarget}
        onClose={() => setFormTarget(null)}
        onSubmit={handleFormSubmit}
      />

      <AlertDialog
        isOpen={cancelTarget != null}
        onOpenChange={(open) => {
          if (!open) setCancelTarget(null);
        }}
        title="Cancel this payment?"
        tone="danger"
        actionLabel="Cancel payment"
        cancelLabel="Keep payment"
        onAction={handleCancelConfirm}
      >
        {cancelTarget && (
          <>
            {cancelTarget.payee} won't be charged again. This can't be undone — you'll need to schedule it from
            scratch if you change your mind.
          </>
        )}
      </AlertDialog>

      <ToastRegion />
    </div>
  );
}

interface PaymentRowProps {
  payment: ScheduledPayment;
  locale: string;
  onTogglePause: () => void;
  onEdit: () => void;
  onCancel: () => void;
}

function PaymentRow({ payment, locale, onTogglePause, onEdit, onCancel }: PaymentRowProps) {
  const isCancelled = payment.status === 'cancelled';
  const isPaused = payment.status === 'paused';
  const PayeeIcon = payment.icon;

  return (
    <div className={styles.row} data-cancelled={isCancelled || undefined}>
      <IconTile tint={isCancelled ? 'none' : 'brand'} size="md">
        <PayeeIcon />
      </IconTile>
      <div className={styles.details}>
        <span className={styles.payee}>{payment.payee}</span>
        <span className={styles.meta}>
          <IconRefresh size={14} />
          {payment.frequency} · {formatDate(payment.date, locale)}
        </span>
      </div>
      <div className={styles.amountCol}>
        <Amount value={payment.amount} currency={payment.currency} size="sm" />
        {isPaused && (
          <Badge tone="warning" variant="soft">
            Paused
          </Badge>
        )}
        {isCancelled && (
          <Badge tone="neutral" variant="soft">
            Cancelled
          </Badge>
        )}
      </div>
      {!isCancelled && (
        <MenuTrigger>
          <Button size="icon" variant="ghost" aria-label={`Actions for ${payment.payee}`}>
            <IconDotsVertical />
          </Button>
          <Menu>
            <MenuItem
              id="toggle-pause"
              icon={isPaused ? <IconPlayerPlay /> : <IconPlayerPause />}
              onAction={onTogglePause}
            >
              {isPaused ? 'Resume payment' : 'Pause payment'}
            </MenuItem>
            <MenuItem id="edit" icon={<IconPencil />} onAction={onEdit}>
              Edit payment
            </MenuItem>
            <MenuSeparator />
            <MenuItem id="cancel" icon={<IconTrash />} tone="danger" onAction={onCancel}>
              Cancel payment
            </MenuItem>
          </Menu>
        </MenuTrigger>
      )}
    </div>
  );
}

interface PaymentFormDialogProps {
  target: FormTarget;
  onClose: () => void;
  onSubmit: (values: FormValues) => void;
}

function PaymentFormDialog({ target, onClose, onSubmit }: PaymentFormDialogProps) {
  const isEdit = target !== null && target !== 'new';
  const initial = isEdit ? target : null;

  const [payee, setPayee] = useState(initial?.payee ?? '');
  const [amount, setAmount] = useState(initial ? String(initial.amount) : '');
  const [date, setDate] = useState<CalendarDate>(initial ? parseDate(initial.date) : today(getLocalTimeZone()));
  const [frequency, setFrequency] = useState<Frequency>(initial?.frequency ?? 'Monthly');

  const amountValue = Number(amount);
  const isValid = payee.trim().length > 0 && amount.trim().length > 0 && Number.isFinite(amountValue) && amountValue > 0;

  function handleSave() {
    if (!isValid) return;
    onSubmit({ payee: payee.trim(), amount: amountValue, date: date.toString(), frequency });
  }

  return (
    <Dialog
      isOpen={target !== null}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      title={isEdit ? 'Edit payment' : 'Schedule a payment'}
      description={
        isEdit ? "Update the amount, date or how often it repeats." : 'Set up a payment to repeat automatically.'
      }
      size="sm"
      footer={
        <>
          <Button variant="outline" onPress={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onPress={handleSave} isDisabled={!isValid}>
            {isEdit ? 'Save changes' : 'Schedule payment'}
          </Button>
        </>
      }
    >
      <div className={styles.form}>
        <TextField label="Payee" value={payee} onChange={setPayee} placeholder="e.g. Greenview Apartments" />
        <TextField label="Amount" value={amount} onChange={setAmount} prefix="₹" inputMode="decimal" placeholder="0" />
        <DatePicker label="Next payment date" value={date} onChange={(value) => value && setDate(value)} />
        <Select
          label="Repeats"
          selectedKey={frequency}
          onSelectionChange={(key) => setFrequency(key as Frequency)}
        >
          {frequencies.map((option) => (
            <SelectItem key={option} id={option}>
              {option}
            </SelectItem>
          ))}
        </Select>
      </div>
    </Dialog>
  );
}

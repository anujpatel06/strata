import { useRef, useState } from 'react';
import { useLocale } from 'react-aria-components';
import {
  AlertDialog,
  Amount,
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Dialog,
  EmptyState,
  IconTile,
  Menu,
  MenuItem,
  MenuSeparator,
  MenuTrigger,
  Select,
  SelectItem,
  Tag,
  TextField,
  toast,
  ToastRegion,
} from '@strata/react';
import {
  IconCalendar,
  IconCar,
  IconCloudUpload,
  IconDotsVertical,
  IconDumbbell,
  IconHome,
  IconPencil,
  IconPlayerPause,
  IconPlayerPlay,
  IconPlus,
  IconRefresh,
  IconShieldCheck,
  IconWallet,
  IconWifi,
  IconX,
  type Icon,
} from '@strata/icons';
import styles from './Screen.module.css';

type Frequency = 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'yearly';
type PaymentStatus = 'active' | 'paused';

interface ScheduledPayment {
  id: string;
  payee: string;
  category: string;
  icon: Icon;
  amount: number;
  currency: string;
  date: string;
  frequency: Frequency;
  status: PaymentStatus;
}

const FREQUENCIES: Frequency[] = ['weekly', 'biweekly', 'monthly', 'quarterly', 'yearly'];

const FREQUENCY_LABEL: Record<Frequency, string> = {
  weekly: 'Every week',
  biweekly: 'Every 2 weeks',
  monthly: 'Every month',
  quarterly: 'Every 3 months',
  yearly: 'Every year',
};

const INITIAL_PAYMENTS: ScheduledPayment[] = [
  {
    id: 'payment-1',
    payee: 'Meridian Property Group',
    category: 'Rent',
    icon: IconHome,
    amount: 68000,
    currency: 'INR',
    date: '2026-10-01',
    frequency: 'monthly',
    status: 'active',
  },
  {
    id: 'payment-2',
    payee: 'Bright Fibre Broadband',
    category: 'Internet',
    icon: IconWifi,
    amount: 1499,
    currency: 'INR',
    date: '2026-10-03',
    frequency: 'monthly',
    status: 'active',
  },
  {
    id: 'payment-3',
    payee: 'Apex Auto Finance',
    category: 'Car loan EMI',
    icon: IconCar,
    amount: 12400,
    currency: 'INR',
    date: '2026-10-05',
    frequency: 'biweekly',
    status: 'active',
  },
  {
    id: 'payment-4',
    payee: 'Lena Fitness Studio',
    category: 'Membership',
    icon: IconDumbbell,
    amount: 1200,
    currency: 'INR',
    date: '2026-10-06',
    frequency: 'weekly',
    status: 'paused',
  },
  {
    id: 'payment-5',
    payee: 'Horizon Health Insurance',
    category: 'Premium',
    icon: IconShieldCheck,
    amount: 3200,
    currency: 'INR',
    date: '2026-10-12',
    frequency: 'quarterly',
    status: 'active',
  },
  {
    id: 'payment-6',
    payee: 'Zenith Cloud Storage',
    category: 'Subscription',
    icon: IconCloudUpload,
    amount: 799,
    currency: 'INR',
    date: '2027-01-15',
    frequency: 'yearly',
    status: 'active',
  },
];

export default function Screen() {
  const { locale } = useLocale();
  const [payments, setPayments] = useState<ScheduledPayment[]>(INITIAL_PAYMENTS);
  const nextId = useRef(INITIAL_PAYMENTS.length + 1);

  const [editing, setEditing] = useState<ScheduledPayment | null>(null);
  const [editAmount, setEditAmount] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editFrequency, setEditFrequency] = useState<Frequency>('monthly');

  const [cancelling, setCancelling] = useState<ScheduledPayment | null>(null);

  const [isScheduleOpen, setScheduleOpen] = useState(false);
  const [newPayee, setNewPayee] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [newDate, setNewDate] = useState('');
  const [newFrequency, setNewFrequency] = useState<Frequency>('monthly');

  const formatDate = (iso: string) =>
    new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short', year: 'numeric' }).format(
      new Date(`${iso}T00:00:00`),
    );

  const formatAmount = (value: number, currency: string) =>
    new Intl.NumberFormat(locale, { style: 'currency', currency, maximumFractionDigits: 0 }).format(value);

  const openSchedule = () => {
    setNewPayee('');
    setNewAmount('');
    setNewDate('');
    setNewFrequency('monthly');
    setScheduleOpen(true);
  };

  const togglePause = (id: string) => {
    setPayments((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status: p.status === 'paused' ? 'active' : 'paused' } : p)),
    );
    const target = payments.find((p) => p.id === id);
    if (target) {
      toast({
        title: target.status === 'paused' ? 'Payment resumed' : 'Payment paused',
        description: target.payee,
        tone: 'neutral',
      });
    }
  };

  const openEdit = (payment: ScheduledPayment) => {
    setEditing(payment);
    setEditAmount(String(payment.amount));
    setEditDate(payment.date);
    setEditFrequency(payment.frequency);
  };

  const isEditValid = Number(editAmount) > 0 && editDate.trim().length > 0;

  const handleSaveEdit = (close: () => void) => {
    if (!editing || !isEditValid) return;
    setPayments((prev) =>
      prev.map((p) =>
        p.id === editing.id ? { ...p, amount: Number(editAmount), date: editDate, frequency: editFrequency } : p,
      ),
    );
    toast({ title: 'Payment updated', description: editing.payee, tone: 'success' });
    close();
  };

  const openCancel = (payment: ScheduledPayment) => setCancelling(payment);

  const handleConfirmCancel = () => {
    if (!cancelling) return;
    setPayments((prev) => prev.filter((p) => p.id !== cancelling.id));
    toast({ title: 'Payment cancelled', description: `${cancelling.payee} won't be charged again.`, tone: 'neutral' });
  };

  const isScheduleValid = newPayee.trim().length > 0 && Number(newAmount) > 0 && newDate.trim().length > 0;

  const handleSchedule = (close: () => void) => {
    if (!isScheduleValid) return;
    const payment: ScheduledPayment = {
      id: `payment-${nextId.current++}`,
      payee: newPayee.trim(),
      category: 'Scheduled payment',
      icon: IconWallet,
      amount: Number(newAmount),
      currency: 'INR',
      date: newDate,
      frequency: newFrequency,
      status: 'active',
    };
    setPayments((prev) => [...prev, payment].sort((a, b) => a.date.localeCompare(b.date)));
    toast({ title: 'Payment scheduled', description: payment.payee, tone: 'success' });
    close();
  };

  return (
    <div className={styles.screen}>
      <ToastRegion placement="top-end" />

      <div className={styles.header}>
        <div className={styles.headerText}>
          <h1 className={styles.title}>Scheduled payments</h1>
          <p className={styles.subtitle}>Payments that repeat automatically from your linked account.</p>
        </div>
        <Button variant="primary" onPress={openSchedule}>
          <IconPlus /> Schedule a payment
        </Button>
      </div>

      <Card>
        <CardHeader divider>
          <CardTitle level={2}>Upcoming</CardTitle>
          <CardDescription>
            {payments.length} payment{payments.length === 1 ? '' : 's'} scheduled
          </CardDescription>
        </CardHeader>
        <CardContent>
          {payments.length === 0 ? (
            <EmptyState
              size="sm"
              icon={<IconCalendar />}
              title="No scheduled payments"
              description="Set up a payment once and it repeats automatically."
              action={
                <Button variant="primary" onPress={openSchedule}>
                  <IconPlus /> Schedule a payment
                </Button>
              }
            />
          ) : (
            <ul className={styles.list}>
              {payments.map((payment) => {
                const PayeeIcon = payment.icon;
                const isPaused = payment.status === 'paused';
                return (
                  <li key={payment.id} className={isPaused ? `${styles.row} ${styles.rowPaused}` : styles.row}>
                    <IconTile tint="auto" name={payment.payee} size="md">
                      <PayeeIcon />
                    </IconTile>
                    <div className={styles.payee}>
                      <span className={styles.payeeName}>{payment.payee}</span>
                      <span className={styles.category}>{payment.category}</span>
                      <div className={styles.payeeMeta}>
                        <Tag size="sm" leading={<IconRefresh />}>
                          {FREQUENCY_LABEL[payment.frequency]}
                        </Tag>
                        {isPaused && (
                          <Badge tone="warning" size="sm" dot>
                            Paused
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className={styles.amountCol}>
                      <Amount value={payment.amount} currency={payment.currency} size="sm" />
                      <span className={styles.dateText}>{formatDate(payment.date)}</span>
                    </div>
                    <MenuTrigger>
                      <Button variant="ghost" size="icon" aria-label={`More actions for ${payment.payee}`}>
                        <IconDotsVertical />
                      </Button>
                      <Menu
                        onAction={(key) => {
                          if (key === 'toggle') togglePause(payment.id);
                          else if (key === 'edit') openEdit(payment);
                          else if (key === 'cancel') openCancel(payment);
                        }}
                      >
                        <MenuItem id="toggle" icon={isPaused ? <IconPlayerPlay /> : <IconPlayerPause />}>
                          {isPaused ? 'Resume payment' : 'Pause payment'}
                        </MenuItem>
                        <MenuItem id="edit" icon={<IconPencil />}>
                          Edit payment
                        </MenuItem>
                        <MenuSeparator />
                        <MenuItem id="cancel" tone="danger" icon={<IconX />}>
                          Cancel payment
                        </MenuItem>
                      </Menu>
                    </MenuTrigger>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      <Dialog
        isOpen={!!editing}
        onOpenChange={(open) => { if (!open) setEditing(null); }}
        title={editing ? `Edit ${editing.payee}` : 'Edit payment'}
        description="Update the amount, date or how often it repeats."
        size="sm"
        footer={({ close }) => (
          <>
            <Button variant="outline" onPress={close}>
              Cancel
            </Button>
            <Button variant="primary" onPress={() => handleSaveEdit(close)} isDisabled={!isEditValid}>
              Save changes
            </Button>
          </>
        )}
      >
        <div className={styles.form}>
          <TextField label="Amount" prefix="₹" inputMode="decimal" value={editAmount} onChange={setEditAmount} />
          <TextField label="Next payment date" type="date" value={editDate} onChange={setEditDate} />
          <Select
            label="Repeats"
            selectedKey={editFrequency}
            onSelectionChange={(key) => setEditFrequency(key as Frequency)}
          >
            {FREQUENCIES.map((frequency) => (
              <SelectItem key={frequency} id={frequency}>
                {FREQUENCY_LABEL[frequency]}
              </SelectItem>
            ))}
          </Select>
        </div>
      </Dialog>

      <Dialog
        isOpen={isScheduleOpen}
        onOpenChange={setScheduleOpen}
        title="Schedule a payment"
        description="Set up a payment that repeats automatically."
        size="sm"
        footer={({ close }) => (
          <>
            <Button variant="outline" onPress={close}>
              Cancel
            </Button>
            <Button variant="primary" onPress={() => handleSchedule(close)} isDisabled={!isScheduleValid}>
              Schedule payment
            </Button>
          </>
        )}
      >
        <div className={styles.form}>
          <TextField label="Payee" placeholder="e.g. Meridian Property Group" value={newPayee} onChange={setNewPayee} />
          <TextField label="Amount" prefix="₹" inputMode="decimal" value={newAmount} onChange={setNewAmount} />
          <TextField label="First payment date" type="date" value={newDate} onChange={setNewDate} />
          <Select
            label="Repeats"
            selectedKey={newFrequency}
            onSelectionChange={(key) => setNewFrequency(key as Frequency)}
          >
            {FREQUENCIES.map((frequency) => (
              <SelectItem key={frequency} id={frequency}>
                {FREQUENCY_LABEL[frequency]}
              </SelectItem>
            ))}
          </Select>
        </div>
      </Dialog>

      <AlertDialog
        isOpen={!!cancelling}
        onOpenChange={(open) => { if (!open) setCancelling(null); }}
        title="Cancel this payment?"
        actionLabel="Cancel payment"
        cancelLabel="Keep payment"
        tone="danger"
        onAction={handleConfirmCancel}
      >
        {cancelling
          ? `${cancelling.payee} won't be charged ${formatAmount(cancelling.amount, cancelling.currency)} again. This can't be undone.`
          : ''}
      </AlertDialog>
    </div>
  );
}

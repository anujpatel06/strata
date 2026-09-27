import { useEffect, useRef, useState, type Key, type ReactNode } from 'react';
import {
  AlertDialog,
  Amount,
  Badge,
  Button,
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Dialog,
  DialogTrigger,
  EmptyState,
  Label,
  Menu,
  MenuItem,
  MenuSeparator,
  MenuTrigger,
  Select,
  SelectItem,
  Tag,
  TextField,
  ToastRegion,
  IconTile,
  toast,
} from '@strata/react';
import {
  IconBolt,
  IconBuildingBank,
  IconCalendar,
  IconDotsVertical,
  IconHeartPulse,
  IconHome,
  IconMusic,
  IconPencil,
  IconPlayerPause,
  IconPlayerPlay,
  IconPlus,
  IconRefresh,
  IconWallet,
  IconX,
} from '@strata/icons';
import styles from './Screen.module.css';

type Category = 'housing' | 'utilities' | 'subscription' | 'insurance' | 'loan' | 'other';
type Frequency = 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'yearly';
type PaymentStatus = 'active' | 'paused' | 'cancelled';

interface Payment {
  id: string;
  payee: string;
  category: Category;
  amount: number;
  currency: string;
  /** ISO date (yyyy-mm-dd) of the next occurrence. */
  date: string;
  frequency: Frequency;
  status: PaymentStatus;
}

const initialPayments: Payment[] = [
  {
    id: 'p1',
    payee: 'Meridian Housing Co-op',
    category: 'housing',
    amount: 42500,
    currency: 'INR',
    date: '2026-10-01',
    frequency: 'monthly',
    status: 'active',
  },
  {
    id: 'p2',
    payee: 'Volt & Ray Electric',
    category: 'utilities',
    amount: 3200,
    currency: 'INR',
    date: '2026-10-04',
    frequency: 'monthly',
    status: 'active',
  },
  {
    id: 'p3',
    payee: 'Northbeam Broadband',
    category: 'utilities',
    amount: 1499,
    currency: 'INR',
    date: '2026-10-06',
    frequency: 'monthly',
    status: 'paused',
  },
  {
    id: 'p4',
    payee: 'Cadence Music+',
    category: 'subscription',
    amount: 1499,
    currency: 'INR',
    date: '2026-10-09',
    frequency: 'yearly',
    status: 'active',
  },
  {
    id: 'p5',
    payee: 'Harborview Insurance',
    category: 'insurance',
    amount: 8600,
    currency: 'INR',
    date: '2026-10-14',
    frequency: 'quarterly',
    status: 'active',
  },
  {
    id: 'p6',
    payee: 'Silverline Auto Loan',
    category: 'loan',
    amount: 15750,
    currency: 'INR',
    date: '2026-10-18',
    frequency: 'biweekly',
    status: 'active',
  },
];

const categoryOptions: { id: Category; label: string; icon: typeof IconHome }[] = [
  { id: 'housing', label: 'Housing', icon: IconHome },
  { id: 'utilities', label: 'Utilities', icon: IconBolt },
  { id: 'subscription', label: 'Subscription', icon: IconMusic },
  { id: 'insurance', label: 'Insurance', icon: IconHeartPulse },
  { id: 'loan', label: 'Loan', icon: IconBuildingBank },
  { id: 'other', label: 'Other', icon: IconWallet },
];

const categoryIcons: Record<Category, typeof IconHome> = {
  housing: IconHome,
  utilities: IconBolt,
  subscription: IconMusic,
  insurance: IconHeartPulse,
  loan: IconBuildingBank,
  other: IconWallet,
};

const frequencyOptions: { id: Frequency; label: string }[] = [
  { id: 'weekly', label: 'Every week' },
  { id: 'biweekly', label: 'Every 2 weeks' },
  { id: 'monthly', label: 'Every month' },
  { id: 'quarterly', label: 'Every 3 months' },
  { id: 'yearly', label: 'Every year' },
];

const frequencyLabels: Record<Frequency, string> = {
  weekly: 'Every week',
  biweekly: 'Every 2 weeks',
  monthly: 'Every month',
  quarterly: 'Every 3 months',
  yearly: 'Every year',
};

const statusTone: Record<PaymentStatus, 'success' | 'warning' | 'neutral'> = {
  active: 'success',
  paused: 'warning',
  cancelled: 'neutral',
};

const statusLabel: Record<PaymentStatus, string> = {
  active: 'Active',
  paused: 'Paused',
  cancelled: 'Cancelled',
};

function formatDate(iso: string, locale: string): string {
  const date = new Date(`${iso}T00:00:00`);
  return new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short', year: 'numeric' }).format(date);
}

function makeId(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `p${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

interface PaymentFormValues {
  payee: string;
  amount: string;
  date: string;
  category: Category;
  frequency: Frequency;
}

function isFormValid(values: PaymentFormValues): boolean {
  const amount = Number(values.amount);
  return values.payee.trim().length > 0 && values.date.trim().length > 0 && amount > 0;
}

function ScheduleForm({ onCancel, onSubmit }: { onCancel: () => void; onSubmit: (payment: Payment) => void }) {
  const [values, setValues] = useState<PaymentFormValues>({
    payee: '',
    amount: '',
    date: '',
    category: 'other',
    frequency: 'monthly',
  });

  const valid = isFormValid(values);

  function submit() {
    if (!valid) return;
    onSubmit({
      id: makeId(),
      payee: values.payee.trim(),
      category: values.category,
      amount: Number(values.amount),
      currency: 'INR',
      date: values.date,
      frequency: values.frequency,
      status: 'active',
    });
  }

  return (
    <div className={styles.form}>
      <TextField
        label="Payee"
        placeholder="e.g. Meridian Housing Co-op"
        value={values.payee}
        onChange={(payee) => setValues((v) => ({ ...v, payee }))}
        isRequired
      />
      <TextField
        label="Amount"
        prefix="₹"
        inputMode="decimal"
        placeholder="0"
        value={values.amount}
        onChange={(amount) => setValues((v) => ({ ...v, amount }))}
        isRequired
      />
      <div className={styles.field}>
        <Label htmlFor="schedule-date" isRequired>
          Start date
        </Label>
        <input
          id="schedule-date"
          type="date"
          className={styles.dateInput}
          value={values.date}
          onChange={(event) => setValues((v) => ({ ...v, date: event.target.value }))}
          required
        />
      </div>
      <Select
        label="Category"
        selectedKey={values.category}
        onSelectionChange={(key: Key) => setValues((v) => ({ ...v, category: key as Category }))}
      >
        {categoryOptions.map((option) => (
          <SelectItem key={option.id} id={option.id} icon={<option.icon />}>
            {option.label}
          </SelectItem>
        ))}
      </Select>
      <Select
        label="How often"
        selectedKey={values.frequency}
        onSelectionChange={(key: Key) => setValues((v) => ({ ...v, frequency: key as Frequency }))}
      >
        {frequencyOptions.map((option) => (
          <SelectItem key={option.id} id={option.id}>
            {option.label}
          </SelectItem>
        ))}
      </Select>
      <div className={styles.formActions}>
        <Button variant="outline" onPress={onCancel}>
          Cancel
        </Button>
        <Button variant="primary" onPress={submit} isDisabled={!valid}>
          Schedule payment
        </Button>
      </div>
    </div>
  );
}

function EditForm({
  payment,
  onCancel,
  onSave,
}: {
  payment: Payment;
  onCancel: () => void;
  onSave: (payment: Payment) => void;
}) {
  const [values, setValues] = useState<PaymentFormValues>({
    payee: payment.payee,
    amount: String(payment.amount),
    date: payment.date,
    category: payment.category,
    frequency: payment.frequency,
  });

  const valid = isFormValid(values);

  function submit() {
    if (!valid) return;
    onSave({
      ...payment,
      payee: values.payee.trim(),
      amount: Number(values.amount),
      date: values.date,
      frequency: values.frequency,
    });
  }

  return (
    <div className={styles.form}>
      <TextField
        label="Payee"
        value={values.payee}
        onChange={(payee) => setValues((v) => ({ ...v, payee }))}
        isRequired
      />
      <TextField
        label="Amount"
        prefix="₹"
        inputMode="decimal"
        value={values.amount}
        onChange={(amount) => setValues((v) => ({ ...v, amount }))}
        isRequired
      />
      <div className={styles.field}>
        <Label htmlFor={`edit-date-${payment.id}`} isRequired>
          Next payment date
        </Label>
        <input
          id={`edit-date-${payment.id}`}
          type="date"
          className={styles.dateInput}
          value={values.date}
          onChange={(event) => setValues((v) => ({ ...v, date: event.target.value }))}
          required
        />
      </div>
      <Select
        label="How often"
        selectedKey={values.frequency}
        onSelectionChange={(key: Key) => setValues((v) => ({ ...v, frequency: key as Frequency }))}
      >
        {frequencyOptions.map((option) => (
          <SelectItem key={option.id} id={option.id}>
            {option.label}
          </SelectItem>
        ))}
      </Select>
      <div className={styles.formActions}>
        <Button variant="outline" onPress={onCancel}>
          Cancel
        </Button>
        <Button variant="primary" onPress={submit} isDisabled={!valid}>
          Save changes
        </Button>
      </div>
    </div>
  );
}

function PaymentRow({
  payment,
  locale,
  onToggle,
  onEditRequest,
  onCancelRequest,
}: {
  payment: Payment;
  locale: string;
  onToggle: () => void;
  onEditRequest: () => void;
  onCancelRequest: () => void;
}) {
  const CategoryIcon = categoryIcons[payment.category];
  const isCancelled = payment.status === 'cancelled';

  function handleMenuAction(key: Key) {
    if (key === 'toggle') onToggle();
    else if (key === 'edit') onEditRequest();
    else if (key === 'cancel') onCancelRequest();
  }

  return (
    <div className={styles.row}>
      <IconTile tint="auto" name={payment.payee} size="md">
        <CategoryIcon />
      </IconTile>
      <div className={styles.details}>
        <span className={styles.payee}>{payment.payee}</span>
        <div className={styles.meta}>
          <Tag size="sm" leading={<IconRefresh />}>
            {frequencyLabels[payment.frequency]}
          </Tag>
          <span className={styles.date}>Next: {formatDate(payment.date, locale)}</span>
        </div>
      </div>
      <div className={styles.trailing}>
        <Amount value={payment.amount} currency={payment.currency} size="sm" />
        <Badge variant="soft" tone={statusTone[payment.status]}>
          {statusLabel[payment.status]}
        </Badge>
        {isCancelled ? (
          <span className={styles.cancelledNote}>Can&rsquo;t be restored</span>
        ) : (
          <MenuTrigger>
            <Button variant="ghost" size="icon" aria-label={`More actions for ${payment.payee}`}>
              <IconDotsVertical />
            </Button>
            <Menu aria-label={`Actions for ${payment.payee}`} onAction={handleMenuAction}>
              <MenuItem id="toggle" icon={payment.status === 'paused' ? <IconPlayerPlay /> : <IconPlayerPause />}>
                {payment.status === 'paused' ? 'Resume' : 'Pause'}
              </MenuItem>
              <MenuItem id="edit" icon={<IconPencil />}>
                Edit
              </MenuItem>
              <MenuSeparator />
              <MenuItem id="cancel" icon={<IconX />} tone="danger">
                Cancel payment
              </MenuItem>
            </Menu>
          </MenuTrigger>
        )}
      </div>
    </div>
  );
}

export default function Screen() {
  const rootRef = useRef<HTMLDivElement>(null);
  const [locale, setLocale] = useState('en-IN');
  const [payments, setPayments] = useState<Payment[]>(initialPayments);
  const [editTarget, setEditTarget] = useState<Payment | null>(null);
  const [cancelTarget, setCancelTarget] = useState<Payment | null>(null);

  useEffect(() => {
    const scoped = rootRef.current?.closest('[lang]');
    const lang = scoped?.getAttribute('lang');
    if (lang) setLocale(lang);
  }, []);

  const sorted = [...payments].sort((a, b) => a.date.localeCompare(b.date));

  function handleToggle(target: Payment) {
    setPayments((prev) =>
      prev.map((p) => (p.id === target.id ? { ...p, status: p.status === 'paused' ? 'active' : 'paused' } : p)),
    );
    toast({
      title: target.status === 'paused' ? 'Payment resumed' : 'Payment paused',
      description: target.payee,
    });
  }

  function handleSaveEdit(updated: Payment) {
    setPayments((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    toast({ title: 'Payment updated', description: updated.payee, tone: 'success' });
  }

  function handleConfirmCancel() {
    if (!cancelTarget) return;
    const { id, payee } = cancelTarget;
    setPayments((prev) => prev.map((p) => (p.id === id ? { ...p, status: 'cancelled' } : p)));
    toast({ title: 'Payment cancelled', description: `${payee} won’t be charged again.` });
  }

  function handleSchedule(payment: Payment) {
    setPayments((prev) => [...prev, payment]);
    toast({ title: 'Payment scheduled', description: payment.payee, tone: 'success' });
  }

  return (
    <div className={styles.screen} ref={rootRef}>
      <Card>
        <CardHeader>
          <CardTitle level={1}>Scheduled payments</CardTitle>
          <CardDescription>What&rsquo;s due next across your accounts.</CardDescription>
          <CardAction>
            <DialogTrigger>
              <Button variant="primary">
                <IconPlus />
                Schedule a payment
              </Button>
              <Dialog title="Schedule a payment" size="sm">
                {({ close }): ReactNode => (
                  <ScheduleForm
                    onCancel={close}
                    onSubmit={(payment) => {
                      handleSchedule(payment);
                      close();
                    }}
                  />
                )}
              </Dialog>
            </DialogTrigger>
          </CardAction>
        </CardHeader>
        <CardContent variant="inset" className={styles.list}>
          {sorted.length === 0 ? (
            <EmptyState
              icon={<IconCalendar />}
              title="No upcoming payments"
              description="Schedule one to see it here."
            />
          ) : (
            sorted.map((payment) => (
              <PaymentRow
                key={payment.id}
                payment={payment}
                locale={locale}
                onToggle={() => handleToggle(payment)}
                onEditRequest={() => setEditTarget(payment)}
                onCancelRequest={() => setCancelTarget(payment)}
              />
            ))
          )}
        </CardContent>
      </Card>

      <Dialog
        title={editTarget ? `Edit ${editTarget.payee}` : 'Edit payment'}
        size="sm"
        isOpen={editTarget !== null}
        onOpenChange={(open) => {
          if (!open) setEditTarget(null);
        }}
      >
        {({ close }): ReactNode =>
          editTarget ? (
            <EditForm
              key={editTarget.id}
              payment={editTarget}
              onCancel={close}
              onSave={(updated) => {
                handleSaveEdit(updated);
                close();
              }}
            />
          ) : null
        }
      </Dialog>

      <AlertDialog
        title="Cancel this payment?"
        tone="danger"
        actionLabel="Cancel payment"
        cancelLabel="Keep it"
        isOpen={cancelTarget !== null}
        onOpenChange={(open) => {
          if (!open) setCancelTarget(null);
        }}
        onAction={handleConfirmCancel}
      >
        {cancelTarget
          ? `${cancelTarget.payee} won’t be charged again. This can’t be undone.`
          : ''}
      </AlertDialog>

      <ToastRegion placement="top-end" />
    </div>
  );
}

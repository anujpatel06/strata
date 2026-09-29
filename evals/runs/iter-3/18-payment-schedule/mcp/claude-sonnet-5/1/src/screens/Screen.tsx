import { useState } from 'react';
import {
  Amount,
  Badge,
  Button,
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
  DataTable,
  Dialog,
  AlertDialog,
  Menu,
  MenuItem,
  MenuSeparator,
  MenuTrigger,
  Select,
  SelectItem,
  DatePicker,
  TextField,
  Tag,
  ToastRegion,
  toast,
  type DataTableColumn,
  type Key,
} from '@syntara/react';
import { IconCalendarEvent, IconCircleX, IconDotsVertical, IconPencil, IconPlayerPause, IconPlayerPlay, IconPlus } from '@syntara/icons';
import { parseDate, type DateValue } from '@internationalized/date';
import { useLocale } from 'react-aria-components';
import styles from './Screen.module.css';

type Frequency = 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'yearly';
type PaymentStatus = 'active' | 'paused';

type Payment = {
  id: string;
  payee: string;
  amount: number;
  currency: string;
  date: string;
  frequency: Frequency;
  status: PaymentStatus;
};

const frequencyLabel: Record<Frequency, string> = {
  weekly: 'Weekly',
  biweekly: 'Every 2 weeks',
  monthly: 'Monthly',
  quarterly: 'Quarterly',
  yearly: 'Yearly',
};

const initialPayments: Payment[] = [
  { id: 'pay-1', payee: 'Meridian Property Management', amount: 2500, currency: 'USD', date: '2026-10-01', frequency: 'monthly', status: 'active' },
  { id: 'pay-2', payee: 'Atlas Cloud Hosting', amount: 89, currency: 'USD', date: '2026-10-02', frequency: 'monthly', status: 'paused' },
  { id: 'pay-3', payee: 'Priya Sharma', amount: 600, currency: 'USD', date: '2026-10-05', frequency: 'biweekly', status: 'active' },
  { id: 'pay-4', payee: 'Northgate Gym', amount: 25, currency: 'USD', date: '2026-10-03', frequency: 'weekly', status: 'active' },
  { id: 'pay-5', payee: 'BrightWave Insurance', amount: 412.75, currency: 'USD', date: '2026-10-12', frequency: 'quarterly', status: 'active' },
  { id: 'pay-6', payee: 'Horizon Tax Advisors', amount: 350, currency: 'USD', date: '2026-11-15', frequency: 'yearly', status: 'active' },
];

type PaymentFormValue = {
  payee: string;
  amount: string;
  date: DateValue;
  frequency: Frequency;
};

function toFormValue(payment: Payment): PaymentFormValue {
  return { payee: payment.payee, amount: String(payment.amount), date: parseDate(payment.date), frequency: payment.frequency };
}

const emptyFormValue: PaymentFormValue = {
  payee: '',
  amount: '',
  date: parseDate('2026-10-01'),
  frequency: 'monthly',
};

function PaymentFields({ value, onChange }: { value: PaymentFormValue; onChange: (value: PaymentFormValue) => void }) {
  return (
    <>
      <TextField label="Payee" value={value.payee} onChange={(payee) => onChange({ ...value, payee })} isRequired autoFocus />
      <TextField label="Amount" prefix="$" value={value.amount} onChange={(amount) => onChange({ ...value, amount })} isRequired />
      <DatePicker label="Date" value={value.date} onChange={(date) => date && onChange({ ...value, date })} />
      <Select
        label="Repeats"
        selectedKey={value.frequency}
        onSelectionChange={(key) => key && onChange({ ...value, frequency: key as Frequency })}
      >
        {Object.entries(frequencyLabel).map(([id, label]) => (
          <SelectItem key={id} id={id}>
            {label}
          </SelectItem>
        ))}
      </Select>
    </>
  );
}

export default function Screen() {
  const { locale } = useLocale();
  const [payments, setPayments] = useState<Payment[]>(initialPayments);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [cancelingId, setCancelingId] = useState<string | null>(null);
  const [isScheduling, setScheduling] = useState(false);
  const [editForm, setEditForm] = useState<PaymentFormValue>(emptyFormValue);
  const [scheduleForm, setScheduleForm] = useState<PaymentFormValue>(emptyFormValue);

  const editingPayment = payments.find((p) => p.id === editingId) ?? null;
  const cancelingPayment = payments.find((p) => p.id === cancelingId) ?? null;

  const dateFormatter = new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short', year: 'numeric' });

  function openEdit(payment: Payment) {
    setEditForm(toFormValue(payment));
    setEditingId(payment.id);
  }

  function saveEdit() {
    if (!editingId) return;
    const amount = Number.parseFloat(editForm.amount);
    setPayments((rows) =>
      rows.map((row) =>
        row.id === editingId
          ? { ...row, payee: editForm.payee, amount: Number.isFinite(amount) ? amount : row.amount, date: editForm.date.toString(), frequency: editForm.frequency }
          : row,
      ),
    );
    toast({ title: 'Payment updated', tone: 'success' });
    setEditingId(null);
  }

  function toggleStatus(payment: Payment) {
    const nextStatus: PaymentStatus = payment.status === 'active' ? 'paused' : 'active';
    setPayments((rows) => rows.map((row) => (row.id === payment.id ? { ...row, status: nextStatus } : row)));
    toast({ title: nextStatus === 'paused' ? `${payment.payee} paused` : `${payment.payee} resumed`, tone: 'success' });
  }

  function confirmCancel() {
    if (!cancelingPayment) return;
    setPayments((rows) => rows.filter((row) => row.id !== cancelingPayment.id));
    toast({ title: `${cancelingPayment.payee} cancelled`, tone: 'success' });
    setCancelingId(null);
  }

  function scheduleNew() {
    const amount = Number.parseFloat(scheduleForm.amount);
    const payment: Payment = {
      id: `pay-${Date.now()}`,
      payee: scheduleForm.payee || 'New payment',
      amount: Number.isFinite(amount) ? amount : 0,
      currency: 'USD',
      date: scheduleForm.date.toString(),
      frequency: scheduleForm.frequency,
      status: 'active',
    };
    setPayments((rows) => [...rows, payment]);
    toast({ title: 'Payment scheduled', tone: 'success' });
    setScheduling(false);
    setScheduleForm(emptyFormValue);
  }

  const columns: DataTableColumn<Payment>[] = [
    { id: 'payee', header: 'Payee', isRowHeader: true, cell: (row) => row.payee },
    {
      id: 'amount',
      header: 'Amount',
      align: 'end',
      cell: (row) => <Amount value={row.amount} currency={row.currency} size="sm" />,
    },
    { id: 'date', header: 'Next payment', cell: (row) => dateFormatter.format(new Date(`${row.date}T00:00:00`)) },
    { id: 'frequency', header: 'Repeats', cell: (row) => <Tag size="sm">{frequencyLabel[row.frequency]}</Tag> },
    {
      id: 'status',
      header: 'Status',
      cell: (row) => (
        <Badge variant="status" tone={row.status === 'active' ? 'success' : 'neutral'}>
          {row.status === 'active' ? 'Active' : 'Paused'}
        </Badge>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      align: 'end',
      cell: (row) => (
        <MenuTrigger>
          <Button variant="ghost" size="icon" aria-label={`Actions for ${row.payee}`}>
            <IconDotsVertical aria-hidden />
          </Button>
          <Menu
            onAction={(key: Key) => {
              if (key === 'toggle') toggleStatus(row);
              if (key === 'edit') openEdit(row);
              if (key === 'cancel') setCancelingId(row.id);
            }}
          >
            <MenuItem id="toggle" icon={row.status === 'active' ? <IconPlayerPause /> : <IconPlayerPlay />}>
              {row.status === 'active' ? 'Pause payment' : 'Resume payment'}
            </MenuItem>
            <MenuItem id="edit" icon={<IconPencil />}>
              Edit payment
            </MenuItem>
            <MenuSeparator />
            <MenuItem id="cancel" icon={<IconCircleX />} tone="danger">
              Cancel payment
            </MenuItem>
          </Menu>
        </MenuTrigger>
      ),
    },
  ];

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Scheduled payments</h1>
          <p className={styles.subtitle}>Upcoming payments set to send automatically.</p>
        </div>
        <Button onPress={() => setScheduling(true)}>
          <IconPlus aria-hidden />
          Schedule a payment
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle level={2}>Upcoming</CardTitle>
          <CardAction>
            <IconCalendarEvent aria-hidden className={styles.cardIcon} />
          </CardAction>
        </CardHeader>
        <CardContent variant="inset">
          <DataTable aria-label="Scheduled payments" columns={columns} rows={payments} getRowId={(row) => row.id} />
        </CardContent>
      </Card>

      <Dialog
        title="Edit payment"
        isOpen={editingId !== null}
        onOpenChange={(open) => !open && setEditingId(null)}
        footer={
          <>
            <Button variant="outline" onPress={() => setEditingId(null)}>
              Cancel
            </Button>
            <Button onPress={saveEdit}>Save changes</Button>
          </>
        }
      >
        {editingPayment && <PaymentFields value={editForm} onChange={setEditForm} />}
      </Dialog>

      <Dialog
        title="Schedule a payment"
        isOpen={isScheduling}
        onOpenChange={(open) => {
          if (!open) {
            setScheduling(false);
            setScheduleForm(emptyFormValue);
          }
        }}
        footer={
          <>
            <Button variant="outline" onPress={() => setScheduling(false)}>
              Cancel
            </Button>
            <Button onPress={scheduleNew}>Schedule payment</Button>
          </>
        }
      >
        <PaymentFields value={scheduleForm} onChange={setScheduleForm} />
      </Dialog>

      <AlertDialog
        title="Cancel this payment?"
        actionLabel="Cancel payment"
        tone="danger"
        isOpen={cancelingId !== null}
        onOpenChange={(open) => !open && setCancelingId(null)}
        onAction={confirmCancel}
      >
        {cancelingPayment ? `${cancelingPayment.payee} won't be charged again. This can't be undone.` : ''}
      </AlertDialog>

      <ToastRegion />
    </div>
  );
}

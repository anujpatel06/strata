'use client';

import {
  AlertDialog,
  Amount,
  Avatar,
  Badge,
  Button,
  Card,
  CardContent,
  DataTable,
  DatePicker,
  EmptyState,
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
  Dialog,
  type DataTableColumn,
} from '@strata/react';
import { IconCalendarEvent, IconDots, IconPencil, IconPlayerPause, IconPlayerPlay, IconPlus, IconTrash } from '@strata/icons';
import { useId, useMemo, useState, type Key } from 'react';
import styles from './Screen.module.css';

const CURRENCY = 'INR';
const LOCALE = 'en-IN';
const FREQUENCIES = ['Weekly', 'Monthly', 'Quarterly', 'Yearly'] as const;
type Frequency = (typeof FREQUENCIES)[number];
type PaymentStatus = 'active' | 'paused';

interface Payment {
  id: string;
  payee: string;
  amount: number;
  date: string;
  frequency: Frequency;
  status: PaymentStatus;
}

const initialPayments: Payment[] = [
  { id: 'p1', payee: 'Skyline Broadband', amount: 1499, date: '2026-09-30', frequency: 'Monthly', status: 'active' },
  { id: 'p6', payee: 'Solace Wellness Clinic', amount: 3000, date: '2026-10-01', frequency: 'Weekly', status: 'active' },
  { id: 'p2', payee: 'Horizon Credit Card', amount: 8500, date: '2026-10-03', frequency: 'Monthly', status: 'active' },
  { id: 'p3', payee: 'Vantage Fitness', amount: 1200, date: '2026-10-05', frequency: 'Monthly', status: 'paused' },
  { id: 'p4', payee: 'Everline Electric', amount: 2350, date: '2026-10-12', frequency: 'Quarterly', status: 'active' },
  { id: 'p5', payee: 'Northbridge Insurance', amount: 15000, date: '2026-11-01', frequency: 'Yearly', status: 'active' },
];

const dateFormatter = new Intl.DateTimeFormat(LOCALE, { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });

function formatDate(iso: string): string {
  return dateFormatter.format(new Date(`${iso}T00:00:00Z`));
}

interface PaymentFormValues {
  payee: string;
  amount: number;
  frequency: Frequency;
  date: string;
}

function PaymentFields({
  payee,
  onPayeeChange,
  amount,
  onAmountChange,
  frequency,
  onFrequencyChange,
  dateDescription,
  onDateChange,
  dateRequired,
}: {
  payee: string;
  onPayeeChange: (value: string) => void;
  amount: string;
  onAmountChange: (value: string) => void;
  frequency: Frequency;
  onFrequencyChange: (value: Frequency) => void;
  dateDescription?: string;
  onDateChange: (value: string) => void;
  dateRequired: boolean;
}) {
  return (
    <div className={styles.formGrid}>
      <TextField label="Payee" value={payee} onChange={onPayeeChange} isRequired />
      <TextField label="Amount" value={amount} onChange={onAmountChange} inputMode="decimal" suffix={CURRENCY} isRequired />
      <Select
        label="Repeats"
        selectedKey={frequency}
        onSelectionChange={(key: Key | null) => onFrequencyChange((key as Frequency) ?? frequency)}
      >
        {FREQUENCIES.map((f) => (
          <SelectItem key={f} id={f}>
            {f}
          </SelectItem>
        ))}
      </Select>
      <DatePicker
        label="Next payment date"
        description={dateDescription}
        isRequired={dateRequired}
        onChange={(value) => onDateChange(value ? value.toString() : '')}
      />
    </div>
  );
}

function EditPaymentDialog({
  payment,
  onClose,
  onSave,
}: {
  payment: Payment;
  onClose: () => void;
  onSave: (values: PaymentFormValues) => void;
}) {
  const [payee, setPayee] = useState(payment.payee);
  const [amount, setAmount] = useState(String(payment.amount));
  const [frequency, setFrequency] = useState<Frequency>(payment.frequency);
  const [date, setDate] = useState('');

  return (
    <Dialog
      isOpen
      title={`Edit payment to ${payment.payee}`}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      footer={({ close }) => (
        <>
          <Button variant="outline" onPress={close}>
            Cancel
          </Button>
          <Button
            onPress={() => {
              const parsedAmount = Number.parseFloat(amount);
              onSave({
                payee: payee.trim() || payment.payee,
                amount: Number.isFinite(parsedAmount) ? parsedAmount : payment.amount,
                frequency,
                date: date || payment.date,
              });
              close();
            }}
          >
            Save changes
          </Button>
        </>
      )}
    >
      <PaymentFields
        payee={payee}
        onPayeeChange={setPayee}
        amount={amount}
        onAmountChange={setAmount}
        frequency={frequency}
        onFrequencyChange={setFrequency}
        dateDescription={`Currently ${formatDate(payment.date)}. Leave blank to keep it.`}
        onDateChange={setDate}
        dateRequired={false}
      />
    </Dialog>
  );
}

function SchedulePaymentDialog({ onClose, onCreate }: { onClose: () => void; onCreate: (values: PaymentFormValues) => void }) {
  const [payee, setPayee] = useState('');
  const [amount, setAmount] = useState('');
  const [frequency, setFrequency] = useState<Frequency>('Monthly');
  const [date, setDate] = useState('');

  return (
    <Dialog
      isOpen
      title="Schedule a payment"
      description="Set up a payment that repeats automatically."
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      footer={({ close }) => (
        <>
          <Button variant="outline" onPress={close}>
            Cancel
          </Button>
          <Button
            isDisabled={!payee.trim() || !amount.trim() || !date}
            onPress={() => {
              const parsedAmount = Number.parseFloat(amount);
              onCreate({
                payee: payee.trim(),
                amount: Number.isFinite(parsedAmount) ? parsedAmount : 0,
                frequency,
                date,
              });
              close();
            }}
          >
            Schedule payment
          </Button>
        </>
      )}
    >
      <PaymentFields
        payee={payee}
        onPayeeChange={setPayee}
        amount={amount}
        onAmountChange={setAmount}
        frequency={frequency}
        onFrequencyChange={setFrequency}
        onDateChange={setDate}
        dateRequired
      />
    </Dialog>
  );
}

export default function Screen() {
  const [payments, setPayments] = useState<Payment[]>(initialPayments);
  const [editing, setEditing] = useState<Payment | null>(null);
  const [cancelling, setCancelling] = useState<Payment | null>(null);
  const [scheduling, setScheduling] = useState(false);
  const titleId = useId();

  const rows = useMemo(() => [...payments].sort((a, b) => a.date.localeCompare(b.date)), [payments]);

  const columns = useMemo<DataTableColumn<Payment>[]>(
    () => [
      {
        id: 'payee',
        header: 'Payee',
        isRowHeader: true,
        cell: (row) => (
          <span className={styles.payee}>
            <Avatar name={row.payee} size="sm" />
            <span className={styles.payeeText}>
              <span className={styles.payeeName}>{row.payee}</span>
              {row.status === 'paused' && (
                <Badge variant="status" tone="warning" size="sm">
                  Paused
                </Badge>
              )}
            </span>
          </span>
        ),
      },
      {
        id: 'amount',
        header: 'Amount',
        align: 'end',
        cell: (row) => <Amount value={row.amount} currency={CURRENCY} locale={LOCALE} size="sm" />,
      },
      {
        id: 'date',
        header: 'Next payment',
        cell: (row) => <time dateTime={row.date}>{formatDate(row.date)}</time>,
      },
      {
        id: 'frequency',
        header: 'Repeats',
        cell: (row) => <Tag size="sm">{row.frequency}</Tag>,
      },
      {
        id: 'actions',
        header: <span className={styles.srOnly}>Actions</span>,
        textValue: 'Actions',
        align: 'end',
        cell: (row) => (
          <MenuTrigger>
            <Button variant="ghost" size="icon" aria-label={`Actions for payment to ${row.payee}`}>
              <IconDots aria-hidden />
            </Button>
            <Menu
              placement="bottom end"
              onAction={(key) => {
                if (key === 'edit') {
                  setEditing(row);
                } else if (key === 'toggle') {
                  const next: PaymentStatus = row.status === 'active' ? 'paused' : 'active';
                  setPayments((all) => all.map((p) => (p.id === row.id ? { ...p, status: next } : p)));
                  toast({ title: `${row.payee} ${next === 'paused' ? 'paused' : 'resumed'}`, tone: 'neutral' });
                } else if (key === 'cancel') {
                  setCancelling(row);
                }
              }}
            >
              <MenuItem id="edit" icon={<IconPencil aria-hidden />}>
                Edit payment
              </MenuItem>
              <MenuItem id="toggle" icon={row.status === 'active' ? <IconPlayerPause aria-hidden /> : <IconPlayerPlay aria-hidden />}>
                {row.status === 'active' ? 'Pause payment' : 'Resume payment'}
              </MenuItem>
              <MenuSeparator />
              <MenuItem id="cancel" tone="danger" icon={<IconTrash aria-hidden />}>
                Cancel payment
              </MenuItem>
            </Menu>
          </MenuTrigger>
        ),
      },
    ],
    [],
  );

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1 id={titleId} className={styles.title}>
            Scheduled payments
          </h1>
          <p className={styles.description}>Payments that repeat automatically. Pause, edit or cancel any of them.</p>
        </div>
        <Button onPress={() => setScheduling(true)}>
          <IconPlus aria-hidden />
          Schedule a payment
        </Button>
      </header>

      <Card>
        <CardContent variant="inset">
          <DataTable
            aria-labelledby={titleId}
            columns={columns}
            rows={rows}
            getRowId={(row) => row.id}
            stickyHeader={false}
            emptyState={
              <EmptyState
                size="sm"
                icon={<IconCalendarEvent aria-hidden />}
                title="No scheduled payments"
                description="Payments you schedule will appear here."
                action={<Button onPress={() => setScheduling(true)}>Schedule a payment</Button>}
              />
            }
          />
        </CardContent>
      </Card>

      {editing && (
        <EditPaymentDialog
          payment={editing}
          onClose={() => setEditing(null)}
          onSave={(values) => {
            setPayments((all) => all.map((p) => (p.id === editing.id ? { ...p, ...values } : p)));
            toast({ title: `Payment to ${values.payee} updated`, tone: 'success' });
          }}
        />
      )}

      {scheduling && (
        <SchedulePaymentDialog
          onClose={() => setScheduling(false)}
          onCreate={(values) => {
            setPayments((all) => [...all, { id: crypto.randomUUID(), status: 'active', ...values }]);
            toast({ title: `Payment to ${values.payee} scheduled`, tone: 'success' });
          }}
        />
      )}

      {cancelling && (
        <AlertDialog
          isOpen
          tone="danger"
          title={`Cancel payment to ${cancelling.payee}?`}
          actionLabel="Cancel payment"
          cancelLabel="Keep payment"
          onOpenChange={(open) => {
            if (!open) setCancelling(null);
          }}
          onAction={() => {
            setPayments((all) => all.filter((p) => p.id !== cancelling.id));
            toast({ title: `Payment to ${cancelling.payee} cancelled`, tone: 'neutral' });
          }}
        >
          This payment will be removed from your schedule. It can’t be restored.
        </AlertDialog>
      )}

      <ToastRegion />
    </div>
  );
}

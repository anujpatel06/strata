import { useMemo, useState } from 'react';
import type { Key } from 'react-aria-components';
import { CalendarDate, getLocalTimeZone, today } from '@internationalized/date';
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
  DataTable,
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
  TextField,
  ToastRegion,
  toast,
  type DataTableColumn,
} from '@strata/react';
import { IconCalendar, IconDotsVertical, IconPencil, IconPlayerPause, IconPlayerPlay, IconPlus, IconRefresh, IconTrash } from '@strata/icons';
import styles from './Screen.module.css';

type Frequency = 'Weekly' | 'Every 2 weeks' | 'Monthly' | 'Quarterly' | 'Yearly';
type PaymentStatus = 'scheduled' | 'paused';

type Payment = {
  id: string;
  payee: string;
  amount: number;
  currency: string;
  date: CalendarDate;
  frequency: Frequency;
  status: PaymentStatus;
};

const FREQUENCIES: Frequency[] = ['Weekly', 'Every 2 weeks', 'Monthly', 'Quarterly', 'Yearly'];

const initialPayments: Payment[] = [
  { id: 'p-1', payee: 'Greenfield Realty', amount: 2400, currency: 'USD', date: new CalendarDate(2026, 10, 1), frequency: 'Monthly', status: 'scheduled' },
  { id: 'p-2', payee: 'Clearwater Utilities', amount: 96.4, currency: 'USD', date: new CalendarDate(2026, 10, 3), frequency: 'Monthly', status: 'scheduled' },
  { id: 'p-3', payee: 'Horizon Gym', amount: 42, currency: 'USD', date: new CalendarDate(2026, 10, 5), frequency: 'Every 2 weeks', status: 'paused' },
  { id: 'p-4', payee: 'Nimbus Cloud Storage', amount: 71.99, currency: 'USD', date: new CalendarDate(2026, 10, 8), frequency: 'Yearly', status: 'scheduled' },
  { id: 'p-5', payee: 'Sunrise Daycare', amount: 650, currency: 'USD', date: new CalendarDate(2026, 10, 12), frequency: 'Weekly', status: 'scheduled' },
  { id: 'p-6', payee: 'Meridian Insurance', amount: 318.75, currency: 'USD', date: new CalendarDate(2026, 10, 15), frequency: 'Quarterly', status: 'scheduled' },
];

const dateFormatter = new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'short', year: 'numeric' });

function sortByDate(payments: Payment[]) {
  return [...payments].sort((a, b) => a.date.compare(b.date));
}

type ScheduleDraft = { payee: string; amount: string; date: CalendarDate | null; frequency: Frequency };

const emptyScheduleDraft: ScheduleDraft = { payee: '', amount: '', date: null, frequency: 'Monthly' };

type EditDraft = { amount: string; date: CalendarDate; frequency: Frequency };

export default function Screen() {
  const [payments, setPayments] = useState<Payment[]>(initialPayments);
  const [scheduleDraft, setScheduleDraft] = useState<ScheduleDraft>(emptyScheduleDraft);
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
  const [editDraft, setEditDraft] = useState<EditDraft | null>(null);
  const [cancellingPayment, setCancellingPayment] = useState<Payment | null>(null);

  const isScheduleValid =
    scheduleDraft.payee.trim() !== '' &&
    scheduleDraft.date !== null &&
    Number.isFinite(Number(scheduleDraft.amount)) &&
    Number(scheduleDraft.amount) > 0;

  const isEditValid =
    editDraft !== null && Number.isFinite(Number(editDraft.amount)) && Number(editDraft.amount) > 0;

  function handleRowAction(key: Key, payment: Payment) {
    if (key === 'edit') {
      setEditingPayment(payment);
      setEditDraft({ amount: String(payment.amount), date: payment.date, frequency: payment.frequency });
    } else if (key === 'toggle-pause') {
      setPayments((prev) =>
        prev.map((p) => (p.id === payment.id ? { ...p, status: p.status === 'paused' ? 'scheduled' : 'paused' } : p)),
      );
      toast({ title: payment.status === 'paused' ? 'Payment resumed' : 'Payment paused', tone: 'success' });
    } else if (key === 'cancel') {
      setCancellingPayment(payment);
    }
  }

  function scheduleNewPayment() {
    if (!isScheduleValid || !scheduleDraft.date) return;
    const newPayment: Payment = {
      id: `p-${Date.now()}`,
      payee: scheduleDraft.payee.trim(),
      amount: Number(scheduleDraft.amount),
      currency: 'USD',
      date: scheduleDraft.date,
      frequency: scheduleDraft.frequency,
      status: 'scheduled',
    };
    setPayments((prev) => sortByDate([...prev, newPayment]));
    toast({ title: 'Payment scheduled', tone: 'success' });
    setScheduleDraft(emptyScheduleDraft);
  }

  function saveEdit() {
    if (!editingPayment || !editDraft || !isEditValid) return;
    setPayments((prev) =>
      sortByDate(
        prev.map((p) =>
          p.id === editingPayment.id
            ? { ...p, amount: Number(editDraft.amount), date: editDraft.date, frequency: editDraft.frequency }
            : p,
        ),
      ),
    );
    toast({ title: 'Payment updated', tone: 'success' });
    setEditingPayment(null);
    setEditDraft(null);
  }

  function confirmCancel() {
    if (!cancellingPayment) return;
    setPayments((prev) => prev.filter((p) => p.id !== cancellingPayment.id));
    toast({ title: 'Payment cancelled', tone: 'success' });
    setCancellingPayment(null);
  }

  const columns: DataTableColumn<Payment>[] = useMemo(
    () => [
      {
        id: 'payee',
        header: 'Payee',
        isRowHeader: true,
        cell: (row) => (
          <div className={styles.payeeCell}>
            <Avatar name={row.payee} alt="" size="sm" />
            <span>{row.payee}</span>
          </div>
        ),
      },
      {
        id: 'frequency',
        header: 'Repeats',
        cell: (row) => (
          <Badge variant="soft" tone="neutral" icon={<IconRefresh />}>
            {row.frequency}
          </Badge>
        ),
      },
      {
        id: 'date',
        header: 'Next payment',
        cell: (row) => dateFormatter.format(row.date.toDate(getLocalTimeZone())),
      },
      {
        id: 'status',
        header: 'Status',
        cell: (row) => (
          <Badge variant="status" tone={row.status === 'paused' ? 'warning' : 'info'}>
            {row.status === 'paused' ? 'Paused' : 'Scheduled'}
          </Badge>
        ),
      },
      {
        id: 'amount',
        header: 'Amount',
        align: 'end',
        cell: (row) => <Amount value={row.amount} currency={row.currency} size="sm" />,
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
            <Menu onAction={(key) => handleRowAction(key, row)}>
              <MenuItem id="edit" icon={<IconPencil />}>
                Edit payment
              </MenuItem>
              <MenuItem id="toggle-pause" icon={row.status === 'paused' ? <IconPlayerPlay /> : <IconPlayerPause />}>
                {row.status === 'paused' ? 'Resume payment' : 'Pause payment'}
              </MenuItem>
              <MenuSeparator />
              <MenuItem id="cancel" icon={<IconTrash />} tone="danger">
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
          <Eyebrow>Payments</Eyebrow>
          <h1 className={styles.title}>Scheduled payments</h1>
          <p className={styles.subtitle}>Upcoming payments due from your accounts.</p>
        </div>
        <DialogTrigger onOpenChange={(open) => !open && setScheduleDraft(emptyScheduleDraft)}>
          <Button>
            <IconPlus aria-hidden />
            Schedule a payment
          </Button>
          <Dialog
            title="Schedule a payment"
            description="Set up a new recurring payment."
            footer={({ close }) => (
              <>
                <Button variant="outline" onPress={close}>
                  Cancel
                </Button>
                <Button
                  isDisabled={!isScheduleValid}
                  onPress={() => {
                    scheduleNewPayment();
                    close();
                  }}
                >
                  Schedule payment
                </Button>
              </>
            )}
          >
            <TextField
              label="Payee"
              value={scheduleDraft.payee}
              onChange={(value) => setScheduleDraft((d) => ({ ...d, payee: value }))}
              isRequired
              autoFocus
            />
            <TextField
              label="Amount"
              prefix="$"
              value={scheduleDraft.amount}
              onChange={(value) => setScheduleDraft((d) => ({ ...d, amount: value }))}
              isRequired
            />
            <DatePicker
              label="First payment date"
              value={scheduleDraft.date}
              onChange={(value) => setScheduleDraft((d) => ({ ...d, date: value }))}
              minValue={today(getLocalTimeZone())}
              isRequired
            />
            <Select
              label="Repeats"
              selectedKey={scheduleDraft.frequency}
              onSelectionChange={(key) => setScheduleDraft((d) => ({ ...d, frequency: key as Frequency }))}
            >
              {FREQUENCIES.map((frequency) => (
                <SelectItem key={frequency} id={frequency}>
                  {frequency}
                </SelectItem>
              ))}
            </Select>
          </Dialog>
        </DialogTrigger>
      </header>

      <Card>
        <CardHeader divider>
          <CardTitle level={2}>Upcoming</CardTitle>
          <CardDescription>{payments.length} payment{payments.length === 1 ? '' : 's'} scheduled</CardDescription>
        </CardHeader>
        <CardContent variant="inset">
          <DataTable
            aria-label="Scheduled payments"
            columns={columns}
            rows={payments}
            getRowId={(row) => row.id}
            emptyState={
              <EmptyState
                size="sm"
                icon={<IconCalendar />}
                title="No scheduled payments"
                description="Payments you cancel can't be restored. Schedule a new one to get started."
              />
            }
          />
        </CardContent>
      </Card>

      <Dialog
        isOpen={editingPayment !== null}
        onOpenChange={(open) => {
          if (!open) {
            setEditingPayment(null);
            setEditDraft(null);
          }
        }}
        title="Edit payment"
        description={editingPayment ? `To ${editingPayment.payee}` : undefined}
        footer={({ close }) => (
          <>
            <Button variant="outline" onPress={close}>
              Cancel
            </Button>
            <Button
              isDisabled={!isEditValid}
              onPress={() => {
                saveEdit();
                close();
              }}
            >
              Save changes
            </Button>
          </>
        )}
      >
        {editDraft && (
          <>
            <TextField
              label="Amount"
              prefix="$"
              value={editDraft.amount}
              onChange={(value) => setEditDraft((d) => (d ? { ...d, amount: value } : d))}
              isRequired
              autoFocus
            />
            <DatePicker
              label="Next payment date"
              value={editDraft.date}
              onChange={(value) => value && setEditDraft((d) => (d ? { ...d, date: value } : d))}
              isRequired
            />
            <Select
              label="Repeats"
              selectedKey={editDraft.frequency}
              onSelectionChange={(key) => setEditDraft((d) => (d ? { ...d, frequency: key as Frequency } : d))}
            >
              {FREQUENCIES.map((frequency) => (
                <SelectItem key={frequency} id={frequency}>
                  {frequency}
                </SelectItem>
              ))}
            </Select>
          </>
        )}
      </Dialog>

      <AlertDialog
        isOpen={cancellingPayment !== null}
        onOpenChange={(open) => !open && setCancellingPayment(null)}
        title={cancellingPayment ? `Cancel payment to ${cancellingPayment.payee}?` : 'Cancel this payment?'}
        tone="danger"
        actionLabel="Cancel payment"
        cancelLabel="Keep payment"
        onAction={confirmCancel}
      >
        This stops all future payments to {cancellingPayment?.payee}. It can't be restored.
      </AlertDialog>

      <ToastRegion />
    </div>
  );
}

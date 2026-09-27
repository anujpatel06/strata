'use client';

import { useId, useMemo, useState } from 'react';
import { useLocale } from 'react-aria-components';
import { CalendarDate, getLocalTimeZone, parseDate, today } from '@internationalized/date';
import {
  AlertDialog,
  Amount,
  Badge,
  Button,
  Card,
  CardContent,
  DataTable,
  DatePicker,
  Dialog,
  DialogTrigger,
  EmptyState,
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
import { IconCalendarEvent, IconDots, IconPencil, IconPlayerPause, IconPlayerPlay, IconPlus } from '@strata/icons';
import styles from './Screen.module.css';

type Frequency = 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'yearly';
type PaymentStatus = 'active' | 'paused';

interface ScheduledPayment {
  id: string;
  payee: string;
  memo: string;
  amount: number;
  date: string;
  frequency: Frequency;
  status: PaymentStatus;
}

const CURRENCY = 'USD';

const FREQUENCY_LABEL: Record<Frequency, string> = {
  weekly: 'Weekly',
  biweekly: 'Every 2 weeks',
  monthly: 'Monthly',
  quarterly: 'Quarterly',
  yearly: 'Yearly',
};

const FREQUENCY_OPTIONS: Frequency[] = ['weekly', 'biweekly', 'monthly', 'quarterly', 'yearly'];

const INITIAL_PAYMENTS: ScheduledPayment[] = [
  { id: 'sp-1', payee: 'Riverside Apartments', memo: 'Rent', amount: 1450, date: '2026-10-01', frequency: 'monthly', status: 'active' },
  { id: 'sp-2', payee: 'Northwind Insurance', memo: 'Auto policy', amount: 62, date: '2026-10-03', frequency: 'monthly', status: 'active' },
  { id: 'sp-3', payee: 'Clearline Fitness', memo: 'Personal training', amount: 40, date: '2026-10-06', frequency: 'weekly', status: 'paused' },
  { id: 'sp-4', payee: 'Meridian Loan Services', memo: 'Car loan', amount: 320, date: '2026-10-09', frequency: 'biweekly', status: 'active' },
  { id: 'sp-5', payee: 'Northstar Storage Co.', memo: 'Storage unit 14B', amount: 89, date: '2026-10-15', frequency: 'quarterly', status: 'active' },
  { id: 'sp-6', payee: 'Sunrise Cloud Backup', memo: 'Annual backup plan', amount: 54, date: '2027-01-02', frequency: 'yearly', status: 'active' },
];

let nextId = INITIAL_PAYMENTS.length + 1;

interface PaymentFormValue {
  payee: string;
  memo: string;
  amount: string;
  date: CalendarDate;
  frequency: Frequency;
}

function emptyFormValue(): PaymentFormValue {
  return { payee: '', memo: '', amount: '', date: today(getLocalTimeZone()), frequency: 'monthly' };
}

function paymentToFormValue(payment: ScheduledPayment): PaymentFormValue {
  return {
    payee: payment.payee,
    memo: payment.memo,
    amount: String(payment.amount),
    date: parseDate(payment.date),
    frequency: payment.frequency,
  };
}

export default function Screen() {
  const uid = useId();
  const { locale } = useLocale();
  const [payments, setPayments] = useState<ScheduledPayment[]>(INITIAL_PAYMENTS);
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [scheduleForm, setScheduleForm] = useState<PaymentFormValue>(emptyFormValue);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<PaymentFormValue | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const dateFormat = useMemo(
    () => new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }),
    [locale],
  );

  const editingPayment = payments.find((p) => p.id === editingId) ?? null;
  const cancellingPayment = payments.find((p) => p.id === cancellingId) ?? null;
  const minDate = today(getLocalTimeZone());

  const togglePause = (payment: ScheduledPayment) => {
    const next: PaymentStatus = payment.status === 'active' ? 'paused' : 'active';
    setPayments((all) => all.map((p) => (p.id === payment.id ? { ...p, status: next } : p)));
    toast({
      title: next === 'paused' ? `Payment to ${payment.payee} paused` : `Payment to ${payment.payee} resumed`,
      tone: 'success',
    });
  };

  const openEdit = (payment: ScheduledPayment) => {
    setEditingId(payment.id);
    setEditForm(paymentToFormValue(payment));
  };

  const saveEdit = () => {
    if (!editingId || !editForm) return;
    const amount = Number.parseFloat(editForm.amount);
    if (!Number.isFinite(amount) || amount <= 0) return;
    setPayments((all) =>
      all.map((p) =>
        p.id === editingId
          ? { ...p, amount, date: editForm.date.toString(), frequency: editForm.frequency }
          : p,
      ),
    );
    toast({ title: `Payment to ${editForm.payee} updated`, tone: 'success' });
    setEditingId(null);
    setEditForm(null);
  };

  const confirmCancel = () => {
    if (!cancellingPayment) return;
    setPayments((all) => all.filter((p) => p.id !== cancellingPayment.id));
    toast({ title: `Payment to ${cancellingPayment.payee} cancelled`, tone: 'neutral' });
    setCancellingId(null);
  };

  const scheduleValid = scheduleForm.payee.trim().length > 0 && Number.parseFloat(scheduleForm.amount) > 0;

  const schedulePayment = () => {
    if (!scheduleValid) return;
    const amount = Number.parseFloat(scheduleForm.amount);
    setPayments((all) => [
      ...all,
      {
        id: `sp-${nextId++}`,
        payee: scheduleForm.payee.trim(),
        memo: scheduleForm.memo.trim(),
        amount,
        date: scheduleForm.date.toString(),
        frequency: scheduleForm.frequency,
        status: 'active',
      },
    ]);
    toast({ title: `Payment to ${scheduleForm.payee.trim()} scheduled`, tone: 'success' });
    setIsScheduleOpen(false);
  };

  const columns = useMemo<DataTableColumn<ScheduledPayment>[]>(
    () => [
      {
        id: 'payee',
        header: 'Payee',
        isRowHeader: true,
        cell: (row) => (
          <span className={styles.payeeCell}>
            <span className={styles.payeeName}>{row.payee}</span>
            <span className={styles.payeeMemo}>{row.memo}</span>
          </span>
        ),
      },
      {
        id: 'amount',
        header: 'Amount',
        align: 'end',
        cell: (row) => <Amount value={row.amount} currency={CURRENCY} locale={locale} size="sm" />,
      },
      {
        id: 'date',
        header: 'Next payment',
        cell: (row) => (
          <time dateTime={row.date} className={styles.date}>
            {dateFormat.format(new Date(`${row.date}T00:00:00Z`))}
          </time>
        ),
      },
      {
        id: 'frequency',
        header: 'Repeats',
        cell: (row) => <span className={styles.quiet}>{FREQUENCY_LABEL[row.frequency]}</span>,
      },
      {
        id: 'status',
        header: 'Status',
        cell: (row) => (
          <Badge variant="status" tone={row.status === 'active' ? 'success' : 'warning'} size="sm">
            {row.status === 'active' ? 'Active' : 'Paused'}
          </Badge>
        ),
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
                if (key === 'toggle') togglePause(row);
                else if (key === 'edit') openEdit(row);
                else if (key === 'cancel') setCancellingId(row.id);
              }}
            >
              <MenuItem id="toggle" icon={row.status === 'active' ? <IconPlayerPause aria-hidden /> : <IconPlayerPlay aria-hidden />}>
                {row.status === 'active' ? 'Pause payment' : 'Resume payment'}
              </MenuItem>
              <MenuItem id="edit" icon={<IconPencil aria-hidden />}>
                Edit payment
              </MenuItem>
              <MenuSeparator />
              <MenuItem id="cancel" tone="danger">
                Cancel payment
              </MenuItem>
            </Menu>
          </MenuTrigger>
        ),
      },
    ],
    [dateFormat, locale],
  );

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <div className={styles.titleBlock}>
          <h1 className={styles.title} id={`${uid}-title`}>
            Scheduled payments
          </h1>
          <p className={styles.description}>Upcoming payments due to go out from your account.</p>
        </div>
        <DialogTrigger
          isOpen={isScheduleOpen}
          onOpenChange={(open) => {
            setIsScheduleOpen(open);
            if (open) setScheduleForm(emptyFormValue());
          }}
        >
          <Button>
            <IconPlus aria-hidden />
            Schedule a payment
          </Button>
          <Dialog
            title="Schedule a payment"
            description="Set up a payment that repeats on a schedule."
            footer={({ close }) => (
              <>
                <Button variant="outline" onPress={close}>
                  Cancel
                </Button>
                <Button onPress={schedulePayment} isDisabled={!scheduleValid}>
                  Schedule payment
                </Button>
              </>
            )}
          >
            <TextField
              label="Payee"
              value={scheduleForm.payee}
              onChange={(v) => setScheduleForm((f) => ({ ...f, payee: v }))}
              isRequired
              autoFocus
            />
            <TextField
              label="Memo"
              description="Optional note to remember this payment by."
              value={scheduleForm.memo}
              onChange={(v) => setScheduleForm((f) => ({ ...f, memo: v }))}
            />
            <TextField
              label="Amount"
              prefix="$"
              inputMode="decimal"
              value={scheduleForm.amount}
              onChange={(v) => setScheduleForm((f) => ({ ...f, amount: v }))}
              isRequired
            />
            <DatePicker
              label="First payment date"
              value={scheduleForm.date}
              minValue={minDate}
              onChange={(v) => v && setScheduleForm((f) => ({ ...f, date: v as CalendarDate }))}
              isRequired
            />
            <Select
              label="Repeats"
              selectedKey={scheduleForm.frequency}
              onSelectionChange={(key) => setScheduleForm((f) => ({ ...f, frequency: key as Frequency }))}
            >
              {FREQUENCY_OPTIONS.map((f) => (
                <SelectItem key={f} id={f}>
                  {FREQUENCY_LABEL[f]}
                </SelectItem>
              ))}
            </Select>
          </Dialog>
        </DialogTrigger>
      </div>

      <Card>
        <CardContent variant="inset">
          <DataTable
            aria-labelledby={`${uid}-title`}
            columns={columns}
            rows={payments}
            getRowId={(row) => row.id}
            stickyHeader={false}
            emptyState={
              <EmptyState
                size="sm"
                icon={<IconCalendarEvent />}
                title="No scheduled payments"
                description="Use Schedule a payment above to set one up."
              />
            }
          />
        </CardContent>
      </Card>

      <Dialog
        isOpen={editingId !== null}
        onOpenChange={(open) => {
          if (!open) {
            setEditingId(null);
            setEditForm(null);
          }
        }}
        title={editingPayment ? `Edit payment to ${editingPayment.payee}` : 'Edit payment'}
        description="Changes apply to this payment and every payment after it."
        footer={({ close }) => (
          <>
            <Button variant="outline" onPress={close}>
              Cancel
            </Button>
            <Button onPress={saveEdit} isDisabled={!editForm || !(Number.parseFloat(editForm.amount) > 0)}>
              Save changes
            </Button>
          </>
        )}
      >
        {editForm && (
          <>
            <TextField
              label="Amount"
              prefix="$"
              inputMode="decimal"
              value={editForm.amount}
              onChange={(v) => setEditForm((f) => (f ? { ...f, amount: v } : f))}
              isRequired
              autoFocus
            />
            <DatePicker
              label="Next payment date"
              value={editForm.date}
              minValue={minDate}
              onChange={(v) => v && setEditForm((f) => (f ? { ...f, date: v as CalendarDate } : f))}
              isRequired
            />
            <Select
              label="Repeats"
              selectedKey={editForm.frequency}
              onSelectionChange={(key) => setEditForm((f) => (f ? { ...f, frequency: key as Frequency } : f))}
            >
              {FREQUENCY_OPTIONS.map((f) => (
                <SelectItem key={f} id={f}>
                  {FREQUENCY_LABEL[f]}
                </SelectItem>
              ))}
            </Select>
          </>
        )}
      </Dialog>

      <AlertDialog
        isOpen={cancellingId !== null}
        onOpenChange={(open) => !open && setCancellingId(null)}
        tone="danger"
        title={cancellingPayment ? `Cancel payment to ${cancellingPayment.payee}?` : 'Cancel payment?'}
        actionLabel="Cancel payment"
        cancelLabel="Keep payment"
        onAction={confirmCancel}
      >
        This can't be undone. Once cancelled, this payment can't be restored — you'll need to schedule it again.
      </AlertDialog>

      <ToastRegion />
    </div>
  );
}

import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import styles from './Screen.module.css';

type Frequency = 'Weekly' | 'Every 2 weeks' | 'Monthly' | 'Quarterly' | 'Yearly';
type PaymentStatus = 'active' | 'paused';

interface ScheduledPayment {
  id: string;
  payee: string;
  amount: number;
  currency: string;
  nextDate: string; // ISO yyyy-mm-dd
  frequency: Frequency;
  status: PaymentStatus;
}

const FREQUENCIES: Frequency[] = ['Weekly', 'Every 2 weeks', 'Monthly', 'Quarterly', 'Yearly'];

const initialPayments: ScheduledPayment[] = [
  {
    id: 'pay-1',
    payee: 'Skyline Apartments',
    amount: 1450,
    currency: 'USD',
    nextDate: '2026-10-01',
    frequency: 'Monthly',
    status: 'active',
  },
  {
    id: 'pay-2',
    payee: 'Nova Energy Co.',
    amount: 82.4,
    currency: 'USD',
    nextDate: '2026-10-05',
    frequency: 'Monthly',
    status: 'active',
  },
  {
    id: 'pay-3',
    payee: 'FitCore Gym',
    amount: 45,
    currency: 'USD',
    nextDate: '2026-10-03',
    frequency: 'Weekly',
    status: 'active',
  },
  {
    id: 'pay-4',
    payee: 'Apex Auto Loans',
    amount: 320.75,
    currency: 'USD',
    nextDate: '2026-10-15',
    frequency: 'Monthly',
    status: 'paused',
  },
  {
    id: 'pay-5',
    payee: 'Horizon Insurance',
    amount: 610,
    currency: 'USD',
    nextDate: '2026-11-01',
    frequency: 'Quarterly',
    status: 'active',
  },
  {
    id: 'pay-6',
    payee: 'Cloud Stream Plus',
    amount: 15.99,
    currency: 'USD',
    nextDate: '2026-10-08',
    frequency: 'Monthly',
    status: 'active',
  },
];

function formatAmount(amount: number, currency: string): string {
  return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(amount);
}

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'short', year: 'numeric' }).format(
    new Date(`${iso}T00:00:00`),
  );
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? '';
  const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
  return (first + last).toUpperCase();
}

function makeId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `pay-${Math.random().toString(36).slice(2, 10)}`;
}

type ModalState =
  | { kind: 'schedule' }
  | { kind: 'edit'; payment: ScheduledPayment }
  | { kind: 'cancel'; payment: ScheduledPayment }
  | null;

interface PaymentFormValues {
  payee: string;
  amount: string;
  date: string;
  frequency: Frequency;
}

function PlusIcon() {
  return (
    <svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true" focusable="false">
      <path
        d="M10 3v14M3 10h14"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true" focusable="false">
      <path
        d="M5 5l10 10M15 5L5 15"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function Modal({
  titleId,
  onClose,
  children,
}: {
  titleId: string;
  onClose: () => void;
  children: ReactNode;
}) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  return (
    <div
      className={styles.overlay}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className={styles.modal} role="dialog" aria-modal="true" aria-labelledby={titleId}>
        {children}
      </div>
    </div>
  );
}

function PaymentForm({
  title,
  titleId,
  initialValues,
  submitLabel,
  onCancel,
  onSubmit,
}: {
  title: string;
  titleId: string;
  initialValues: PaymentFormValues;
  submitLabel: string;
  onCancel: () => void;
  onSubmit: (values: PaymentFormValues) => void;
}) {
  const [values, setValues] = useState(initialValues);
  const firstFieldRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    firstFieldRef.current?.focus();
  }, []);

  const trimmedPayee = values.payee.trim();
  const parsedAmount = Number(values.amount);
  const isPayeeValid = trimmedPayee.length > 0;
  const isAmountValid = values.amount.trim().length > 0 && Number.isFinite(parsedAmount) && parsedAmount > 0;
  const isDateValid = values.date.trim().length > 0;
  const isValid = isPayeeValid && isAmountValid && isDateValid;

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!isValid) return;
    onSubmit({ ...values, payee: trimmedPayee });
  };

  return (
    <>
      <div className={styles.modalHeader}>
        <h2 id={titleId} className={styles.modalTitle}>
          {title}
        </h2>
        <button
          type="button"
          className={styles.closeButton}
          onClick={onCancel}
          aria-label="Close dialog"
        >
          <CloseIcon />
        </button>
      </div>
      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        <label className={styles.field}>
          <span className={styles.fieldLabel}>Payee</span>
          <input
            ref={firstFieldRef}
            className={styles.input}
            type="text"
            value={values.payee}
            onChange={(event) => setValues((prev) => ({ ...prev, payee: event.target.value }))}
            placeholder="Who are you paying?"
            required
          />
        </label>
        <label className={styles.field}>
          <span className={styles.fieldLabel}>Amount</span>
          <input
            className={styles.input}
            type="number"
            min="0.01"
            step="0.01"
            inputMode="decimal"
            value={values.amount}
            onChange={(event) => setValues((prev) => ({ ...prev, amount: event.target.value }))}
            placeholder="0.00"
            required
          />
        </label>
        <label className={styles.field}>
          <span className={styles.fieldLabel}>Next payment date</span>
          <input
            className={styles.input}
            type="date"
            value={values.date}
            onChange={(event) => setValues((prev) => ({ ...prev, date: event.target.value }))}
            required
          />
        </label>
        <label className={styles.field}>
          <span className={styles.fieldLabel}>Repeats</span>
          <select
            className={styles.input}
            value={values.frequency}
            onChange={(event) =>
              setValues((prev) => ({ ...prev, frequency: event.target.value as Frequency }))
            }
          >
            {FREQUENCIES.map((frequency) => (
              <option key={frequency} value={frequency}>
                {frequency}
              </option>
            ))}
          </select>
        </label>
        <div className={styles.formActions}>
          <button type="button" className={styles.buttonSecondary} onClick={onCancel}>
            Cancel
          </button>
          <button type="submit" className={styles.buttonPrimary} disabled={!isValid}>
            {submitLabel}
          </button>
        </div>
      </form>
    </>
  );
}

function CancelConfirmDialog({
  payment,
  titleId,
  onKeep,
  onConfirm,
}: {
  payment: ScheduledPayment;
  titleId: string;
  onKeep: () => void;
  onConfirm: () => void;
}) {
  return (
    <>
      <div className={styles.modalHeader}>
        <h2 id={titleId} className={styles.modalTitle}>
          Cancel this payment?
        </h2>
        <button
          type="button"
          className={styles.closeButton}
          onClick={onKeep}
          aria-label="Close dialog"
        >
          <CloseIcon />
        </button>
      </div>
      <div className={styles.confirmBody}>
        <p>
          You&apos;re about to cancel the payment to <strong>{payment.payee}</strong> of{' '}
          {formatAmount(payment.amount, payment.currency)}, due {formatDate(payment.nextDate)}.
        </p>
        <p className={styles.confirmWarning}>
          This can&apos;t be undone. You&apos;ll need to schedule it again if you change your mind.
        </p>
      </div>
      <div className={styles.formActions}>
        <button type="button" className={styles.buttonSecondary} onClick={onKeep}>
          Keep payment
        </button>
        <button type="button" className={styles.buttonDanger} onClick={onConfirm}>
          Cancel payment
        </button>
      </div>
    </>
  );
}

export default function Screen() {
  const [payments, setPayments] = useState<ScheduledPayment[]>(initialPayments);
  const [modal, setModal] = useState<ModalState>(null);

  const closeModal = () => setModal(null);

  const togglePause = (id: string) => {
    setPayments((prev) =>
      prev.map((payment) =>
        payment.id === id
          ? { ...payment, status: payment.status === 'paused' ? 'active' : 'paused' }
          : payment,
      ),
    );
  };

  const handleScheduleSubmit = (values: PaymentFormValues) => {
    setPayments((prev) => [
      ...prev,
      {
        id: makeId(),
        payee: values.payee,
        amount: Number(values.amount),
        currency: 'USD',
        nextDate: values.date,
        frequency: values.frequency,
        status: 'active',
      },
    ]);
    closeModal();
  };

  const handleEditSubmit = (id: string, values: PaymentFormValues) => {
    setPayments((prev) =>
      prev.map((payment) =>
        payment.id === id
          ? {
              ...payment,
              payee: values.payee,
              amount: Number(values.amount),
              nextDate: values.date,
              frequency: values.frequency,
            }
          : payment,
      ),
    );
    closeModal();
  };

  const handleCancelConfirm = (id: string) => {
    setPayments((prev) => prev.filter((payment) => payment.id !== id));
    closeModal();
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerText}>
          <h1 className={styles.title}>Scheduled payments</h1>
          <p className={styles.subtitle}>Manage your upcoming automatic payments.</p>
        </div>
        <button
          type="button"
          className={styles.scheduleButton}
          onClick={() => setModal({ kind: 'schedule' })}
        >
          <PlusIcon />
          Schedule a payment
        </button>
      </header>

      {payments.length === 0 ? (
        <p className={styles.empty}>You have no scheduled payments.</p>
      ) : (
        <ul className={styles.list}>
          {payments.map((payment) => {
            const isPaused = payment.status === 'paused';
            return (
              <li key={payment.id} className={styles.card}>
                <div className={styles.payeeCell}>
                  <span className={styles.avatar} aria-hidden="true">
                    {initials(payment.payee)}
                  </span>
                  <div>
                    <div className={styles.payeeNameRow}>
                      <span className={styles.payeeName}>{payment.payee}</span>
                      {isPaused && <span className={styles.badgePaused}>Paused</span>}
                    </div>
                    <span className={styles.freqPill}>{payment.frequency}</span>
                  </div>
                </div>

                <div className={styles.amountCell}>
                  <span className={styles.cellLabel}>Amount</span>
                  <span className={styles.amountValue}>{formatAmount(payment.amount, payment.currency)}</span>
                </div>

                <div className={styles.dateCell}>
                  <span className={styles.cellLabel}>Next payment</span>
                  <span className={styles.cellValue}>{formatDate(payment.nextDate)}</span>
                </div>

                <div className={styles.actions}>
                  <button
                    type="button"
                    className={styles.actionButton}
                    onClick={() => togglePause(payment.id)}
                  >
                    {isPaused ? 'Resume' : 'Pause'}
                  </button>
                  <button
                    type="button"
                    className={styles.actionButton}
                    onClick={() => setModal({ kind: 'edit', payment })}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className={styles.actionButtonDanger}
                    onClick={() => setModal({ kind: 'cancel', payment })}
                  >
                    Cancel
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {modal?.kind === 'schedule' && (
        <Modal titleId="schedule-payment-title" onClose={closeModal}>
          <PaymentForm
            title="Schedule a payment"
            titleId="schedule-payment-title"
            initialValues={{ payee: '', amount: '', date: '', frequency: 'Monthly' }}
            submitLabel="Schedule payment"
            onCancel={closeModal}
            onSubmit={handleScheduleSubmit}
          />
        </Modal>
      )}

      {modal?.kind === 'edit' && (
        <Modal titleId="edit-payment-title" onClose={closeModal}>
          <PaymentForm
            title="Edit payment"
            titleId="edit-payment-title"
            initialValues={{
              payee: modal.payment.payee,
              amount: String(modal.payment.amount),
              date: modal.payment.nextDate,
              frequency: modal.payment.frequency,
            }}
            submitLabel="Save changes"
            onCancel={closeModal}
            onSubmit={(values) => handleEditSubmit(modal.payment.id, values)}
          />
        </Modal>
      )}

      {modal?.kind === 'cancel' && (
        <Modal titleId="cancel-payment-title" onClose={closeModal}>
          <CancelConfirmDialog
            payment={modal.payment}
            titleId="cancel-payment-title"
            onKeep={closeModal}
            onConfirm={() => handleCancelConfirm(modal.payment.id)}
          />
        </Modal>
      )}
    </div>
  );
}

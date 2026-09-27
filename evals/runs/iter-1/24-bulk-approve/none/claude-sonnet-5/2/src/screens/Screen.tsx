import { useEffect, useRef, useState } from 'react';
import styles from './Screen.module.css';

type ExpenseStatus = 'pending' | 'approved' | 'rejected';

interface ExpenseRequest {
  id: string;
  employeeName: string;
  employeeInitials: string;
  category: string;
  amount: number;
  dateSubmitted: string;
  status: ExpenseStatus;
  decisionReason?: string;
}

const initialRequests: ExpenseRequest[] = [
  { id: 'exp-1', employeeName: 'Priya Sharma', employeeInitials: 'PS', category: 'Travel', amount: 24500, dateSubmitted: '2026-09-24', status: 'pending' },
  { id: 'exp-2', employeeName: 'Rohan Mehta', employeeInitials: 'RM', category: 'Meals & Entertainment', amount: 1850, dateSubmitted: '2026-09-23', status: 'pending' },
  { id: 'exp-3', employeeName: 'Ananya Iyer', employeeInitials: 'AI', category: 'Office Supplies', amount: 3200, dateSubmitted: '2026-09-23', status: 'pending' },
  { id: 'exp-4', employeeName: 'Karan Verma', employeeInitials: 'KV', category: 'Software & Subscriptions', amount: 12999, dateSubmitted: '2026-09-22', status: 'pending' },
  { id: 'exp-5', employeeName: 'Sneha Nair', employeeInitials: 'SN', category: 'Lodging', amount: 18400, dateSubmitted: '2026-09-21', status: 'pending' },
  { id: 'exp-6', employeeName: 'Arjun Desai', employeeInitials: 'AD', category: 'Transportation', amount: 950, dateSubmitted: '2026-09-20', status: 'pending' },
  { id: 'exp-7', employeeName: 'Meera Pillai', employeeInitials: 'MP', category: 'Training', amount: 7500, dateSubmitted: '2026-09-19', status: 'pending' },
  { id: 'exp-8', employeeName: 'Vikram Rao', employeeInitials: 'VR', category: 'Equipment', amount: 45200, dateSubmitted: '2026-09-18', status: 'pending' },
  { id: 'exp-9', employeeName: 'Isha Kapoor', employeeInitials: 'IK', category: 'Client Entertainment', amount: 6300, dateSubmitted: '2026-09-17', status: 'pending' },
  { id: 'exp-10', employeeName: 'Aditya Joshi', employeeInitials: 'AJ', category: 'Miscellaneous', amount: 1200, dateSubmitted: '2026-09-16', status: 'pending' },
];

const currencyFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

const dateFormatter = new Intl.DateTimeFormat('en-IN', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});

type ActionMessage = { kind: 'approved' | 'rejected'; count: number };

export default function Screen() {
  const [requests, setRequests] = useState<ExpenseRequest[]>(initialRequests);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectError, setRejectError] = useState('');
  const [message, setMessage] = useState<ActionMessage | null>(null);

  const selectAllRef = useRef<HTMLInputElement>(null);
  const reasonRef = useRef<HTMLTextAreaElement>(null);

  const pendingRequests = requests.filter((r) => r.status === 'pending');
  const allPendingSelected =
    pendingRequests.length > 0 && pendingRequests.every((r) => selectedIds.has(r.id));
  const someSelected = selectedIds.size > 0 && !allPendingSelected;

  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = someSelected;
    }
  }, [someSelected]);

  useEffect(() => {
    if (rejectDialogOpen) {
      reasonRef.current?.focus();
    }
  }, [rejectDialogOpen]);

  function toggleSelectAll() {
    if (allPendingSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(pendingRequests.map((r) => r.id)));
    }
  }

  function toggleOne(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function handleApprove() {
    if (selectedIds.size === 0) return;
    const count = selectedIds.size;
    setRequests((prev) =>
      prev.map((r) => (selectedIds.has(r.id) ? { ...r, status: 'approved' as const } : r)),
    );
    setSelectedIds(new Set());
    setMessage({ kind: 'approved', count });
  }

  function openRejectDialog() {
    if (selectedIds.size === 0) return;
    setRejectReason('');
    setRejectError('');
    setRejectDialogOpen(true);
  }

  function closeRejectDialog() {
    setRejectDialogOpen(false);
    setRejectReason('');
    setRejectError('');
  }

  function confirmReject() {
    if (!rejectReason.trim()) {
      setRejectError('Please provide a reason for rejection.');
      return;
    }
    const count = selectedIds.size;
    const reason = rejectReason.trim();
    setRequests((prev) =>
      prev.map((r) =>
        selectedIds.has(r.id) ? { ...r, status: 'rejected' as const, decisionReason: reason } : r,
      ),
    );
    setSelectedIds(new Set());
    setMessage({ kind: 'rejected', count });
    closeRejectDialog();
  }

  const selectedCount = selectedIds.size;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Expense approvals</h1>
        <p className={styles.subtitle}>
          {pendingRequests.length} of {requests.length} requests awaiting your decision
        </p>
      </header>

      {message && (
        <div
          className={
            message.kind === 'approved' ? styles.bannerApproved : styles.bannerRejected
          }
          role="status"
        >
          <span>
            {message.count} request{message.count === 1 ? '' : 's'}{' '}
            {message.kind === 'approved' ? 'approved' : 'rejected'}.
          </span>
          <button
            type="button"
            className={styles.bannerClose}
            onClick={() => setMessage(null)}
            aria-label="Dismiss message"
          >
            ×
          </button>
        </div>
      )}

      <div className={styles.toolbar}>
        <span className={styles.toolbarInfo}>
          {selectedCount > 0 ? `${selectedCount} selected` : 'Select requests to take action'}
        </span>
        <div className={styles.toolbarActions}>
          <button
            type="button"
            className={styles.btnDanger}
            onClick={openRejectDialog}
            disabled={selectedCount === 0}
          >
            Reject
          </button>
          <button
            type="button"
            className={styles.btnPrimary}
            onClick={handleApprove}
            disabled={selectedCount === 0}
          >
            Approve
          </button>
        </div>
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.checkboxCell}>
                <input
                  ref={selectAllRef}
                  type="checkbox"
                  aria-label="Select all pending requests"
                  checked={allPendingSelected}
                  onChange={toggleSelectAll}
                  disabled={pendingRequests.length === 0}
                />
              </th>
              <th>Employee</th>
              <th>Category</th>
              <th className={styles.amountCell}>Amount</th>
              <th>Date submitted</th>
              <th>Receipt</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {requests.map((r) => (
              <tr key={r.id} className={selectedIds.has(r.id) ? styles.rowSelected : undefined}>
                <td className={styles.checkboxCell}>
                  <input
                    type="checkbox"
                    aria-label={`Select request from ${r.employeeName}`}
                    checked={selectedIds.has(r.id)}
                    onChange={() => toggleOne(r.id)}
                    disabled={r.status !== 'pending'}
                  />
                </td>
                <td>
                  <div className={styles.employeeCell}>
                    <span className={styles.avatar} aria-hidden="true">
                      {r.employeeInitials}
                    </span>
                    <span>{r.employeeName}</span>
                  </div>
                </td>
                <td>{r.category}</td>
                <td className={styles.amountCell}>{currencyFormatter.format(r.amount)}</td>
                <td>{dateFormatter.format(new Date(r.dateSubmitted))}</td>
                <td>
                  <a
                    className={styles.receiptLink}
                    href="#"
                    onClick={(e) => e.preventDefault()}
                  >
                    View receipt
                  </a>
                </td>
                <td>
                  <span
                    className={
                      r.status === 'approved'
                        ? styles.statusApproved
                        : r.status === 'rejected'
                          ? styles.statusRejected
                          : styles.statusPending
                    }
                  >
                    {r.status === 'approved' ? 'Approved' : r.status === 'rejected' ? 'Rejected' : 'Pending'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {rejectDialogOpen && (
        <div className={styles.dialogOverlay} onClick={closeRejectDialog}>
          <div
            className={styles.dialog}
            role="dialog"
            aria-modal="true"
            aria-labelledby="reject-dialog-title"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="reject-dialog-title" className={styles.dialogTitle}>
              Reject {selectedCount} request{selectedCount === 1 ? '' : 's'}
            </h2>
            <label className={styles.dialogLabel} htmlFor="reject-reason">
              Reason for rejection
            </label>
            <textarea
              ref={reasonRef}
              id="reject-reason"
              className={styles.textarea}
              value={rejectReason}
              onChange={(e) => {
                setRejectReason(e.target.value);
                if (rejectError) setRejectError('');
              }}
              rows={4}
              placeholder="Explain why these requests are being rejected"
            />
            {rejectError && <p className={styles.errorText}>{rejectError}</p>}
            <div className={styles.dialogActions}>
              <button type="button" className={styles.btnGhost} onClick={closeRejectDialog}>
                Cancel
              </button>
              <button type="button" className={styles.btnDanger} onClick={confirmReject}>
                Reject request{selectedCount === 1 ? '' : 's'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

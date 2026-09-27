import { useMemo, useState } from 'react';
import styles from './Screen.module.css';

type Status = 'pending' | 'approved' | 'rejected';

interface ExpenseRequest {
  id: string;
  employee: string;
  category: string;
  amount: number;
  currency: string;
  dateSubmitted: string;
  receiptUrl: string;
  status: Status;
  reason?: string;
}

const initialRequests: ExpenseRequest[] = [
  {
    id: 'r1',
    employee: 'Priya Nair',
    category: 'Travel',
    amount: 482.5,
    currency: 'USD',
    dateSubmitted: '2026-09-12',
    receiptUrl: '/receipts/RCPT-1001.pdf',
    status: 'pending',
  },
  {
    id: 'r2',
    employee: 'Daniel Osei',
    category: 'Meals',
    amount: 64.2,
    currency: 'USD',
    dateSubmitted: '2026-09-15',
    receiptUrl: '/receipts/RCPT-1002.pdf',
    status: 'pending',
  },
  {
    id: 'r3',
    employee: 'Maya Chen',
    category: 'Office supplies',
    amount: 129.99,
    currency: 'USD',
    dateSubmitted: '2026-09-16',
    receiptUrl: '/receipts/RCPT-1003.pdf',
    status: 'pending',
  },
  {
    id: 'r4',
    employee: 'Anuj Patel',
    category: 'Software',
    amount: 899,
    currency: 'USD',
    dateSubmitted: '2026-09-17',
    receiptUrl: '/receipts/RCPT-1004.pdf',
    status: 'pending',
  },
  {
    id: 'r5',
    employee: 'Sofia Rossi',
    category: 'Lodging',
    amount: 612.75,
    currency: 'USD',
    dateSubmitted: '2026-09-18',
    receiptUrl: '/receipts/RCPT-1005.pdf',
    status: 'pending',
  },
  {
    id: 'r6',
    employee: 'Kenji Watanabe',
    category: 'Transportation',
    amount: 38.4,
    currency: 'USD',
    dateSubmitted: '2026-09-19',
    receiptUrl: '/receipts/RCPT-1006.pdf',
    status: 'pending',
  },
  {
    id: 'r7',
    employee: 'Fatima Al-Sayed',
    category: 'Client entertainment',
    amount: 245.0,
    currency: 'USD',
    dateSubmitted: '2026-09-21',
    receiptUrl: '/receipts/RCPT-1007.pdf',
    status: 'pending',
  },
  {
    id: 'r8',
    employee: 'Liam O’Connor',
    category: 'Training',
    amount: 1250,
    currency: 'USD',
    dateSubmitted: '2026-09-22',
    receiptUrl: '/receipts/RCPT-1008.pdf',
    status: 'pending',
  },
  {
    id: 'r9',
    employee: 'Grace Mwangi',
    category: 'Equipment',
    amount: 349.5,
    currency: 'USD',
    dateSubmitted: '2026-09-24',
    receiptUrl: '/receipts/RCPT-1009.pdf',
    status: 'pending',
  },
  {
    id: 'r10',
    employee: 'Noah Kim',
    category: 'Miscellaneous',
    amount: 22.15,
    currency: 'USD',
    dateSubmitted: '2026-09-25',
    receiptUrl: '/receipts/RCPT-1010.pdf',
    status: 'pending',
  },
];

function formatAmount(amount: number, currency: string) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function statusLabel(status: Status) {
  if (status === 'approved') return 'Approved';
  if (status === 'rejected') return 'Rejected';
  return 'Pending';
}

export default function Screen() {
  const [requests, setRequests] = useState<ExpenseRequest[]>(initialRequests);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [message, setMessage] = useState<string | null>(null);
  const [isRejecting, setIsRejecting] = useState(false);
  const [reason, setReason] = useState('');
  const [reasonError, setReasonError] = useState<string | null>(null);

  const pendingIds = useMemo(
    () => requests.filter((r) => r.status === 'pending').map((r) => r.id),
    [requests],
  );
  const allPendingSelected = pendingIds.length > 0 && pendingIds.every((id) => selected.has(id));
  const selectedCount = selected.size;

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function toggleSelectAll() {
    setSelected((prev) => {
      if (pendingIds.length > 0 && pendingIds.every((id) => prev.has(id))) {
        return new Set();
      }
      return new Set(pendingIds);
    });
  }

  function handleApprove() {
    if (selectedCount === 0) return;
    const count = selectedCount;
    setRequests((prev) =>
      prev.map((r) => (selected.has(r.id) ? { ...r, status: 'approved' as const } : r)),
    );
    setSelected(new Set());
    setMessage(`${count} request${count === 1 ? '' : 's'} approved.`);
  }

  function openRejectDialog() {
    if (selectedCount === 0) return;
    setReason('');
    setReasonError(null);
    setIsRejecting(true);
  }

  function cancelReject() {
    setIsRejecting(false);
    setReason('');
    setReasonError(null);
  }

  function confirmReject() {
    const trimmed = reason.trim();
    if (trimmed === '') {
      setReasonError('Enter a reason for rejecting these requests.');
      return;
    }
    const count = selectedCount;
    setRequests((prev) =>
      prev.map((r) =>
        selected.has(r.id) ? { ...r, status: 'rejected' as const, reason: trimmed } : r,
      ),
    );
    setSelected(new Set());
    setIsRejecting(false);
    setReason('');
    setReasonError(null);
    setMessage(`${count} request${count === 1 ? '' : 's'} rejected.`);
  }

  return (
    <div className={styles.screen}>
      <header className={styles.header}>
        <h1 className={styles.title}>Expense approvals</h1>
        <p className={styles.subtitle}>
          {pendingIds.length} of {requests.length} requests are pending review.
        </p>
      </header>

      {message && (
        <div className={styles.banner} role="status" aria-live="polite">
          {message}
        </div>
      )}

      <div className={styles.toolbar}>
        <span className={styles.selectionCount}>
          {selectedCount} selected
        </span>
        <div className={styles.toolbarActions}>
          <button
            type="button"
            className={styles.rejectButton}
            disabled={selectedCount === 0}
            onClick={openRejectDialog}
          >
            Reject
          </button>
          <button
            type="button"
            className={styles.approveButton}
            disabled={selectedCount === 0}
            onClick={handleApprove}
          >
            Approve
          </button>
        </div>
      </div>

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.checkboxCell}>
                <input
                  type="checkbox"
                  checked={allPendingSelected}
                  onChange={toggleSelectAll}
                  disabled={pendingIds.length === 0}
                  aria-label="Select all pending requests"
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
              <tr key={r.id} className={r.status !== 'pending' ? styles.rowInactive : undefined}>
                <td className={styles.checkboxCell}>
                  <input
                    type="checkbox"
                    checked={selected.has(r.id)}
                    onChange={() => toggleSelect(r.id)}
                    disabled={r.status !== 'pending'}
                    aria-label={`Select request from ${r.employee}`}
                  />
                </td>
                <td>{r.employee}</td>
                <td>{r.category}</td>
                <td className={styles.amountCell}>{formatAmount(r.amount, r.currency)}</td>
                <td>{formatDate(r.dateSubmitted)}</td>
                <td>
                  <a href={r.receiptUrl} target="_blank" rel="noreferrer" className={styles.receiptLink}>
                    View receipt
                  </a>
                </td>
                <td>
                  <span className={`${styles.statusBadge} ${styles[`status-${r.status}`]}`}>
                    {statusLabel(r.status)}
                  </span>
                  {r.status === 'rejected' && r.reason && (
                    <span className={styles.reasonText}> &mdash; {r.reason}</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isRejecting && (
        <div className={styles.overlay} role="presentation" onClick={cancelReject}>
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
            <label htmlFor="reject-reason" className={styles.dialogLabel}>
              Reason for rejection
            </label>
            <textarea
              id="reject-reason"
              className={styles.textarea}
              rows={4}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Explain why these requests are being rejected"
            />
            {reasonError && <p className={styles.errorText}>{reasonError}</p>}
            <div className={styles.dialogActions}>
              <button type="button" className={styles.secondaryButton} onClick={cancelReject}>
                Cancel
              </button>
              <button type="button" className={styles.rejectButton} onClick={confirmReject}>
                Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

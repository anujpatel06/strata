import { useMemo, useState } from 'react';
import {
  Amount,
  Badge,
  Button,
  DataTable,
  DataTableToolbar,
  Dialog,
  Link,
  Tag,
  TextArea,
  ToastRegion,
  toast,
  type DataTableColumn,
  type DataTableSelection,
} from '@strata/react';
import { IconExternalLink } from '@strata/icons';
import styles from './Screen.module.css';

type Status = 'pending' | 'approved' | 'rejected';

type ExpenseRequest = {
  id: string;
  employee: string;
  category: string;
  amount: number;
  currency: string;
  dateSubmitted: Date;
  receiptUrl: string;
  status: Status;
  reason?: string;
};

const initialRequests: ExpenseRequest[] = [
  { id: 'EXP-1001', employee: 'Asha Menon', category: 'Travel', amount: 482.5, currency: 'USD', dateSubmitted: new Date(2026, 8, 12), receiptUrl: 'https://receipts.example.com/EXP-1001', status: 'pending' },
  { id: 'EXP-1002', employee: 'Daniel Okafor', category: 'Meals', amount: 64.2, currency: 'USD', dateSubmitted: new Date(2026, 8, 14), receiptUrl: 'https://receipts.example.com/EXP-1002', status: 'pending' },
  { id: 'EXP-1003', employee: 'Mei Lin', category: 'Software', amount: 199.0, currency: 'USD', dateSubmitted: new Date(2026, 8, 15), receiptUrl: 'https://receipts.example.com/EXP-1003', status: 'pending' },
  { id: 'EXP-1004', employee: 'Omar Haddad', category: 'Lodging', amount: 812.75, currency: 'USD', dateSubmitted: new Date(2026, 8, 16), receiptUrl: 'https://receipts.example.com/EXP-1004', status: 'pending' },
  { id: 'EXP-1005', employee: 'Sofia Rossi', category: 'Travel', amount: 305.4, currency: 'USD', dateSubmitted: new Date(2026, 8, 17), receiptUrl: 'https://receipts.example.com/EXP-1005', status: 'pending' },
  { id: 'EXP-1006', employee: 'Kiran Rao', category: 'Office supplies', amount: 47.9, currency: 'USD', dateSubmitted: new Date(2026, 8, 18), receiptUrl: 'https://receipts.example.com/EXP-1006', status: 'pending' },
  { id: 'EXP-1007', employee: 'Lucas Martin', category: 'Meals', amount: 38.6, currency: 'USD', dateSubmitted: new Date(2026, 8, 19), receiptUrl: 'https://receipts.example.com/EXP-1007', status: 'pending' },
  { id: 'EXP-1008', employee: 'Priya Nair', category: 'Training', amount: 1250.0, currency: 'USD', dateSubmitted: new Date(2026, 8, 20), receiptUrl: 'https://receipts.example.com/EXP-1008', status: 'pending' },
  { id: 'EXP-1009', employee: 'Noah Fischer', category: 'Travel', amount: 264.15, currency: 'USD', dateSubmitted: new Date(2026, 8, 21), receiptUrl: 'https://receipts.example.com/EXP-1009', status: 'pending' },
  { id: 'EXP-1010', employee: 'Hana Suzuki', category: 'Software', amount: 89.0, currency: 'USD', dateSubmitted: new Date(2026, 8, 22), receiptUrl: 'https://receipts.example.com/EXP-1010', status: 'pending' },
];

const dateFormat = new Intl.DateTimeFormat('en-US', { day: 'numeric', month: 'short', year: 'numeric' });

const statusTone = { pending: 'neutral', approved: 'success', rejected: 'danger' } as const;
const statusLabel = { pending: 'Pending', approved: 'Approved', rejected: 'Rejected' } as const;

export default function Screen() {
  const [requests, setRequests] = useState(initialRequests);
  const [selected, setSelected] = useState<DataTableSelection>(new Set());
  const [isRejectOpen, setIsRejectOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [reasonError, setReasonError] = useState('');

  const selectedIds = useMemo(
    () => (selected === 'all' ? requests.filter((r) => r.status === 'pending').map((r) => r.id) : [...selected].map(String)),
    [selected, requests],
  );
  const selectedCount = selectedIds.length;

  const columns: DataTableColumn<ExpenseRequest>[] = [
    { id: 'employee', header: 'Employee', isRowHeader: true, cell: (r) => r.employee },
    { id: 'category', header: 'Category', cell: (r) => <Tag size="sm">{r.category}</Tag> },
    { id: 'amount', header: 'Amount', align: 'end', cell: (r) => <Amount value={r.amount} currency={r.currency} size="sm" /> },
    { id: 'dateSubmitted', header: 'Date submitted', cell: (r) => dateFormat.format(r.dateSubmitted) },
    {
      id: 'receipt',
      header: 'Receipt',
      cell: (r) => (
        <Link variant="standalone" href={r.receiptUrl} target="_blank" rel="noreferrer">
          View receipt
          <IconExternalLink aria-hidden />
        </Link>
      ),
    },
    { id: 'status', header: 'Status', cell: (r) => <Badge variant="status" tone={statusTone[r.status]}>{statusLabel[r.status]}</Badge> },
  ];

  function approveSelected() {
    const ids = new Set(selectedIds);
    setRequests((prev) => prev.map((r) => (ids.has(r.id) ? { ...r, status: 'approved', reason: undefined } : r)));
    setSelected(new Set());
    toast({ title: `${ids.size} request${ids.size === 1 ? '' : 's'} approved`, tone: 'success' });
  }

  function openReject() {
    setReason('');
    setReasonError('');
    setIsRejectOpen(true);
  }

  function confirmReject() {
    if (!reason.trim()) {
      setReasonError('Enter a reason for rejecting these requests.');
      return;
    }
    const ids = new Set(selectedIds);
    setRequests((prev) => prev.map((r) => (ids.has(r.id) ? { ...r, status: 'rejected', reason: reason.trim() } : r)));
    setSelected(new Set());
    setIsRejectOpen(false);
    toast({ title: `${ids.size} request${ids.size === 1 ? '' : 's'} rejected`, tone: 'danger' });
  }

  return (
    <div className={styles.screen}>
      <header className={styles.header}>
        <h1 className={styles.title}>Expense approvals</h1>
        <p className={styles.subtitle}>Review and act on your team's submitted expense requests.</p>
      </header>

      <DataTableToolbar>
        <span className={styles.selectionSummary}>
          {selectedCount > 0 ? `${selectedCount} selected` : 'Select requests to approve or reject'}
        </span>
        <Button variant="outline" tone="danger" isDisabled={!selectedCount} onPress={openReject}>
          Reject{selectedCount ? ` (${selectedCount})` : ''}
        </Button>
        <Button variant="primary" isDisabled={!selectedCount} onPress={approveSelected}>
          Approve{selectedCount ? ` (${selectedCount})` : ''}
        </Button>
      </DataTableToolbar>

      <DataTable
        aria-label="Expense requests"
        columns={columns}
        rows={requests}
        getRowId={(r) => r.id}
        selectionMode="multiple"
        selectedKeys={selected}
        onSelectionChange={setSelected}
        disabledKeys={requests.filter((r) => r.status !== 'pending').map((r) => r.id)}
      />

      <Dialog
        title="Reject requests"
        description="This reason is shared with the employees whose requests you reject."
        isOpen={isRejectOpen}
        onOpenChange={setIsRejectOpen}
        footer={({ close }) => (
          <>
            <Button variant="outline" onPress={close}>
              Cancel
            </Button>
            <Button variant="primary" tone="danger" onPress={confirmReject}>
              Reject {selectedCount} request{selectedCount === 1 ? '' : 's'}
            </Button>
          </>
        )}
      >
        <TextArea
          label="Reason for rejection"
          value={reason}
          onChange={(value) => {
            setReason(value);
            if (value.trim()) setReasonError('');
          }}
          isRequired
          isInvalid={!!reasonError}
          errorMessage={reasonError}
          rows={4}
        />
      </Dialog>

      <ToastRegion />
    </div>
  );
}

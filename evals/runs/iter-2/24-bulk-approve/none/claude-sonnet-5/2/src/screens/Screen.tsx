import { useMemo, useState } from 'react';
import { useLocale, type Key } from 'react-aria-components';
import {
  Alert,
  Amount,
  Badge,
  Button,
  DataTable,
  DataTableToolbar,
  Dialog,
  Eyebrow,
  Link,
  PersonChip,
  TextArea,
  toast,
  ToastRegion,
  type DataTableColumn,
  type DataTableSelection,
} from '@strata/react';
import { IconExternalLink, IconReceipt } from '@strata/icons';
import styles from './Screen.module.css';

type RequestStatus = 'pending' | 'approved' | 'rejected';

interface ExpenseRequest {
  id: string;
  employee: string;
  category: string;
  amount: number;
  currency: string;
  dateSubmitted: string;
  receiptUrl: string;
  status: RequestStatus;
  rejectionReason?: string;
}

const initialRequests: ExpenseRequest[] = [
  { id: 'exp-1001', employee: 'Priya Sharma', category: 'Travel', amount: 482.5, currency: 'USD', dateSubmitted: '2026-09-12', receiptUrl: 'https://receipts.example.com/r/exp-1001.pdf', status: 'pending' },
  { id: 'exp-1002', employee: 'Arjun Mehta', category: 'Meals', amount: 64.2, currency: 'USD', dateSubmitted: '2026-09-14', receiptUrl: 'https://receipts.example.com/r/exp-1002.pdf', status: 'pending' },
  { id: 'exp-1003', employee: 'Wei Chen', category: 'Software', amount: 199.0, currency: 'USD', dateSubmitted: '2026-09-15', receiptUrl: 'https://receipts.example.com/r/exp-1003.pdf', status: 'pending' },
  { id: 'exp-1004', employee: 'Fatima Al-Sayed', category: 'Lodging', amount: 812.75, currency: 'USD', dateSubmitted: '2026-09-16', receiptUrl: 'https://receipts.example.com/r/exp-1004.pdf', status: 'pending' },
  { id: 'exp-1005', employee: 'Daniel Okafor', category: 'Client entertainment', amount: 156.4, currency: 'USD', dateSubmitted: '2026-09-18', receiptUrl: 'https://receipts.example.com/r/exp-1005.pdf', status: 'pending' },
  { id: 'exp-1006', employee: 'Sofia Rossi', category: 'Training', amount: 340.0, currency: 'USD', dateSubmitted: '2026-09-19', receiptUrl: 'https://receipts.example.com/r/exp-1006.pdf', status: 'pending' },
  { id: 'exp-1007', employee: 'Liam Murphy', category: 'Equipment', amount: 275.99, currency: 'USD', dateSubmitted: '2026-09-21', receiptUrl: 'https://receipts.example.com/r/exp-1007.pdf', status: 'pending' },
  { id: 'exp-1008', employee: 'Aiko Tanaka', category: 'Transportation', amount: 38.5, currency: 'USD', dateSubmitted: '2026-09-22', receiptUrl: 'https://receipts.example.com/r/exp-1008.pdf', status: 'pending' },
  { id: 'exp-1009', employee: 'Noah Fischer', category: 'Office supplies', amount: 92.1, currency: 'USD', dateSubmitted: '2026-09-24', receiptUrl: 'https://receipts.example.com/r/exp-1009.pdf', status: 'pending' },
  { id: 'exp-1010', employee: 'Grace Kim', category: 'Miscellaneous', amount: 120.0, currency: 'USD', dateSubmitted: '2026-09-25', receiptUrl: 'https://receipts.example.com/r/exp-1010.pdf', status: 'pending' },
];

function statusTone(status: RequestStatus): 'warning' | 'success' | 'danger' {
  if (status === 'approved') return 'success';
  if (status === 'rejected') return 'danger';
  return 'warning';
}

function statusLabel(status: RequestStatus): string {
  if (status === 'approved') return 'Approved';
  if (status === 'rejected') return 'Rejected';
  return 'Pending';
}

function pluralize(count: number, noun: string): string {
  return `${count} ${noun}${count === 1 ? '' : 's'}`;
}

export default function Screen() {
  const { locale } = useLocale();
  const dateFormatter = useMemo(
    () => new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short', year: 'numeric' }),
    [locale],
  );
  const [requests, setRequests] = useState<ExpenseRequest[]>(initialRequests);
  const [selection, setSelection] = useState<DataTableSelection>(new Set<Key>());
  const [isRejectOpen, setIsRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [lastOutcome, setLastOutcome] = useState<{ action: 'approved' | 'rejected'; count: number } | null>(null);

  const pendingIds = useMemo(() => requests.filter((r) => r.status === 'pending').map((r) => r.id), [requests]);

  const selectedIds = useMemo(() => {
    if (selection === 'all') return pendingIds;
    return pendingIds.filter((id) => selection.has(id));
  }, [selection, pendingIds]);

  const selectedCount = selectedIds.length;

  function applyDecision(status: 'approved' | 'rejected', reason?: string) {
    const ids = new Set(selectedIds);
    setRequests((prev) =>
      prev.map((r) => (ids.has(r.id) ? { ...r, status, rejectionReason: status === 'rejected' ? reason : undefined } : r)),
    );
    setSelection(new Set<Key>());
    setLastOutcome({ action: status, count: ids.size });
    toast({
      title: `${pluralize(ids.size, 'request')} ${status}`,
      tone: status === 'approved' ? 'success' : 'danger',
    });
  }

  function handleApprove() {
    applyDecision('approved');
  }

  function openRejectDialog() {
    setRejectReason('');
    setIsRejectOpen(true);
  }

  function confirmReject() {
    applyDecision('rejected', rejectReason.trim());
    setIsRejectOpen(false);
  }

  const columns: DataTableColumn<ExpenseRequest>[] = [
    {
      id: 'employee',
      header: 'Employee',
      isRowHeader: true,
      cell: (row) => <PersonChip name={row.employee} size="sm" />,
    },
    {
      id: 'category',
      header: 'Category',
      cell: (row) => row.category,
    },
    {
      id: 'amount',
      header: 'Amount',
      align: 'end',
      cell: (row) => <Amount value={row.amount} currency={row.currency} size="sm" />,
    },
    {
      id: 'date',
      header: 'Date submitted',
      align: 'end',
      cell: (row) => dateFormatter.format(new Date(row.dateSubmitted)),
    },
    {
      id: 'receipt',
      header: 'Receipt',
      cell: (row) => (
        <Link href={row.receiptUrl} target="_blank" rel="noopener noreferrer" variant="standalone">
          <IconReceipt aria-hidden /> View receipt <IconExternalLink size="0.9em" aria-hidden />
        </Link>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      cell: (row) => (
        <Badge tone={statusTone(row.status)} variant="soft">
          {statusLabel(row.status)}
        </Badge>
      ),
    },
  ];

  const disabledKeys = useMemo(
    () => new Set(requests.filter((r) => r.status !== 'pending').map((r) => r.id)),
    [requests],
  );

  return (
    <div className={styles.screen}>
      <ToastRegion />
      <header className={styles.header}>
        <Eyebrow>Approvals</Eyebrow>
        <h1 className={styles.title}>Expense requests</h1>
        <p className={styles.subtitle}>
          Review the requests below, select the ones you want to act on, then approve or reject them together.
        </p>
      </header>

      {lastOutcome && (
        <Alert
          tone={lastOutcome.action === 'approved' ? 'success' : 'danger'}
          title={
            lastOutcome.action === 'approved'
              ? `${pluralize(lastOutcome.count, 'request')} approved`
              : `${pluralize(lastOutcome.count, 'request')} rejected`
          }
          onDismiss={() => setLastOutcome(null)}
          live="polite"
        />
      )}

      <DataTableToolbar>
        <span className={styles.selectionSummary}>
          {selectedCount > 0 ? pluralize(selectedCount, 'request') + ' selected' : 'Select requests to approve or reject'}
        </span>
        <span className={styles.actions}>
          <Button variant="primary" size="sm" isDisabled={selectedCount === 0} onPress={handleApprove}>
            Approve
          </Button>
          <Button variant="outline" tone="danger" size="sm" isDisabled={selectedCount === 0} onPress={openRejectDialog}>
            Reject
          </Button>
        </span>
      </DataTableToolbar>

      <DataTable
        aria-label="Expense requests"
        columns={columns}
        rows={requests}
        getRowId={(row) => row.id}
        selectionMode="multiple"
        selectedKeys={selection}
        onSelectionChange={setSelection}
        disabledKeys={disabledKeys}
      />

      <Dialog
        title="Reject expense requests"
        description={`This will reject ${pluralize(selectedCount, 'request')}. Let the employee know why.`}
        isOpen={isRejectOpen}
        onOpenChange={setIsRejectOpen}
        size="sm"
        footer={({ close }) => (
          <>
            <Button variant="outline" onPress={close}>
              Cancel
            </Button>
            <Button variant="primary" tone="danger" isDisabled={rejectReason.trim() === ''} onPress={confirmReject}>
              Reject {pluralize(selectedCount, 'request')}
            </Button>
          </>
        )}
      >
        <TextArea
          label="Reason for rejection"
          placeholder="e.g. Missing itemized receipt"
          value={rejectReason}
          onChange={setRejectReason}
          isRequired
          rows={4}
        />
      </Dialog>
    </div>
  );
}

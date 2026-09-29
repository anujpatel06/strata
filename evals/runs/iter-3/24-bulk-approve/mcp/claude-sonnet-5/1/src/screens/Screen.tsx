import { useMemo, useState } from 'react';
import {
  Amount,
  Badge,
  Button,
  DataTable,
  DataTableToolbar,
  Dialog,
  DialogTrigger,
  Eyebrow,
  Link,
  TextArea,
  ToastRegion,
  toast,
  type DataTableColumn,
  type DataTableSelection,
} from '@syntara/react';
import { IconExternalLink } from '@syntara/icons';
import styles from './Screen.module.css';

type Status = 'pending' | 'approved' | 'rejected';

type ExpenseRequest = {
  id: string;
  employee: string;
  category: string;
  amount: number;
  currency: string;
  dateSubmitted: string;
  receiptUrl: string;
  status: Status;
};

const initialRequests: ExpenseRequest[] = [
  { id: 'EXP-1001', employee: 'Asha Menon', category: 'Travel', amount: 18400, currency: 'INR', dateSubmitted: '2026-09-12', receiptUrl: 'https://example.com/receipts/EXP-1001', status: 'pending' },
  { id: 'EXP-1002', employee: 'Daniel Okafor', category: 'Meals', amount: 2150, currency: 'INR', dateSubmitted: '2026-09-14', receiptUrl: 'https://example.com/receipts/EXP-1002', status: 'pending' },
  { id: 'EXP-1003', employee: 'Mei Lin', category: 'Software', amount: 9600, currency: 'INR', dateSubmitted: '2026-09-15', receiptUrl: 'https://example.com/receipts/EXP-1003', status: 'pending' },
  { id: 'EXP-1004', employee: 'Omar Haddad', category: 'Travel', amount: 32750, currency: 'INR', dateSubmitted: '2026-09-16', receiptUrl: 'https://example.com/receipts/EXP-1004', status: 'pending' },
  { id: 'EXP-1005', employee: 'Sofia Rossi', category: 'Office supplies', amount: 1280, currency: 'INR', dateSubmitted: '2026-09-17', receiptUrl: 'https://example.com/receipts/EXP-1005', status: 'pending' },
  { id: 'EXP-1006', employee: 'Kiran Rao', category: 'Meals', amount: 3400, currency: 'INR', dateSubmitted: '2026-09-18', receiptUrl: 'https://example.com/receipts/EXP-1006', status: 'pending' },
  { id: 'EXP-1007', employee: 'Lucas Martin', category: 'Training', amount: 21000, currency: 'INR', dateSubmitted: '2026-09-20', receiptUrl: 'https://example.com/receipts/EXP-1007', status: 'pending' },
  { id: 'EXP-1008', employee: 'Priya Nair', category: 'Travel', amount: 15600, currency: 'INR', dateSubmitted: '2026-09-21', receiptUrl: 'https://example.com/receipts/EXP-1008', status: 'pending' },
  { id: 'EXP-1009', employee: 'Chen Wei', category: 'Software', amount: 7800, currency: 'INR', dateSubmitted: '2026-09-23', receiptUrl: 'https://example.com/receipts/EXP-1009', status: 'pending' },
  { id: 'EXP-1010', employee: 'Fatima Sheikh', category: 'Office supplies', amount: 960, currency: 'INR', dateSubmitted: '2026-09-24', receiptUrl: 'https://example.com/receipts/EXP-1010', status: 'pending' },
];

const dateFormatter = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

const statusTone = { pending: 'warning', approved: 'success', rejected: 'danger' } as const;
const statusLabel = { pending: 'Pending', approved: 'Approved', rejected: 'Rejected' } as const;

export default function Screen() {
  const [requests, setRequests] = useState(initialRequests);
  const [selected, setSelected] = useState<DataTableSelection>(new Set());
  const [reason, setReason] = useState('');
  const [isRejectOpen, setIsRejectOpen] = useState(false);

  const pendingIds = useMemo(() => requests.filter((r) => r.status === 'pending').map((r) => r.id), [requests]);
  const disabledKeys = useMemo(() => requests.filter((r) => r.status !== 'pending').map((r) => r.id), [requests]);
  const selectedIds = selected === 'all' ? pendingIds : [...selected].filter((id) => pendingIds.includes(id as string)) as string[];
  const selectedCount = selectedIds.length;

  const columns: DataTableColumn<ExpenseRequest>[] = [
    { id: 'employee', header: 'Employee', isRowHeader: true, cell: (r) => r.employee },
    { id: 'category', header: 'Category', cell: (r) => r.category },
    {
      id: 'amount',
      header: 'Amount',
      align: 'end',
      cell: (r) => <Amount value={r.amount} currency={r.currency} size="sm" />,
    },
    { id: 'date', header: 'Date submitted', cell: (r) => dateFormatter.format(new Date(r.dateSubmitted)) },
    {
      id: 'receipt',
      header: 'Receipt',
      cell: (r) => (
        <Link href={r.receiptUrl} target="_blank" variant="standalone">
          View receipt
          <IconExternalLink aria-hidden style={{ marginInlineStart: 'var(--syntara-space-1)' }} />
        </Link>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      cell: (r) => (
        <Badge variant="status" tone={statusTone[r.status]}>
          {statusLabel[r.status]}
        </Badge>
      ),
    },
  ];

  function approveSelected() {
    const ids = new Set(selectedIds);
    setRequests((prev) => prev.map((r) => (ids.has(r.id) ? { ...r, status: 'approved' as const } : r)));
    setSelected(new Set());
    toast({
      title: `${selectedCount} request${selectedCount === 1 ? '' : 's'} approved`,
      tone: 'success',
    });
  }

  function rejectSelected() {
    const ids = new Set(selectedIds);
    setRequests((prev) => prev.map((r) => (ids.has(r.id) ? { ...r, status: 'rejected' as const } : r)));
    const count = ids.size;
    setSelected(new Set());
    setReason('');
    setIsRejectOpen(false);
    toast({
      title: `${count} request${count === 1 ? '' : 's'} rejected`,
      tone: 'danger',
    });
  }

  return (
    <div className={styles.screen}>
      <header className={styles.header}>
        <Eyebrow>Expenses</Eyebrow>
        <h1 className={styles.title}>Approve expense requests</h1>
        <p className={styles.subtitle}>Select one or more requests, then approve or reject them together.</p>
      </header>

      <DataTableToolbar>
        <span className={styles.selectionSummary} aria-live="polite">
          {selectedCount > 0 ? `${selectedCount} selected` : 'No requests selected'}
        </span>
        <div className={styles.toolbarActions}>
          <DialogTrigger
            isOpen={isRejectOpen}
            onOpenChange={(open) => {
              setIsRejectOpen(open);
              if (!open) setReason('');
            }}
          >
            <Button variant="outline" tone="danger" isDisabled={selectedCount === 0}>
              Reject
            </Button>
            <Dialog
              title="Reject expense requests"
              description={`Tell ${selectedCount === 1 ? 'the employee' : 'the employees'} why ${selectedCount === 1 ? 'this request is' : 'these requests are'} being rejected.`}
              footer={({ close }) => (
                <>
                  <Button variant="outline" onPress={close}>
                    Cancel
                  </Button>
                  <Button variant="primary" tone="danger" isDisabled={reason.trim().length === 0} onPress={rejectSelected}>
                    Reject {selectedCount || ''} request{selectedCount === 1 ? '' : 's'}
                  </Button>
                </>
              )}
            >
              <TextArea
                label="Reason for rejection"
                placeholder="Explain what needs to change or why this can't be approved."
                value={reason}
                onChange={setReason}
                isRequired
                rows={4}
                autoFocus
              />
            </Dialog>
          </DialogTrigger>
          <Button variant="primary" isDisabled={selectedCount === 0} onPress={approveSelected}>
            Approve
          </Button>
        </div>
      </DataTableToolbar>

      <DataTable
        aria-label="Expense requests"
        columns={columns}
        rows={requests}
        getRowId={(r) => r.id}
        selectionMode="multiple"
        selectedKeys={selected}
        onSelectionChange={setSelected}
        disabledKeys={disabledKeys}
      />

      <ToastRegion />
    </div>
  );
}

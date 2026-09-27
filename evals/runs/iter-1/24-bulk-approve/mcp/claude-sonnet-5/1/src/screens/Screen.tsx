import { useMemo, useState } from 'react';
import {
  Amount,
  Badge,
  Button,
  DataTable,
  DataTableToolbar,
  Dialog,
  DialogTrigger,
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

type Category = 'Travel' | 'Meals' | 'Software' | 'Lodging' | 'Office supplies' | 'Client entertainment';
type Status = 'pending' | 'approved' | 'rejected';

interface ExpenseRequest {
  id: string;
  employee: string;
  category: Category;
  amount: number;
  currency: string;
  dateSubmitted: string;
  receiptUrl: string;
  status: Status;
  rejectionReason?: string;
}

const initialRequests: ExpenseRequest[] = [
  { id: 'EXP-1001', employee: 'Asha Menon', category: 'Travel', amount: 482.5, currency: 'USD', dateSubmitted: '2026-09-12', receiptUrl: 'https://receipts.example.com/EXP-1001', status: 'pending' },
  { id: 'EXP-1002', employee: 'Daniel Okafor', category: 'Meals', amount: 64.2, currency: 'USD', dateSubmitted: '2026-09-14', receiptUrl: 'https://receipts.example.com/EXP-1002', status: 'pending' },
  { id: 'EXP-1003', employee: 'Mei Lin', category: 'Software', amount: 129.0, currency: 'USD', dateSubmitted: '2026-09-15', receiptUrl: 'https://receipts.example.com/EXP-1003', status: 'pending' },
  { id: 'EXP-1004', employee: 'Omar Haddad', category: 'Lodging', amount: 890.0, currency: 'USD', dateSubmitted: '2026-09-16', receiptUrl: 'https://receipts.example.com/EXP-1004', status: 'pending' },
  { id: 'EXP-1005', employee: 'Sofia Rossi', category: 'Client entertainment', amount: 215.75, currency: 'USD', dateSubmitted: '2026-09-18', receiptUrl: 'https://receipts.example.com/EXP-1005', status: 'pending' },
  { id: 'EXP-1006', employee: 'Kiran Rao', category: 'Travel', amount: 1024.3, currency: 'USD', dateSubmitted: '2026-09-19', receiptUrl: 'https://receipts.example.com/EXP-1006', status: 'pending' },
  { id: 'EXP-1007', employee: 'Lucas Martin', category: 'Office supplies', amount: 38.9, currency: 'USD', dateSubmitted: '2026-09-20', receiptUrl: 'https://receipts.example.com/EXP-1007', status: 'pending' },
  { id: 'EXP-1008', employee: 'Priya Nair', category: 'Meals', amount: 52.1, currency: 'USD', dateSubmitted: '2026-09-22', receiptUrl: 'https://receipts.example.com/EXP-1008', status: 'pending' },
  { id: 'EXP-1009', employee: 'Yusuf Karim', category: 'Software', amount: 349.99, currency: 'USD', dateSubmitted: '2026-09-23', receiptUrl: 'https://receipts.example.com/EXP-1009', status: 'pending' },
  { id: 'EXP-1010', employee: 'Elena Petrova', category: 'Travel', amount: 610.4, currency: 'USD', dateSubmitted: '2026-09-25', receiptUrl: 'https://receipts.example.com/EXP-1010', status: 'pending' },
];

const dateFormatter = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' });

const statusTone = { pending: 'info', approved: 'success', rejected: 'danger' } as const;
const statusLabel = { pending: 'Pending', approved: 'Approved', rejected: 'Rejected' } as const;

export default function Screen() {
  const [requests, setRequests] = useState<ExpenseRequest[]>(initialRequests);
  const [selectedKeys, setSelectedKeys] = useState<DataTableSelection>(new Set());
  const [reason, setReason] = useState('');
  const [reasonTouched, setReasonTouched] = useState(false);

  const pendingIds = useMemo(() => requests.filter((r) => r.status === 'pending').map((r) => r.id), [requests]);
  const disabledKeys = useMemo(() => requests.filter((r) => r.status !== 'pending').map((r) => r.id), [requests]);

  const selectedIds = useMemo(
    () => (selectedKeys === 'all' ? pendingIds : pendingIds.filter((id) => selectedKeys.has(id))),
    [selectedKeys, pendingIds],
  );
  const selectedCount = selectedIds.length;

  const columns: DataTableColumn<ExpenseRequest>[] = [
    { id: 'employee', header: 'Employee', isRowHeader: true, cell: (r) => r.employee },
    { id: 'category', header: 'Category', cell: (r) => <Tag>{r.category}</Tag> },
    {
      id: 'amount',
      header: 'Amount',
      align: 'end',
      cell: (r) => <Amount value={r.amount} currency={r.currency} size="sm" />,
    },
    { id: 'dateSubmitted', header: 'Date submitted', cell: (r) => dateFormatter.format(new Date(r.dateSubmitted)) },
    {
      id: 'receipt',
      header: 'Receipt',
      cell: (r) => (
        <Link href={r.receiptUrl} target="_blank" variant="standalone">
          View receipt
          <IconExternalLink aria-hidden width="1em" height="1em" className={styles.linkIcon} />
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
    setRequests((prev) => prev.map((r) => (ids.has(r.id) ? { ...r, status: 'approved' } : r)));
    setSelectedKeys(new Set());
    toast({ title: `${ids.size} expense request${ids.size === 1 ? '' : 's'} approved`, tone: 'success' });
  }

  function rejectSelected(close: () => void) {
    if (!reason.trim()) {
      setReasonTouched(true);
      return;
    }
    const ids = new Set(selectedIds);
    setRequests((prev) => prev.map((r) => (ids.has(r.id) ? { ...r, status: 'rejected', rejectionReason: reason.trim() } : r)));
    setSelectedKeys(new Set());
    setReason('');
    setReasonTouched(false);
    close();
    toast({ title: `${ids.size} expense request${ids.size === 1 ? '' : 's'} rejected`, tone: 'danger' });
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Expense approvals</h1>
        <p className={styles.subtitle}>Review requests submitted by your team, then approve or reject them.</p>
      </header>

      <DataTableToolbar>
        <span className={styles.selectionSummary} aria-live="polite">
          {selectedCount > 0 ? `${selectedCount} selected` : 'Select requests to approve or reject'}
        </span>
        <div className={styles.toolbarActions}>
          <DialogTrigger
            onOpenChange={(open) => {
              if (!open) {
                setReason('');
                setReasonTouched(false);
              }
            }}
          >
            <Button variant="outline" tone="danger" isDisabled={selectedCount === 0}>
              Reject
            </Button>
            <Dialog
              title={`Reject ${selectedCount} expense request${selectedCount === 1 ? '' : 's'}`}
              description="This reason is shared with the employee."
              footer={({ close }) => (
                <>
                  <Button variant="outline" onPress={close}>
                    Cancel
                  </Button>
                  <Button variant="primary" tone="danger" onPress={() => rejectSelected(close)}>
                    Reject {selectedCount}
                  </Button>
                </>
              )}
            >
              <TextArea
                label="Reason for rejection"
                placeholder="Explain what needs to change"
                value={reason}
                onChange={(value) => {
                  setReason(value);
                  if (reasonTouched) setReasonTouched(false);
                }}
                isRequired
                isInvalid={reasonTouched && !reason.trim()}
                errorMessage="Enter a reason before rejecting."
                rows={4}
              />
            </Dialog>
          </DialogTrigger>
          <Button variant="primary" isDisabled={selectedCount === 0} onPress={approveSelected}>
            Approve {selectedCount > 0 ? selectedCount : ''}
          </Button>
        </div>
      </DataTableToolbar>

      <DataTable
        aria-label="Expense requests"
        columns={columns}
        rows={requests}
        getRowId={(r) => r.id}
        selectionMode="multiple"
        selectedKeys={selectedKeys}
        onSelectionChange={setSelectedKeys}
        disabledKeys={disabledKeys}
      />

      <ToastRegion />
    </div>
  );
}

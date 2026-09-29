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
  PersonChip,
  Tag,
  TextArea,
  ToastRegion,
  toast,
  useSortedRows,
  type DataTableColumn,
  type DataTableSelection,
  type DataTableSortDescriptor,
} from '@syntara/react';
import { IconCheck, IconX } from '@syntara/icons';
import styles from './Screen.module.css';

type Status = 'pending' | 'approved' | 'rejected';

type ExpenseRequest = {
  id: string;
  employee: string;
  category: string;
  amount: number;
  submittedOn: Date;
  receiptUrl: string;
  status: Status;
  reason?: string;
};

const initialRequests: ExpenseRequest[] = [
  { id: 'EXP-1042', employee: 'Asha Menon', category: 'Travel', amount: 18450, submittedOn: new Date(2026, 8, 25), receiptUrl: '/receipts/EXP-1042', status: 'pending' },
  { id: 'EXP-1041', employee: 'Daniel Okafor', category: 'Meals', amount: 2350, submittedOn: new Date(2026, 8, 24), receiptUrl: '/receipts/EXP-1041', status: 'pending' },
  { id: 'EXP-1040', employee: 'Mei Lin', category: 'Software', amount: 8900, submittedOn: new Date(2026, 8, 23), receiptUrl: '/receipts/EXP-1040', status: 'pending' },
  { id: 'EXP-1039', employee: 'Omar Haddad', category: 'Lodging', amount: 24600, submittedOn: new Date(2026, 8, 22), receiptUrl: '/receipts/EXP-1039', status: 'pending' },
  { id: 'EXP-1038', employee: 'Sofia Rossi', category: 'Office supplies', amount: 1450, submittedOn: new Date(2026, 8, 21), receiptUrl: '/receipts/EXP-1038', status: 'pending' },
  { id: 'EXP-1037', employee: 'Kiran Rao', category: 'Travel', amount: 15200, submittedOn: new Date(2026, 8, 20), receiptUrl: '/receipts/EXP-1037', status: 'pending' },
  { id: 'EXP-1036', employee: 'Lucas Martin', category: 'Meals', amount: 980, submittedOn: new Date(2026, 8, 19), receiptUrl: '/receipts/EXP-1036', status: 'pending' },
  { id: 'EXP-1035', employee: 'Priya Shah', category: 'Software', amount: 5600, submittedOn: new Date(2026, 8, 18), receiptUrl: '/receipts/EXP-1035', status: 'pending' },
  { id: 'EXP-1034', employee: 'Noah Becker', category: 'Lodging', amount: 32000, submittedOn: new Date(2026, 8, 17), receiptUrl: '/receipts/EXP-1034', status: 'pending' },
  { id: 'EXP-1033', employee: 'Ines Duarte', category: 'Office supplies', amount: 2100, submittedOn: new Date(2026, 8, 16), receiptUrl: '/receipts/EXP-1033', status: 'pending' },
];

const statusTone = { pending: 'warning', approved: 'success', rejected: 'danger' } as const;
const statusLabel = { pending: 'Pending', approved: 'Approved', rejected: 'Rejected' } as const;

const dateFormat = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
const sortAccessors = {
  employee: (r: ExpenseRequest) => r.employee,
  category: (r: ExpenseRequest) => r.category,
  amount: (r: ExpenseRequest) => r.amount,
  submittedOn: (r: ExpenseRequest) => r.submittedOn,
};

export default function Screen() {
  const [requests, setRequests] = useState<ExpenseRequest[]>(initialRequests);
  const [selectedKeys, setSelectedKeys] = useState<DataTableSelection>(new Set());
  const [sort, setSort] = useState<DataTableSortDescriptor>({ column: 'submittedOn', direction: 'descending' });
  const [rejectReason, setRejectReason] = useState('');
  const [isRejectOpen, setIsRejectOpen] = useState(false);

  const disabledKeys = useMemo(() => requests.filter((r) => r.status !== 'pending').map((r) => r.id), [requests]);

  const selectedIds = useMemo(() => {
    if (selectedKeys === 'all') return new Set(requests.filter((r) => r.status === 'pending').map((r) => r.id));
    return new Set([...selectedKeys].map(String));
  }, [selectedKeys, requests]);

  const selectedCount = selectedIds.size;
  const pendingCount = requests.filter((r) => r.status === 'pending').length;
  const sorted = useSortedRows(requests, sort, sortAccessors);

  const columns: DataTableColumn<ExpenseRequest>[] = [
    { id: 'employee', header: 'Employee', isRowHeader: true, allowsSorting: true, cell: (r) => <PersonChip name={r.employee} /> },
    { id: 'category', header: 'Category', cell: (r) => <Tag>{r.category}</Tag> },
    { id: 'amount', header: 'Amount', align: 'end', allowsSorting: true, cell: (r) => <Amount value={r.amount} currency="INR" size="sm" /> },
    { id: 'submittedOn', header: 'Date submitted', allowsSorting: true, cell: (r) => dateFormat.format(r.submittedOn) },
    { id: 'receipt', header: 'Receipt', cell: (r) => <Link href={r.receiptUrl}>View receipt</Link> },
    { id: 'status', header: 'Status', cell: (r) => <Badge variant="status" tone={statusTone[r.status]}>{statusLabel[r.status]}</Badge> },
  ];

  const approveSelected = () => {
    const ids = selectedIds;
    const count = ids.size;
    if (count === 0) return;
    setRequests((prev) => prev.map((r) => (ids.has(r.id) && r.status === 'pending' ? { ...r, status: 'approved' } : r)));
    setSelectedKeys(new Set());
    toast({ title: `${count} request${count === 1 ? '' : 's'} approved`, tone: 'success' });
  };

  const rejectSelected = () => {
    const ids = selectedIds;
    const count = ids.size;
    if (count === 0) return;
    setRequests((prev) => prev.map((r) => (ids.has(r.id) && r.status === 'pending' ? { ...r, status: 'rejected', reason: rejectReason } : r)));
    setSelectedKeys(new Set());
    toast({ title: `${count} request${count === 1 ? '' : 's'} rejected`, tone: 'danger' });
    setRejectReason('');
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Eyebrow>Expense approvals</Eyebrow>
        <h1 className={styles.title}>Review expense requests</h1>
        <p className={styles.subtitle}>{pendingCount} awaiting your decision</p>
      </header>

      <DataTableToolbar>
        <span className={styles.selectionSummary} aria-live="polite">
          {selectedCount} selected
        </span>
        <div className={styles.actions}>
          <Button variant="primary" isDisabled={selectedCount === 0} onPress={approveSelected}>
            <IconCheck aria-hidden />
            Approve{selectedCount ? ` (${selectedCount})` : ''}
          </Button>
          <DialogTrigger isOpen={isRejectOpen} onOpenChange={(open) => { setIsRejectOpen(open); if (!open) setRejectReason(''); }}>
            <Button variant="outline" tone="danger" isDisabled={selectedCount === 0}>
              <IconX aria-hidden />
              Reject{selectedCount ? ` (${selectedCount})` : ''}
            </Button>
            <Dialog
              title={`Reject ${selectedCount} expense request${selectedCount === 1 ? '' : 's'}`}
              description="This reason is shown to the employee."
              footer={({ close }) => (
                <>
                  <Button variant="outline" onPress={close}>
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    tone="danger"
                    isDisabled={!rejectReason.trim()}
                    onPress={() => {
                      rejectSelected();
                      close();
                    }}
                  >
                    Reject {selectedCount}
                  </Button>
                </>
              )}
            >
              <TextArea
                label="Reason for rejection"
                placeholder="Explain what's missing or incorrect"
                value={rejectReason}
                onChange={setRejectReason}
                isRequired
                rows={4}
                autoFocus
              />
            </Dialog>
          </DialogTrigger>
        </div>
      </DataTableToolbar>

      <DataTable
        aria-label="Expense requests"
        columns={columns}
        rows={sorted}
        getRowId={(r) => r.id}
        selectionMode="multiple"
        selectedKeys={selectedKeys}
        onSelectionChange={setSelectedKeys}
        disabledKeys={disabledKeys}
        sortDescriptor={sort}
        onSortChange={setSort}
      />

      <ToastRegion />
    </div>
  );
}

'use client';

import { useId, useMemo, useState, type JSX } from 'react';
import {
  Amount,
  Badge,
  Button,
  Card,
  CardContent,
  DataTable,
  DataTableToolbar,
  Dialog,
  DialogTrigger,
  Link,
  Tag,
  TextArea,
  ToastRegion,
  toast,
  useSortedRows,
  type DataTableColumn,
  type DataTableSelection,
  type DataTableSortDescriptor,
} from '@strata/react';
import { IconExternalLink } from '@strata/icons';
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
  { id: 'EXP-1001', employee: 'Priya Sharma', category: 'Travel', amount: 482.5, currency: 'USD', dateSubmitted: '2026-09-20', receiptUrl: '/receipts/exp-1001.pdf', status: 'pending' },
  { id: 'EXP-1002', employee: 'Rahul Verma', category: 'Meals', amount: 64.2, currency: 'USD', dateSubmitted: '2026-09-21', receiptUrl: '/receipts/exp-1002.pdf', status: 'pending' },
  { id: 'EXP-1003', employee: 'Ananya Iyer', category: 'Software', amount: 129.0, currency: 'USD', dateSubmitted: '2026-09-18', receiptUrl: '/receipts/exp-1003.pdf', status: 'pending' },
  { id: 'EXP-1004', employee: 'Vikram Nair', category: 'Accommodation', amount: 756.75, currency: 'USD', dateSubmitted: '2026-09-22', receiptUrl: '/receipts/exp-1004.pdf', status: 'pending' },
  { id: 'EXP-1005', employee: 'Sara Khan', category: 'Office supplies', amount: 38.9, currency: 'USD', dateSubmitted: '2026-09-15', receiptUrl: '/receipts/exp-1005.pdf', status: 'pending' },
  { id: 'EXP-1006', employee: 'Meera Pillai', category: 'Client entertainment', amount: 210.0, currency: 'USD', dateSubmitted: '2026-09-24', receiptUrl: '/receipts/exp-1006.pdf', status: 'pending' },
  { id: 'EXP-1007', employee: 'Arjun Desai', category: 'Training', amount: 340.0, currency: 'USD', dateSubmitted: '2026-09-19', receiptUrl: '/receipts/exp-1007.pdf', status: 'pending' },
  { id: 'EXP-1008', employee: 'Fatima Ali', category: 'Transport', amount: 27.6, currency: 'USD', dateSubmitted: '2026-09-23', receiptUrl: '/receipts/exp-1008.pdf', status: 'pending' },
  { id: 'EXP-1009', employee: 'Karan Mehta', category: 'Equipment', amount: 512.4, currency: 'USD', dateSubmitted: '2026-09-17', receiptUrl: '/receipts/exp-1009.pdf', status: 'pending' },
  { id: 'EXP-1010', employee: 'Divya Menon', category: 'Other', amount: 95.0, currency: 'USD', dateSubmitted: '2026-09-25', receiptUrl: '/receipts/exp-1010.pdf', status: 'pending' },
];

const statusCopy: Record<Status, { label: string; tone: 'warning' | 'success' | 'danger' }> = {
  pending: { label: 'Pending', tone: 'warning' },
  approved: { label: 'Approved', tone: 'success' },
  rejected: { label: 'Rejected', tone: 'danger' },
};

const dateFormat = new Intl.DateTimeFormat('en-US', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
const formatDate = (iso: string) => dateFormat.format(new Date(`${iso}T00:00:00Z`));

const accessors = {
  employee: (r: ExpenseRequest) => r.employee,
  category: (r: ExpenseRequest) => r.category,
  amount: (r: ExpenseRequest) => r.amount,
  dateSubmitted: (r: ExpenseRequest) => r.dateSubmitted,
  status: (r: ExpenseRequest) => statusCopy[r.status].label,
};

export default function Screen(): JSX.Element {
  const uid = useId();
  const [requests, setRequests] = useState<ExpenseRequest[]>(initialRequests);
  const [selected, setSelected] = useState<DataTableSelection>(new Set());
  const [sort, setSort] = useState<DataTableSortDescriptor>({ column: 'dateSubmitted', direction: 'descending' });
  const [reason, setReason] = useState('');

  const disabledKeys = useMemo(() => requests.filter((r) => r.status !== 'pending').map((r) => r.id), [requests]);
  const selectedIds = useMemo(
    () => (selected === 'all' ? requests.filter((r) => r.status === 'pending').map((r) => r.id) : [...selected].map(String)),
    [selected, requests],
  );
  const count = selectedIds.length;

  const sorted = useSortedRows(requests, sort, accessors);

  const columns = useMemo<DataTableColumn<ExpenseRequest>[]>(
    () => [
      { id: 'employee', header: 'Employee', isRowHeader: true, allowsSorting: true, cell: (r) => r.employee },
      { id: 'category', header: 'Category', allowsSorting: true, cell: (r) => <Tag size="sm">{r.category}</Tag> },
      {
        id: 'amount',
        header: 'Amount',
        align: 'end',
        allowsSorting: true,
        cell: (r) => <Amount value={r.amount} currency={r.currency} size="sm" />,
      },
      {
        id: 'dateSubmitted',
        header: 'Date submitted',
        allowsSorting: true,
        cell: (r) => <time dateTime={r.dateSubmitted}>{formatDate(r.dateSubmitted)}</time>,
      },
      {
        id: 'receipt',
        header: 'Receipt',
        cell: (r) => (
          <Link href={r.receiptUrl} target="_blank" variant="standalone">
            View receipt
            <IconExternalLink aria-hidden />
          </Link>
        ),
      },
      {
        id: 'status',
        header: 'Status',
        allowsSorting: true,
        cell: (r) => (
          <Badge variant="status" tone={statusCopy[r.status].tone}>
            {statusCopy[r.status].label}
          </Badge>
        ),
      },
    ],
    [],
  );

  const clearSelection = () => setSelected(new Set());

  const approveSelected = () => {
    const ids = new Set(selectedIds);
    setRequests((rows) => rows.map((r) => (ids.has(r.id) ? { ...r, status: 'approved' } : r)));
    toast({ title: `${count} ${count === 1 ? 'request' : 'requests'} approved`, tone: 'success' });
    clearSelection();
  };

  const rejectSelected = (rejectReason: string) => {
    const ids = new Set(selectedIds);
    setRequests((rows) => rows.map((r) => (ids.has(r.id) ? { ...r, status: 'rejected', reason: rejectReason } : r)));
    toast({ title: `${count} ${count === 1 ? 'request' : 'requests'} rejected`, tone: 'success' });
    clearSelection();
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 id={`${uid}-title`} className={styles.title}>
          Expense approvals
        </h1>
        <p className={styles.description}>Review submitted expenses and approve or reject them.</p>
      </div>

      <Card>
        <DataTableToolbar className={styles.toolbar}>
          <span className={styles.selection} aria-live="polite">
            {count > 0 ? `${count} selected` : ''}
          </span>
          <div className={styles.actions}>
            <Button variant="primary" isDisabled={count === 0} onPress={approveSelected}>
              Approve
            </Button>
            <DialogTrigger
              onOpenChange={(open) => {
                if (open) setReason('');
              }}
            >
              <Button variant="outline" tone="danger" isDisabled={count === 0}>
                Reject
              </Button>
              <Dialog
                title="Reject requests"
                description={`This will reject ${count} ${count === 1 ? 'request' : 'requests'}. Tell the employees why.`}
                footer={({ close }) => (
                  <>
                    <Button variant="outline" onPress={close}>
                      Cancel
                    </Button>
                    <Button
                      tone="danger"
                      isDisabled={reason.trim() === ''}
                      onPress={() => {
                        rejectSelected(reason.trim());
                        close();
                      }}
                    >
                      Reject {count > 0 ? count : ''}
                    </Button>
                  </>
                )}
              >
                <TextArea
                  label="Reason for rejection"
                  description="Shown to the employees whose requests you reject."
                  value={reason}
                  onChange={setReason}
                  isRequired
                  autoFocus
                  rows={4}
                />
              </Dialog>
            </DialogTrigger>
          </div>
        </DataTableToolbar>

        <CardContent variant="inset">
          <DataTable
            aria-labelledby={`${uid}-title`}
            columns={columns}
            rows={sorted}
            getRowId={(r) => r.id}
            selectionMode="multiple"
            selectedKeys={selected}
            onSelectionChange={setSelected}
            disabledKeys={disabledKeys}
            sortDescriptor={sort}
            onSortChange={setSort}
          />
        </CardContent>
      </Card>

      <ToastRegion />
    </div>
  );
}

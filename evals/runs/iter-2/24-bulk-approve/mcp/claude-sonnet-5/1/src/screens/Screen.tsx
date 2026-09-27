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
  Link,
  TextArea,
  ToastRegion,
  toast,
  type DataTableColumn,
  type DataTableSelection,
} from '@strata/react';
import { IconArrowUpRight } from '@strata/icons';
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
}

const initialRequests: ExpenseRequest[] = [
  { id: 'EXP-1001', employee: 'Priya Raman', category: 'Travel', amount: 482.5, currency: 'USD', dateSubmitted: '2026-09-12', receiptUrl: 'https://receipts.example.com/EXP-1001.pdf', status: 'pending' },
  { id: 'EXP-1002', employee: 'Daniel Okafor', category: 'Meals', amount: 64.2, currency: 'USD', dateSubmitted: '2026-09-14', receiptUrl: 'https://receipts.example.com/EXP-1002.pdf', status: 'pending' },
  { id: 'EXP-1003', employee: 'Mei Lin', category: 'Software', amount: 149.0, currency: 'USD', dateSubmitted: '2026-09-15', receiptUrl: 'https://receipts.example.com/EXP-1003.pdf', status: 'pending' },
  { id: 'EXP-1004', employee: 'Omar Haddad', category: 'Lodging', amount: 895.75, currency: 'USD', dateSubmitted: '2026-09-16', receiptUrl: 'https://receipts.example.com/EXP-1004.pdf', status: 'pending' },
  { id: 'EXP-1005', employee: 'Sofia Rossi', category: 'Office supplies', amount: 37.6, currency: 'USD', dateSubmitted: '2026-09-18', receiptUrl: 'https://receipts.example.com/EXP-1005.pdf', status: 'pending' },
  { id: 'EXP-1006', employee: 'Kiran Rao', category: 'Travel', amount: 210.0, currency: 'USD', dateSubmitted: '2026-09-19', receiptUrl: 'https://receipts.example.com/EXP-1006.pdf', status: 'pending' },
  { id: 'EXP-1007', employee: 'Lucas Martin', category: 'Client entertainment', amount: 128.9, currency: 'USD', dateSubmitted: '2026-09-21', receiptUrl: 'https://receipts.example.com/EXP-1007.pdf', status: 'pending' },
  { id: 'EXP-1008', employee: 'Asha Menon', category: 'Meals', amount: 52.3, currency: 'USD', dateSubmitted: '2026-09-22', receiptUrl: 'https://receipts.example.com/EXP-1008.pdf', status: 'pending' },
  { id: 'EXP-1009', employee: 'Noah Fischer', category: 'Training', amount: 640.0, currency: 'USD', dateSubmitted: '2026-09-24', receiptUrl: 'https://receipts.example.com/EXP-1009.pdf', status: 'pending' },
  { id: 'EXP-1010', employee: 'Hana Suzuki', category: 'Software', amount: 29.99, currency: 'USD', dateSubmitted: '2026-09-25', receiptUrl: 'https://receipts.example.com/EXP-1010.pdf', status: 'pending' },
];

const statusCopy: Record<Status, { label: string; tone: 'warning' | 'success' | 'danger' }> = {
  pending: { label: 'Pending', tone: 'warning' },
  approved: { label: 'Approved', tone: 'success' },
  rejected: { label: 'Rejected', tone: 'danger' },
};

const dateFormat = new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
const formatDate = (iso: string) => dateFormat.format(new Date(`${iso}T00:00:00Z`));

export default function Screen(): JSX.Element {
  const uid = useId();
  const [requests, setRequests] = useState<ExpenseRequest[]>(initialRequests);
  const [selected, setSelected] = useState<DataTableSelection>(new Set());
  const [isRejectOpen, setIsRejectOpen] = useState(false);
  const [dialogCount, setDialogCount] = useState(0);
  const [reason, setReason] = useState('');
  const [reasonError, setReasonError] = useState<string | undefined>();

  const pendingIds = useMemo(() => requests.filter((r) => r.status === 'pending').map((r) => r.id), [requests]);
  const decidedIds = useMemo(() => requests.filter((r) => r.status !== 'pending').map((r) => r.id), [requests]);

  const selectedIds = useMemo(
    () => (selected === 'all' ? pendingIds : [...selected].map(String).filter((id) => pendingIds.includes(id))),
    [selected, pendingIds],
  );
  const count = selectedIds.length;

  const columns = useMemo<DataTableColumn<ExpenseRequest>[]>(
    () => [
      { id: 'employee', header: 'Employee', isRowHeader: true, cell: (row) => row.employee },
      { id: 'category', header: 'Category', cell: (row) => <span className={styles.quiet}>{row.category}</span> },
      {
        id: 'amount',
        header: 'Amount',
        align: 'end',
        cell: (row) => <Amount value={row.amount} currency={row.currency} size="sm" />,
      },
      {
        id: 'date',
        header: 'Date submitted',
        cell: (row) => (
          <time dateTime={row.dateSubmitted} className={styles.quiet}>
            {formatDate(row.dateSubmitted)}
          </time>
        ),
      },
      {
        id: 'receipt',
        header: 'Receipt',
        cell: (row) => (
          <Link
            variant="standalone"
            href={row.receiptUrl}
            target="_blank"
            aria-label={`View receipt — ${row.employee}, ${row.id}, opens in new tab`}
          >
            View receipt
            <IconArrowUpRight aria-hidden />
          </Link>
        ),
      },
      {
        id: 'status',
        header: 'Status',
        cell: (row) => (
          <Badge variant="status" tone={statusCopy[row.status].tone}>
            {statusCopy[row.status].label}
          </Badge>
        ),
      },
    ],
    [],
  );

  const clearSelection = () => setSelected(new Set());

  const approveSelected = () => {
    const ids = new Set(selectedIds);
    setRequests((prev) => prev.map((r) => (ids.has(r.id) ? { ...r, status: 'approved' } : r)));
    toast({ title: `${count} ${count === 1 ? 'request' : 'requests'} approved`, tone: 'success' });
    clearSelection();
  };

  const openReject = () => {
    setDialogCount(count);
    setReason('');
    setReasonError(undefined);
    setIsRejectOpen(true);
  };

  const confirmReject = (close: () => void) => {
    if (!reason.trim()) {
      setReasonError('Enter a reason for rejecting these requests.');
      return;
    }
    const ids = new Set(selectedIds);
    setRequests((prev) => prev.map((r) => (ids.has(r.id) ? { ...r, status: 'rejected' } : r)));
    toast({ title: `${dialogCount} ${dialogCount === 1 ? 'request' : 'requests'} rejected`, tone: 'danger' });
    clearSelection();
    close();
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 id={`${uid}-title`} className={styles.title}>
          Expense approvals
        </h1>
        <p className={styles.description}>Review submitted expenses. Select requests to approve or reject them together.</p>
      </div>

      <Card className={styles.card}>
        <DataTableToolbar className={styles.toolbar}>
          <span className={styles.selection} aria-live="polite">
            {count > 0 ? `${count} selected` : ''}
          </span>
          <div className={styles.actions}>
            <Button variant="outline" tone="danger" isDisabled={count === 0} onPress={openReject}>
              Reject
            </Button>
            <Button variant="primary" isDisabled={count === 0} onPress={approveSelected}>
              Approve
            </Button>
          </div>
        </DataTableToolbar>

        <CardContent variant="inset" className={styles.tableWell}>
          <DataTable
            aria-labelledby={`${uid}-title`}
            columns={columns}
            rows={requests}
            getRowId={(row) => row.id}
            selectionMode="multiple"
            selectedKeys={selected}
            onSelectionChange={setSelected}
            disabledKeys={decidedIds}
            className={styles.table}
          />
        </CardContent>
      </Card>

      <Dialog
        isOpen={isRejectOpen}
        onOpenChange={setIsRejectOpen}
        title={`Reject ${dialogCount} ${dialogCount === 1 ? 'request' : 'requests'}`}
        description="This reason is shared with the employees whose requests you reject."
        footer={({ close }) => (
          <>
            <Button variant="outline" onPress={close}>
              Cancel
            </Button>
            <Button variant="primary" tone="danger" onPress={() => confirmReject(close)}>
              Reject {dialogCount > 0 ? dialogCount : ''}
            </Button>
          </>
        )}
      >
        <TextArea
          label="Reason for rejecting"
          placeholder="Explain what's missing or incorrect."
          value={reason}
          onChange={(value) => {
            setReason(value);
            if (reasonError) setReasonError(undefined);
          }}
          isRequired
          isInvalid={Boolean(reasonError)}
          errorMessage={reasonError}
        />
      </Dialog>

      <ToastRegion />
    </div>
  );
}

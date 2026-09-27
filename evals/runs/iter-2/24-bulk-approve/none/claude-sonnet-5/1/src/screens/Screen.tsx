import { useMemo, useState } from 'react';
import { useLocale, type Selection } from 'react-aria-components';
import {
  Alert,
  Amount,
  Badge,
  Button,
  DataTable,
  type DataTableColumn,
  DataTableToolbar,
  Dialog,
  Link,
  PersonChip,
  Tag,
  TextArea,
} from '@strata/react';
import { IconCircleCheck, IconCircleX, IconExternalLink } from '@strata/icons';
import styles from './Screen.module.css';

type ExpenseStatus = 'pending' | 'approved' | 'rejected';

interface ExpenseRequest {
  id: string;
  employee: string;
  category: string;
  amount: number;
  currency: string;
  dateSubmitted: string;
  receiptUrl: string;
}

const CATEGORY_TONE: Record<string, 'info' | 'accent' | 'warning' | 'neutral'> = {
  Travel: 'info',
  Meals: 'warning',
  Software: 'accent',
  Office: 'neutral',
  Lodging: 'info',
};

const REQUESTS: ExpenseRequest[] = [
  { id: 'EXP-1001', employee: 'Priya Raman', category: 'Travel', amount: 18400, currency: 'INR', dateSubmitted: '2026-09-12', receiptUrl: 'https://receipts.example.com/EXP-1001' },
  { id: 'EXP-1002', employee: 'Arjun Mehta', category: 'Meals', amount: 2150, currency: 'INR', dateSubmitted: '2026-09-14', receiptUrl: 'https://receipts.example.com/EXP-1002' },
  { id: 'EXP-1003', employee: 'Sara Ibrahim', category: 'Software', amount: 9600, currency: 'INR', dateSubmitted: '2026-09-15', receiptUrl: 'https://receipts.example.com/EXP-1003' },
  { id: 'EXP-1004', employee: 'Kabir Singh', category: 'Office', amount: 3200, currency: 'INR', dateSubmitted: '2026-09-16', receiptUrl: 'https://receipts.example.com/EXP-1004' },
  { id: 'EXP-1005', employee: 'Meera Nair', category: 'Lodging', amount: 24500, currency: 'INR', dateSubmitted: '2026-09-17', receiptUrl: 'https://receipts.example.com/EXP-1005' },
  { id: 'EXP-1006', employee: 'Farhan Ali', category: 'Travel', amount: 6800, currency: 'INR', dateSubmitted: '2026-09-18', receiptUrl: 'https://receipts.example.com/EXP-1006' },
  { id: 'EXP-1007', employee: 'Anjali Gupta', category: 'Meals', amount: 1450, currency: 'INR', dateSubmitted: '2026-09-19', receiptUrl: 'https://receipts.example.com/EXP-1007' },
  { id: 'EXP-1008', employee: 'Vikram Rao', category: 'Software', amount: 14200, currency: 'INR', dateSubmitted: '2026-09-20', receiptUrl: 'https://receipts.example.com/EXP-1008' },
  { id: 'EXP-1009', employee: 'Nisha Kulkarni', category: 'Office', amount: 890, currency: 'INR', dateSubmitted: '2026-09-21', receiptUrl: 'https://receipts.example.com/EXP-1009' },
  { id: 'EXP-1010', employee: 'Rohan Desai', category: 'Lodging', amount: 31200, currency: 'INR', dateSubmitted: '2026-09-22', receiptUrl: 'https://receipts.example.com/EXP-1010' },
];

interface Notice {
  tone: 'success' | 'danger';
  message: string;
}

export default function Screen() {
  const { locale } = useLocale();
  const dateFormatter = useMemo(
    () => new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short', year: 'numeric' }),
    [locale],
  );

  const [statuses, setStatuses] = useState<Record<string, ExpenseStatus>>({});
  const [selectedKeys, setSelectedKeys] = useState<Selection>(new Set());
  const [rejectReason, setRejectReason] = useState('');
  const [isRejectOpen, setIsRejectOpen] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);

  const pendingRequests = useMemo(() => REQUESTS.filter((r) => !statuses[r.id]), [statuses]);

  const selectedIds = useMemo(
    () =>
      selectedKeys === 'all'
        ? pendingRequests.map((r) => r.id)
        : pendingRequests.filter((r) => selectedKeys.has(r.id)).map((r) => r.id),
    [pendingRequests, selectedKeys],
  );

  function clearSelection() {
    setSelectedKeys(new Set());
  }

  function handleApprove() {
    const count = selectedIds.length;
    if (count === 0) return;
    setStatuses((prev) => {
      const next = { ...prev };
      for (const id of selectedIds) next[id] = 'approved';
      return next;
    });
    clearSelection();
    setNotice({ tone: 'success', message: `${count} request${count === 1 ? '' : 's'} approved.` });
  }

  function openReject() {
    if (selectedIds.length === 0) return;
    setRejectReason('');
    setIsRejectOpen(true);
  }

  function confirmReject() {
    const count = selectedIds.length;
    setStatuses((prev) => {
      const next = { ...prev };
      for (const id of selectedIds) next[id] = 'rejected';
      return next;
    });
    clearSelection();
    setIsRejectOpen(false);
    setNotice({ tone: 'danger', message: `${count} request${count === 1 ? '' : 's'} rejected.` });
  }

  const columns: DataTableColumn<ExpenseRequest>[] = [
    {
      id: 'employee',
      header: 'Employee',
      isRowHeader: true,
      textValue: 'Employee',
      cell: (row) => <PersonChip name={row.employee} size="sm" />,
    },
    {
      id: 'category',
      header: 'Category',
      textValue: 'Category',
      cell: (row) => <Tag tone={CATEGORY_TONE[row.category] ?? 'neutral'}>{row.category}</Tag>,
    },
    {
      id: 'amount',
      header: 'Amount',
      align: 'end',
      textValue: 'Amount',
      cell: (row) => <Amount value={row.amount} currency={row.currency} size="sm" />,
    },
    {
      id: 'date',
      header: 'Date submitted',
      textValue: 'Date submitted',
      cell: (row) => dateFormatter.format(new Date(row.dateSubmitted)),
    },
    {
      id: 'receipt',
      header: 'Receipt',
      textValue: 'Receipt',
      cell: (row) => (
        <Link href={row.receiptUrl} target="_blank" rel="noreferrer">
          View receipt <IconExternalLink />
        </Link>
      ),
    },
  ];

  return (
    <div className={styles.screen}>
      <header className={styles.header}>
        <h1 className={styles.title}>Expense approvals</h1>
        <p className={styles.subtitle}>Review pending requests and approve or reject them.</p>
      </header>

      {notice && (
        <Alert
          tone={notice.tone}
          live="polite"
          onDismiss={() => setNotice(null)}
          dismissLabel="Dismiss"
          className={styles.notice}
        >
          {notice.message}
        </Alert>
      )}

      <DataTableToolbar className={styles.toolbar}>
        <span className={styles.selectionSummary}>
          {selectedIds.length > 0 ? (
            <Badge tone="brand" variant="soft">{`${selectedIds.length} selected`}</Badge>
          ) : (
            <span className={styles.selectionHint}>Select requests to approve or reject</span>
          )}
        </span>
        <div className={styles.toolbarActions}>
          <Button
            variant="outline"
            tone="danger"
            isDisabled={selectedIds.length === 0}
            onPress={openReject}
          >
            <IconCircleX /> Reject
          </Button>
          <Button
            variant="primary"
            isDisabled={selectedIds.length === 0}
            onPress={handleApprove}
          >
            <IconCircleCheck /> Approve
          </Button>
        </div>
      </DataTableToolbar>

      <DataTable
        aria-label="Pending expense requests"
        columns={columns}
        rows={pendingRequests}
        getRowId={(row) => row.id}
        selectionMode="multiple"
        selectedKeys={selectedKeys}
        onSelectionChange={setSelectedKeys}
        emptyState={<p className={styles.empty}>No pending requests. All expenses have been reviewed.</p>}
      />

      <Dialog
        title="Reject expense requests"
        description={`This will reject ${selectedIds.length} request${selectedIds.length === 1 ? '' : 's'}.`}
        size="sm"
        isOpen={isRejectOpen}
        onOpenChange={setIsRejectOpen}
        footer={({ close }) => (
          <>
            <Button variant="ghost" onPress={close}>
              Cancel
            </Button>
            <Button
              variant="primary"
              tone="danger"
              isDisabled={rejectReason.trim().length === 0}
              onPress={confirmReject}
            >
              Reject
            </Button>
          </>
        )}
      >
        <TextArea
          label="Reason for rejection"
          placeholder="Explain why these requests are being rejected"
          value={rejectReason}
          onChange={setRejectReason}
          isRequired
          rows={4}
        />
      </Dialog>
    </div>
  );
}

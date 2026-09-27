import { useMemo, useState } from 'react';
import { CalendarDate, parseDate } from '@internationalized/date';
import {
  Amount,
  Badge,
  Button,
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  DataTable,
  type DataTableColumn,
  DataTableToolbar,
  DateRangePicker,
  EmptyState,
  SearchField,
  Select,
  SelectItem,
} from '@strata/react';
import { IconDownload, IconInbox } from '@strata/icons';
import styles from './Screen.module.css';

type TransactionStatus = 'completed' | 'pending' | 'failed';

interface Transaction {
  id: string;
  date: string;
  description: string;
  category: string;
  status: TransactionStatus;
  amount: number;
}

const TRANSACTIONS: Transaction[] = [
  { id: 'txn_01', date: '2026-09-26', description: 'Whole Foods Market', category: 'Groceries', status: 'completed', amount: -84.32 },
  { id: 'txn_02', date: '2026-09-25', description: 'Salary Deposit - Acme Corp', category: 'Income', status: 'completed', amount: 4200 },
  { id: 'txn_03', date: '2026-09-24', description: 'Netflix Subscription', category: 'Subscription', status: 'completed', amount: -15.99 },
  { id: 'txn_04', date: '2026-09-23', description: 'Transfer to Savings', category: 'Transfer', status: 'completed', amount: -500 },
  { id: 'txn_05', date: '2026-09-22', description: 'Uber Trip', category: 'Transport', status: 'completed', amount: -23.47 },
  { id: 'txn_06', date: '2026-09-21', description: 'Wire Transfer - Overseas', category: 'Transfer', status: 'pending', amount: -1200 },
  { id: 'txn_07', date: '2026-09-20', description: 'Starbucks Coffee', category: 'Dining', status: 'completed', amount: -6.75 },
  { id: 'txn_08', date: '2026-09-18', description: 'Electric Bill - City Power', category: 'Utilities', status: 'completed', amount: -142.1 },
  { id: 'txn_09', date: '2026-09-17', description: 'Amazon Purchase', category: 'Shopping', status: 'failed', amount: -89.99 },
  { id: 'txn_10', date: '2026-09-15', description: 'Freelance Payment - Nova Studio', category: 'Income', status: 'pending', amount: 850 },
  { id: 'txn_11', date: '2026-09-12', description: 'Gym Membership', category: 'Health', status: 'completed', amount: -45 },
  { id: 'txn_12', date: '2026-09-10', description: 'Refund - Zara', category: 'Shopping', status: 'completed', amount: 32.5 },
];

const CATEGORIES = Array.from(new Set(TRANSACTIONS.map((t) => t.category))).sort();

const STATUS_TONE: Record<TransactionStatus, 'success' | 'warning' | 'danger'> = {
  completed: 'success',
  pending: 'warning',
  failed: 'danger',
};

const STATUS_LABEL: Record<TransactionStatus, string> = {
  completed: 'Completed',
  pending: 'Pending',
  failed: 'Failed',
};

const dateFormatter = new Intl.DateTimeFormat('en-US', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });

function csvField(value: string): string {
  return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

function downloadCsv(rows: Transaction[]): void {
  const header = ['Date', 'Description', 'Category', 'Status', 'Amount'];
  const lines = rows.map((t) => [t.date, csvField(t.description), t.category, STATUS_LABEL[t.status], t.amount.toFixed(2)].join(','));
  const csv = [header.join(','), ...lines].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'transactions.csv';
  link.click();
  URL.revokeObjectURL(url);
}

type DateRangeValue = { start: CalendarDate; end: CalendarDate } | null;

export default function Screen() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<string>('all');
  const [dateRange, setDateRange] = useState<DateRangeValue>(null);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return TRANSACTIONS.filter((t) => {
      if (query && !t.description.toLowerCase().includes(query)) return false;
      if (category !== 'all' && t.category !== category) return false;
      if (dateRange) {
        const day = parseDate(t.date);
        if (day.compare(dateRange.start) < 0 || day.compare(dateRange.end) > 0) return false;
      }
      return true;
    });
  }, [search, category, dateRange]);

  const hasFilters = search.trim() !== '' || category !== 'all' || dateRange !== null;

  const clearFilters = () => {
    setSearch('');
    setCategory('all');
    setDateRange(null);
  };

  const columns: DataTableColumn<Transaction>[] = [
    {
      id: 'date',
      header: 'Date',
      isRowHeader: true,
      allowsSorting: true,
      width: 140,
      cell: (row) => dateFormatter.format(new Date(`${row.date}T00:00:00Z`)),
    },
    {
      id: 'description',
      header: 'Description',
      allowsSorting: true,
      cell: (row) => row.description,
    },
    {
      id: 'category',
      header: 'Category',
      allowsSorting: true,
      width: 150,
      cell: (row) => (
        <Badge variant="soft" tone="neutral" size="sm">
          {row.category}
        </Badge>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      allowsSorting: true,
      width: 140,
      cell: (row) => (
        <Badge variant="status" tone={STATUS_TONE[row.status]} size="sm">
          {STATUS_LABEL[row.status]}
        </Badge>
      ),
    },
    {
      id: 'amount',
      header: 'Amount',
      align: 'end',
      allowsSorting: true,
      width: 150,
      cell: (row) => (
        <Amount
          value={row.amount}
          currency="USD"
          size="sm"
          tone={row.amount < 0 ? 'danger' : 'success'}
          formatOptions={{ signDisplay: 'exceptZero' }}
        />
      ),
    },
  ];

  return (
    <Card>
      <CardHeader divider>
        <CardTitle level={1}>Transactions</CardTitle>
        <CardDescription>Your 12 most recent account transactions.</CardDescription>
        <CardAction>
          <Button variant="outline" onClick={() => downloadCsv(filtered)} isDisabled={filtered.length === 0}>
            <IconDownload />
            Export CSV
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        <DataTableToolbar>
          <div className={styles.filters}>
            <SearchField
              aria-label="Search transactions"
              placeholder="Search by description"
              size="sm"
              value={search}
              onChange={setSearch}
              className={styles.search}
            />
            <Select
              label="Category"
              size="sm"
              selectedKey={category}
              onSelectionChange={(key) => setCategory(key == null ? 'all' : String(key))}
              className={styles.categoryField}
            >
              <SelectItem id="all">All categories</SelectItem>
              {CATEGORIES.map((c) => (
                <SelectItem key={c} id={c}>
                  {c}
                </SelectItem>
              ))}
            </Select>
            <DateRangePicker label="Date range" value={dateRange} onChange={setDateRange} className={styles.dateField} />
          </div>
        </DataTableToolbar>
        <DataTable
          aria-label="Recent transactions"
          columns={columns}
          rows={filtered}
          getRowId={(row) => row.id}
          emptyState={
            <EmptyState
              size="sm"
              icon={<IconInbox />}
              title="No transactions match your filters"
              description="Try a different search term, category or date range."
              action={
                hasFilters ? (
                  <Button variant="outline" size="sm" onClick={clearFilters}>
                    Clear filters
                  </Button>
                ) : undefined
              }
            />
          }
        />
      </CardContent>
    </Card>
  );
}

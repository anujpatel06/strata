import { useMemo, useState } from 'react';
import type { Key } from 'react-aria-components';
import { useLocale } from 'react-aria-components';
import { CalendarDate } from '@internationalized/date';
import {
  Amount,
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
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
  /** ISO date, yyyy-mm-dd. */
  date: string;
  description: string;
  category: string;
  status: TransactionStatus;
  /** Major units. Positive = money in, negative = money out. */
  amount: number;
}

const TRANSACTIONS: Transaction[] = [
  { id: 'txn_12', date: '2026-09-26', description: 'Whole Foods Market', category: 'Groceries', status: 'completed', amount: -840 },
  { id: 'txn_11', date: '2026-09-25', description: 'Monthly Salary — Acme Corp', category: 'Salary', status: 'completed', amount: 52000 },
  { id: 'txn_10', date: '2026-09-24', description: 'Netflix Subscription', category: 'Subscription', status: 'completed', amount: -799 },
  { id: 'txn_09', date: '2026-09-23', description: 'Uber ride to airport', category: 'Transport', status: 'pending', amount: -420 },
  { id: 'txn_08', date: '2026-09-21', description: 'Transfer to Priya Sharma', category: 'Transfer', status: 'completed', amount: -3000 },
  { id: 'txn_07', date: '2026-09-20', description: 'Amazon.in Order #4482', category: 'Shopping', status: 'failed', amount: -2599 },
  { id: 'txn_06', date: '2026-09-18', description: 'Electricity Bill — BESCOM', category: 'Utilities', status: 'completed', amount: -1200 },
  { id: 'txn_05', date: '2026-09-16', description: 'Starbucks Coffee', category: 'Dining', status: 'completed', amount: -350 },
  { id: 'txn_04', date: '2026-09-14', description: 'Apollo Pharmacy', category: 'Healthcare', status: 'pending', amount: -540 },
  { id: 'txn_03', date: '2026-09-11', description: 'Rent Payment — September', category: 'Rent', status: 'completed', amount: -18500 },
  { id: 'txn_02', date: '2026-09-08', description: 'Freelance Payment — Design Co', category: 'Transfer', status: 'completed', amount: 8000 },
  { id: 'txn_01', date: '2026-09-03', description: 'Spotify Premium', category: 'Subscription', status: 'failed', amount: -119 },
];

const CATEGORIES = Array.from(new Set(TRANSACTIONS.map((t) => t.category))).sort();

const STATUS_LABEL: Record<TransactionStatus, string> = {
  completed: 'Completed',
  pending: 'Pending',
  failed: 'Failed',
};

const STATUS_TONE: Record<TransactionStatus, 'success' | 'warning' | 'danger'> = {
  completed: 'success',
  pending: 'warning',
  failed: 'danger',
};

function parseCalendarDate(iso: string): CalendarDate {
  const [year, month, day] = iso.split('-').map(Number);
  return new CalendarDate(year, month, day);
}

function toCsv(rows: Transaction[]): string {
  const header = ['Date', 'Description', 'Category', 'Status', 'Amount'];
  const escape = (value: string) => `"${value.replace(/"/g, '""')}"`;
  const lines = rows.map((row) =>
    [row.date, escape(row.description), row.category, STATUS_LABEL[row.status], row.amount.toFixed(2)].join(','),
  );
  return [header.join(','), ...lines].join('\n');
}

function downloadCsv(csv: string) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'transactions.csv';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export default function Screen() {
  const { locale } = useLocale();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<Key>('all');
  const [dateRange, setDateRange] = useState<{ start: CalendarDate; end: CalendarDate } | null>(null);

  const dateFormatter = useMemo(
    () => new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short', year: 'numeric' }),
    [locale],
  );

  const hasActiveFilters = search.trim() !== '' || category !== 'all' || dateRange !== null;

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return TRANSACTIONS.filter((txn) => {
      if (query && !txn.description.toLowerCase().includes(query)) return false;
      if (category !== 'all' && txn.category !== category) return false;
      if (dateRange) {
        const txnDate = txn.date;
        if (txnDate < dateRange.start.toString() || txnDate > dateRange.end.toString()) return false;
      }
      return true;
    });
  }, [search, category, dateRange]);

  const resetFilters = () => {
    setSearch('');
    setCategory('all');
    setDateRange(null);
  };

  const columns: DataTableColumn<Transaction>[] = [
    {
      id: 'date',
      header: 'Date',
      isRowHeader: true,
      cell: (row) => dateFormatter.format(parseCalendarDate(row.date).toDate('UTC')),
    },
    {
      id: 'description',
      header: 'Description',
      cell: (row) => row.description,
    },
    {
      id: 'category',
      header: 'Category',
      cell: (row) => (
        <Badge tone="neutral" variant="soft" size="sm">
          {row.category}
        </Badge>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      cell: (row) => (
        <Badge tone={STATUS_TONE[row.status]} variant="status">
          {STATUS_LABEL[row.status]}
        </Badge>
      ),
    },
    {
      id: 'amount',
      header: 'Amount',
      align: 'end',
      cell: (row) => (
        <Amount
          value={row.amount}
          currency="INR"
          size="sm"
          tone={row.amount > 0 ? 'success' : 'neutral'}
          formatOptions={{ signDisplay: 'exceptZero' }}
        />
      ),
    },
  ];

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Transactions</h1>
        <p className={styles.subtitle}>Your 12 most recent account transactions.</p>
      </header>

      <Card>
        <CardHeader divider>
          <CardTitle level={2}>Recent activity</CardTitle>
          <CardDescription>Search, filter by category or date, and export the results.</CardDescription>
        </CardHeader>
        <CardContent variant="inset">
          <DataTableToolbar>
            <div className={styles.filters}>
              <SearchField
                aria-label="Search transactions"
                placeholder="Search by description"
                value={search}
                onChange={setSearch}
                className={styles.search}
              />
              <Select
                aria-label="Filter by category"
                selectedKey={category}
                onSelectionChange={setCategory}
                className={styles.categorySelect}
              >
                <SelectItem id="all">All categories</SelectItem>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat} id={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </Select>
              <DateRangePicker
                aria-label="Filter by date range"
                value={dateRange}
                onChange={setDateRange}
                className={styles.dateRange}
              />
            </div>
            <Button variant="outline" size="md" onPress={() => downloadCsv(toCsv(filtered))}>
              <IconDownload aria-hidden />
              Export CSV
            </Button>
          </DataTableToolbar>

          <DataTable
            aria-label="Transactions"
            columns={columns}
            rows={filtered}
            getRowId={(row) => row.id}
            emptyState={
              <EmptyState
                size="sm"
                icon={<IconInbox aria-hidden />}
                title="No transactions found"
                description="Try adjusting your search or filters to find what you're looking for."
                action={
                  hasActiveFilters ? (
                    <Button variant="outline" size="sm" onPress={resetFilters}>
                      Clear filters
                    </Button>
                  ) : undefined
                }
              />
            }
          />
        </CardContent>
      </Card>
    </div>
  );
}

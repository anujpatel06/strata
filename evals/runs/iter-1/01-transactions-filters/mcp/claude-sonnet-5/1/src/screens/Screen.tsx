import { useMemo, useState } from 'react';
import {
  Amount,
  Badge,
  Button,
  Card,
  CardContent,
  DataTable,
  DataTableToolbar,
  DateRangePicker,
  EmptyState,
  SearchField,
  Select,
  SelectItem,
  type DataTableColumn,
} from '@strata/react';
import { IconDownload, IconReceipt } from '@strata/icons';
import styles from './Screen.module.css';

type Status = 'completed' | 'pending' | 'failed';

interface Transaction {
  id: string;
  date: string;
  description: string;
  category: string;
  status: Status;
  amount: number;
}

const TRANSACTIONS: Transaction[] = [
  { id: 't1', date: '2026-09-27', description: 'Whole Foods Market', category: 'Groceries', status: 'completed', amount: -86.42 },
  { id: 't2', date: '2026-09-26', description: 'Salary — Acme Corp', category: 'Salary', status: 'completed', amount: 4200 },
  { id: 't3', date: '2026-09-25', description: 'Netflix', category: 'Subscription', status: 'completed', amount: -15.49 },
  { id: 't4', date: '2026-09-24', description: 'Electric Company', category: 'Utilities', status: 'pending', amount: -112.3 },
  { id: 't5', date: '2026-09-23', description: 'Transfer to Alex Chen', category: 'Transfer', status: 'completed', amount: -300 },
  { id: 't6', date: '2026-09-22', description: 'The Coffee House', category: 'Dining', status: 'completed', amount: -6.75 },
  { id: 't7', date: '2026-09-21', description: 'Amazon', category: 'Shopping', status: 'failed', amount: -58.2 },
  { id: 't8', date: '2026-09-20', description: 'Gym Membership', category: 'Health', status: 'completed', amount: -40 },
  { id: 't9', date: '2026-09-18', description: 'Uber', category: 'Travel', status: 'completed', amount: -23.1 },
  { id: 't10', date: '2026-09-15', description: 'Rent Payment', category: 'Rent', status: 'completed', amount: -1450 },
  { id: 't11', date: '2026-09-12', description: 'Refund — Zara', category: 'Shopping', status: 'completed', amount: 42.99 },
  { id: 't12', date: '2026-09-10', description: 'Spotify', category: 'Subscription', status: 'pending', amount: -9.99 },
];

const ALL_CATEGORIES = '__all';
const CATEGORIES = Array.from(new Set(TRANSACTIONS.map((t) => t.category))).sort();

const STATUS_TONE: Record<Status, 'success' | 'warning' | 'danger'> = {
  completed: 'success',
  pending: 'warning',
  failed: 'danger',
};

const STATUS_LABEL: Record<Status, string> = {
  completed: 'Completed',
  pending: 'Pending',
  failed: 'Failed',
};

const dateFormatter = new Intl.DateTimeFormat('en-US', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });

function formatDate(iso: string) {
  return dateFormatter.format(new Date(`${iso}T00:00:00Z`));
}

/** Quotes a CSV field when it contains a separator, quote or line break. */
function csvCell(value: string | number) {
  const s = String(value);
  return /[",\n]/.test(s) ? `"${s.replaceAll('"', '""')}"` : s;
}

function downloadCsv(rows: Transaction[]) {
  const header = ['Date', 'Description', 'Category', 'Status', 'Amount'];
  const lines = rows.map((r) =>
    [r.date, r.description, r.category, STATUS_LABEL[r.status], r.amount].map(csvCell).join(','),
  );
  // Leading BOM so spreadsheet apps read the file as UTF-8.
  const blob = new Blob(['﻿' + [header.join(','), ...lines].join('\r\n')], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'transactions.csv';
  link.click();
  URL.revokeObjectURL(url);
}

interface DateValueLike {
  toString(): string;
}

interface DateRange {
  start: DateValueLike;
  end: DateValueLike;
}

const columns: DataTableColumn<Transaction>[] = [
  {
    id: 'date',
    header: 'Date',
    allowsSorting: true,
    cell: (row) => <time dateTime={row.date}>{formatDate(row.date)}</time>,
  },
  {
    id: 'description',
    header: 'Description',
    isRowHeader: true,
    cell: (row) => row.description,
  },
  {
    id: 'category',
    header: 'Category',
    cell: (row) => row.category,
  },
  {
    id: 'status',
    header: 'Status',
    cell: (row) => (
      <Badge variant="status" tone={STATUS_TONE[row.status]}>
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
        currency="USD"
        size="sm"
        tone={row.amount > 0 ? 'success' : 'neutral'}
        formatOptions={{ signDisplay: 'exceptZero' }}
      />
    ),
  },
];

export default function Screen() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<string>(ALL_CATEGORIES);
  const [range, setRange] = useState<DateRange | null>(null);
  const [rangeKey, setRangeKey] = useState(0);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const start = range?.start.toString();
    const end = range?.end.toString();
    return TRANSACTIONS.filter((t) => {
      if (category !== ALL_CATEGORIES && t.category !== category) return false;
      if (start && t.date < start) return false;
      if (end && t.date > end) return false;
      if (q && !`${t.description} ${t.category}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [query, category, range]);

  const hasFilters = query !== '' || category !== ALL_CATEGORIES || range !== null;

  const clearFilters = () => {
    setQuery('');
    setCategory(ALL_CATEGORIES);
    setRange(null);
    setRangeKey((k) => k + 1);
  };

  return (
    <main className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Transactions</h1>
          <p className={styles.subtitle}>Your most recent account activity.</p>
        </div>
        <Button variant="outline" onPress={() => downloadCsv(filtered)} isDisabled={filtered.length === 0}>
          <IconDownload aria-hidden />
          Export CSV
        </Button>
      </div>

      <Card>
        <DataTableToolbar className={styles.toolbar}>
          <div className={styles.filters}>
            <SearchField
              aria-label="Search transactions"
              placeholder="Search by description or category"
              value={query}
              onChange={setQuery}
              className={styles.search}
            />
            <Select
              aria-label="Filter by category"
              selectedKey={category}
              onSelectionChange={(key) => setCategory(key == null ? ALL_CATEGORIES : String(key))}
              className={styles.category}
            >
              <SelectItem id={ALL_CATEGORIES}>All categories</SelectItem>
              {CATEGORIES.map((c) => (
                <SelectItem key={c} id={c}>
                  {c}
                </SelectItem>
              ))}
            </Select>
            <DateRangePicker
              key={rangeKey}
              aria-label="Filter by date range"
              onChange={setRange}
              className={styles.dateRange}
            />
          </div>
        </DataTableToolbar>

        <p className={styles.count} aria-live="polite">
          {hasFilters ? `Showing ${filtered.length} of ${TRANSACTIONS.length} transactions` : `${TRANSACTIONS.length} transactions`}
        </p>

        <CardContent variant="inset" className={styles.tableWell}>
          <DataTable
            aria-label="Transactions"
            columns={columns}
            rows={filtered}
            getRowId={(row) => row.id}
            emptyState={
              <EmptyState
                size="sm"
                icon={<IconReceipt />}
                title="No transactions found"
                description="Try adjusting your search or filters."
                action={
                  <Button variant="outline" size="sm" onPress={clearFilters}>
                    Clear filters
                  </Button>
                }
              />
            }
          />
        </CardContent>
      </Card>
    </main>
  );
}

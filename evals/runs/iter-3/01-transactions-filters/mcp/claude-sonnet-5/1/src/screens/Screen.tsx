import { useMemo, useState } from 'react';
import { parseDate, type CalendarDate, type DateValue } from '@internationalized/date';
import {
  Amount,
  Badge,
  Button,
  Card,
  CardContent,
  DataTable,
  DataTableToolbar,
  EmptyState,
  DateRangePicker,
  SearchField,
  Select,
  SelectItem,
  Tag,
  useSortedRows,
  type DataTableColumn,
  type DataTableSortDescriptor,
} from '@syntara/react';
import { IconDownload, IconSearch } from '@syntara/icons';
import styles from './Screen.module.css';

interface Transaction {
  id: string;
  date: string;
  description: string;
  category: string;
  status: 'completed' | 'pending' | 'failed';
  amount: number;
}

const TRANSACTIONS: Transaction[] = [
  { id: 'txn-01', date: '2026-09-27', description: 'Whole Foods Market', category: 'Groceries', status: 'completed', amount: -84.32 },
  { id: 'txn-02', date: '2026-09-26', description: 'Salary — Acme Corp', category: 'Income', status: 'completed', amount: 4200 },
  { id: 'txn-03', date: '2026-09-26', description: 'Uber Trip', category: 'Transport', status: 'completed', amount: -18.5 },
  { id: 'txn-04', date: '2026-09-25', description: 'Netflix Subscription', category: 'Subscriptions', status: 'completed', amount: -15.99 },
  { id: 'txn-05', date: '2026-09-24', description: 'Transfer to Savings', category: 'Transfer', status: 'completed', amount: -500 },
  { id: 'txn-06', date: '2026-09-23', description: 'Electric Bill', category: 'Utilities', status: 'pending', amount: -76.2 },
  { id: 'txn-07', date: '2026-09-22', description: 'Amazon Purchase', category: 'Shopping', status: 'completed', amount: -142.75 },
  { id: 'txn-08', date: '2026-09-21', description: 'Gym Membership', category: 'Health & Fitness', status: 'failed', amount: -45 },
  { id: 'txn-09', date: '2026-09-20', description: 'Freelance Payment', category: 'Income', status: 'completed', amount: 850 },
  { id: 'txn-10', date: '2026-09-19', description: 'Coffee Shop', category: 'Dining', status: 'completed', amount: -6.75 },
  { id: 'txn-11', date: '2026-09-18', description: 'Rent Payment', category: 'Housing', status: 'pending', amount: -1450 },
  { id: 'txn-12', date: '2026-09-17', description: 'Spotify Subscription', category: 'Subscriptions', status: 'failed', amount: -9.99 },
];

const CATEGORIES = Array.from(new Set(TRANSACTIONS.map((t) => t.category))).sort();

const STATUS_TONE: Record<Transaction['status'], 'success' | 'warning' | 'danger'> = {
  completed: 'success',
  pending: 'warning',
  failed: 'danger',
};

const STATUS_LABEL: Record<Transaction['status'], string> = {
  completed: 'Completed',
  pending: 'Pending',
  failed: 'Failed',
};

const ALL_CATEGORIES = '__all';

const dateFormatter = new Intl.DateTimeFormat('en-US', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });

function formatDate(iso: string): string {
  return dateFormatter.format(new Date(`${iso}T00:00:00Z`));
}

function csvCell(value: string | number): string {
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

const accessors = {
  date: (r: Transaction) => r.date,
  description: (r: Transaction) => r.description,
  category: (r: Transaction) => r.category,
  status: (r: Transaction) => STATUS_LABEL[r.status],
  amount: (r: Transaction) => r.amount,
};

export default function Screen() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<string>(ALL_CATEGORIES);
  const [dateRange, setDateRange] = useState<{ start: DateValue; end: DateValue } | null>(null);
  const [sort, setSort] = useState<DataTableSortDescriptor>({ column: 'date', direction: 'descending' });

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const start = dateRange?.start as CalendarDate | undefined;
    const end = dateRange?.end as CalendarDate | undefined;
    return TRANSACTIONS.filter((row) => {
      if (category !== ALL_CATEGORIES && row.category !== category) return false;
      if (q && !`${row.description} ${row.category}`.toLowerCase().includes(q)) return false;
      if (start || end) {
        const rowDate = parseDate(row.date);
        if (start && rowDate.compare(start) < 0) return false;
        if (end && rowDate.compare(end) > 0) return false;
      }
      return true;
    });
  }, [query, category, dateRange]);

  const sorted = useSortedRows(filtered, sort, accessors);

  const clearFilters = () => {
    setQuery('');
    setCategory(ALL_CATEGORIES);
    setDateRange(null);
  };

  const exportCsv = () => {
    const header = ['Date', 'Description', 'Category', 'Status', 'Amount'];
    const lines = sorted.map((row) =>
      [row.date, row.description, row.category, STATUS_LABEL[row.status], row.amount].map(csvCell).join(','),
    );
    const blob = new Blob(['﻿' + [header.map(csvCell).join(','), ...lines].join('\r\n')], {
      type: 'text/csv;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'transactions.csv';
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 0);
  };

  const columns = useMemo<DataTableColumn<Transaction>[]>(
    () => [
      {
        id: 'date',
        header: 'Date',
        allowsSorting: true,
        cell: (row) => (
          <time dateTime={row.date} className={styles.date}>
            {formatDate(row.date)}
          </time>
        ),
      },
      {
        id: 'description',
        header: 'Description',
        isRowHeader: true,
        allowsSorting: true,
        cell: (row) => row.description,
      },
      {
        id: 'category',
        header: 'Category',
        allowsSorting: true,
        cell: (row) => <Tag size="sm">{row.category}</Tag>,
      },
      {
        id: 'status',
        header: 'Status',
        allowsSorting: true,
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
        allowsSorting: true,
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
    ],
    [],
  );

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Transactions</h1>
        <p className={styles.description}>Search and filter your recent account activity.</p>
      </div>

      <Card className={styles.card}>
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
              placeholder="All categories"
              selectedKey={category}
              onSelectionChange={(key) => setCategory(key == null ? ALL_CATEGORIES : String(key))}
              className={styles.categorySelect}
            >
              <SelectItem id={ALL_CATEGORIES}>All categories</SelectItem>
              {CATEGORIES.map((c) => (
                <SelectItem key={c} id={c}>
                  {c}
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
          <div className={styles.tools}>
            <Button variant="outline" onPress={exportCsv} isDisabled={sorted.length === 0}>
              <IconDownload aria-hidden />
              Export CSV
            </Button>
          </div>
        </DataTableToolbar>

        <CardContent variant="inset" className={styles.tableWell}>
          <DataTable
            aria-label="Transactions"
            columns={columns}
            rows={sorted}
            getRowId={(row) => row.id}
            sortDescriptor={sort}
            onSortChange={setSort}
            stickyHeader={false}
            className={styles.table}
            emptyState={
              <EmptyState
                size="sm"
                icon={<IconSearch />}
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
    </div>
  );
}

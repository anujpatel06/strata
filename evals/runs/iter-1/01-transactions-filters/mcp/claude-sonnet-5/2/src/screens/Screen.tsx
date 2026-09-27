import { useId, useMemo, useState } from 'react';
import type { DateValue } from '@internationalized/date';
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
  Tag,
  useSortedRows,
  type DataTableColumn,
  type DataTableSortDescriptor,
} from '@strata/react';
import { IconDownload, IconReceipt } from '@strata/icons';
import styles from './Screen.module.css';

type Status = 'completed' | 'pending' | 'failed';

interface Transaction {
  id: string;
  /** ISO date, yyyy-mm-dd. */
  date: string;
  description: string;
  category: string;
  status: Status;
  /** Major currency units. Negative is money out, positive is money in. */
  amount: number;
}

const CURRENCY = 'USD';
const ALL_CATEGORIES = '__all';

const TRANSACTIONS: Transaction[] = [
  { id: 'txn_1001', date: '2026-09-25', description: 'Whole Foods Market', category: 'Groceries', status: 'completed', amount: -84.32 },
  { id: 'txn_1002', date: '2026-09-24', description: 'Monthly salary', category: 'Income', status: 'completed', amount: 4200 },
  { id: 'txn_1003', date: '2026-09-23', description: 'Uber ride', category: 'Transport', status: 'completed', amount: -18.6 },
  { id: 'txn_1004', date: '2026-09-22', description: 'Netflix subscription', category: 'Subscriptions', status: 'completed', amount: -15.49 },
  { id: 'txn_1005', date: '2026-09-20', description: 'Electricity bill', category: 'Utilities', status: 'pending', amount: -96.1 },
  { id: 'txn_1006', date: '2026-09-19', description: 'Transfer to Alex Rivera', category: 'Transfer', status: 'completed', amount: -250 },
  { id: 'txn_1007', date: '2026-09-18', description: 'The Green Bowl', category: 'Dining', status: 'completed', amount: -42.75 },
  { id: 'txn_1008', date: '2026-09-16', description: 'City Fitness membership', category: 'Health', status: 'failed', amount: -55 },
  { id: 'txn_1009', date: '2026-09-14', description: 'Amazon order', category: 'Shopping', status: 'completed', amount: -63.9 },
  { id: 'txn_1010', date: '2026-09-12', description: 'Refund — Zara', category: 'Shopping', status: 'completed', amount: 29.99 },
  { id: 'txn_1011', date: '2026-09-10', description: 'Cinema City tickets', category: 'Entertainment', status: 'pending', amount: -32 },
  { id: 'txn_1012', date: '2026-09-08', description: 'Freelance payment', category: 'Income', status: 'failed', amount: 600 },
];

const STATUS_LABEL: Record<Status, string> = {
  completed: 'Completed',
  pending: 'Pending',
  failed: 'Failed',
};

const STATUS_TONE: Record<Status, 'success' | 'warning' | 'danger'> = {
  completed: 'success',
  pending: 'warning',
  failed: 'danger',
};

const dateFormatter = new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'short', year: 'numeric' });

const accessors = {
  date: (r: Transaction) => r.date,
  description: (r: Transaction) => r.description,
  category: (r: Transaction) => r.category,
  status: (r: Transaction) => STATUS_LABEL[r.status],
  amount: (r: Transaction) => r.amount,
};

/** Quotes a CSV field when it contains a separator, quote or line break. */
function csvCell(value: string | number): string {
  const s = String(value);
  return /[",\n]/.test(s) ? `"${s.replaceAll('"', '""')}"` : s;
}

type DateRange = { start: DateValue; end: DateValue } | null;

export default function Screen() {
  const uid = useId();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState(ALL_CATEGORIES);
  const [range, setRange] = useState<DateRange>(null);
  const [sort, setSort] = useState<DataTableSortDescriptor>({ column: 'date', direction: 'descending' });

  const categories = useMemo(() => Array.from(new Set(TRANSACTIONS.map((t) => t.category))).sort(), []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const start = range?.start.toString();
    const end = range?.end.toString();
    return TRANSACTIONS.filter((t) => {
      if (category !== ALL_CATEGORIES && t.category !== category) return false;
      if (start && end && (t.date < start || t.date > end)) return false;
      if (q && !t.description.toLowerCase().includes(q) && !t.category.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [query, category, range]);

  const sorted = useSortedRows(filtered, sort, accessors);

  const hasFilters = query !== '' || category !== ALL_CATEGORIES || range !== null;

  const clearFilters = () => {
    setQuery('');
    setCategory(ALL_CATEGORIES);
    setRange(null);
  };

  const exportCsv = () => {
    const header = ['Date', 'Description', 'Category', 'Status', 'Amount'];
    const lines = sorted.map((t) =>
      [t.date, t.description, t.category, STATUS_LABEL[t.status], t.amount.toFixed(2)].map(csvCell).join(','),
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
            {dateFormatter.format(new Date(`${row.date}T00:00:00`))}
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
            currency={CURRENCY}
            size="sm"
            tone={row.amount < 0 ? 'neutral' : 'success'}
            formatOptions={{ signDisplay: 'exceptZero' }}
          />
        ),
      },
    ],
    [],
  );

  return (
    <div className={styles.root}>
      <header className={styles.header}>
        <h1 id={`${uid}-title`} className={styles.title}>
          Transactions
        </h1>
        <p className={styles.subtitle}>Search, filter and export your recent account activity.</p>
      </header>

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
              selectedKey={category}
              onSelectionChange={(key) => setCategory(key == null ? ALL_CATEGORIES : String(key))}
              className={styles.categoryFilter}
            >
              <SelectItem id={ALL_CATEGORIES}>All categories</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c} id={c}>
                  {c}
                </SelectItem>
              ))}
            </Select>
            <DateRangePicker
              aria-label="Filter by date range"
              value={range}
              onChange={setRange}
              className={styles.dateFilter}
            />
          </div>
          <Button variant="outline" onPress={exportCsv} isDisabled={sorted.length === 0}>
            <IconDownload aria-hidden />
            Export CSV
          </Button>
        </DataTableToolbar>

        <CardContent variant="inset" className={styles.tableWell}>
          <DataTable
            aria-labelledby={`${uid}-title`}
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
                icon={<IconReceipt />}
                title="No transactions found"
                description="Try adjusting your search or filters."
                action={
                  hasFilters ? (
                    <Button variant="outline" size="sm" onPress={clearFilters}>
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

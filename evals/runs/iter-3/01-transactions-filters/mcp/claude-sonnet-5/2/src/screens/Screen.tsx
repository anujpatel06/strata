import { useMemo, useState } from 'react';
import { parseDate, type DateValue } from '@internationalized/date';
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
} from '@syntara/react';
import { IconDownload, IconSearch } from '@syntara/icons';
import styles from './Screen.module.css';

type Status = 'completed' | 'pending' | 'failed';

type Transaction = {
  id: string;
  date: string;
  description: string;
  category: string;
  status: Status;
  amount: number;
};

const transactions: Transaction[] = [
  { id: 'txn-1', date: '2026-09-27', description: 'Whole Foods Market', category: 'Groceries', status: 'completed', amount: -84.32 },
  { id: 'txn-2', date: '2026-09-26', description: 'Monthly salary', category: 'Salary', status: 'completed', amount: 4200 },
  { id: 'txn-3', date: '2026-09-25', description: 'Uber trip', category: 'Transport', status: 'completed', amount: -18.5 },
  { id: 'txn-4', date: '2026-09-24', description: 'Netflix subscription', category: 'Entertainment', status: 'completed', amount: -15.99 },
  { id: 'txn-5', date: '2026-09-23', description: 'Electricity bill', category: 'Utilities', status: 'pending', amount: -120 },
  { id: 'txn-6', date: '2026-09-21', description: 'The Coffee House', category: 'Dining', status: 'completed', amount: -6.75 },
  { id: 'txn-7', date: '2026-09-20', description: 'Transfer to Alex Chen', category: 'Transfer', status: 'completed', amount: -250 },
  { id: 'txn-8', date: '2026-09-18', description: 'Amazon order', category: 'Shopping', status: 'failed', amount: -64.2 },
  { id: 'txn-9', date: '2026-09-16', description: 'Gym membership', category: 'Health', status: 'completed', amount: -45 },
  { id: 'txn-10', date: '2026-09-14', description: 'Flight booking', category: 'Travel', status: 'pending', amount: -412.6 },
  { id: 'txn-11', date: '2026-09-10', description: 'Water bill', category: 'Utilities', status: 'failed', amount: -38.1 },
  { id: 'txn-12', date: '2026-09-05', description: 'Cinema tickets', category: 'Entertainment', status: 'completed', amount: -32 },
];

const categories = Array.from(new Set(transactions.map((t) => t.category))).sort();

const statusTone = { completed: 'success', pending: 'warning', failed: 'danger' } as const;
const statusLabel = { completed: 'Completed', pending: 'Pending', failed: 'Failed' } as const;

const ALL_CATEGORIES = '__all';
const CURRENCY = 'USD';

const day = new Intl.DateTimeFormat('en-US', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });

const accessors = {
  date: (row: Transaction) => row.date,
  description: (row: Transaction) => row.description,
  category: (row: Transaction) => row.category,
  status: (row: Transaction) => statusLabel[row.status],
  amount: (row: Transaction) => row.amount,
};

const csvCell = (value: string | number) => {
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
};

export default function Screen() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<string>(ALL_CATEGORIES);
  const [range, setRange] = useState<{ start: DateValue; end: DateValue } | null>(null);
  const [sort, setSort] = useState<DataTableSortDescriptor>({ column: 'date', direction: 'descending' });

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return transactions.filter((row) => {
      if (category !== ALL_CATEGORIES && row.category !== category) return false;
      if (range) {
        const rowDate = parseDate(row.date);
        if (rowDate.compare(range.start) < 0 || rowDate.compare(range.end) > 0) return false;
      }
      if (q && !`${row.description} ${row.category}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [query, category, range]);

  const sorted = useSortedRows(filtered, sort, accessors);

  const clearFilters = () => {
    setQuery('');
    setCategory(ALL_CATEGORIES);
    setRange(null);
  };

  const exportCsv = () => {
    const header = ['Date', 'Description', 'Category', 'Status', 'Amount'];
    const lines = sorted.map((row) =>
      [row.date, row.description, row.category, statusLabel[row.status], row.amount].map(csvCell).join(','),
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

  const columns: DataTableColumn<Transaction>[] = [
    {
      id: 'date',
      header: 'Date',
      allowsSorting: true,
      cell: (row) => <time dateTime={row.date}>{day.format(new Date(`${row.date}T00:00:00Z`))}</time>,
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
        <Badge variant="status" tone={statusTone[row.status]}>
          {statusLabel[row.status]}
        </Badge>
      ),
    },
    {
      id: 'amount',
      header: 'Amount',
      align: 'end',
      allowsSorting: true,
      cell: (row) => <Amount value={row.amount} currency={CURRENCY} size="sm" />,
    },
  ];

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.titleBlock}>
          <h1 className={styles.title}>Transactions</h1>
          <p className={styles.subtitle}>Review recent activity on your account.</p>
        </div>
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
              aria-label="Category"
              placeholder="All categories"
              selectedKey={category}
              onSelectionChange={(key) => setCategory(key == null ? ALL_CATEGORIES : String(key))}
              className={styles.categorySelect}
            >
              <SelectItem id={ALL_CATEGORIES}>All categories</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c} id={c}>
                  {c}
                </SelectItem>
              ))}
            </Select>
            <DateRangePicker
              aria-label="Date range"
              value={range}
              onChange={setRange}
              className={styles.dateRange}
            />
          </div>
          <div className={styles.actions}>
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
            emptyState={
              <EmptyState
                size="sm"
                icon={<IconSearch />}
                title="No transactions match your filters"
                description="Try a different search term, category or date range."
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

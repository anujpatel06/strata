import { useMemo, useState } from 'react';
import { useLocale } from 'react-aria';
import type { DateValue } from '@internationalized/date';
import {
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
  type DataTableColumn,
} from '@strata/react';
import { IconDownload, IconSearch } from '@strata/icons';
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
  { id: 'TXN-3001', date: '2026-09-26', description: 'Whole Foods Market', category: 'Groceries', status: 'completed', amount: -84.32 },
  { id: 'TXN-3000', date: '2026-09-25', description: 'Payroll Deposit', category: 'Salary', status: 'completed', amount: 3200 },
  { id: 'TXN-2999', date: '2026-09-24', description: 'Netflix', category: 'Subscriptions', status: 'completed', amount: -15.99 },
  { id: 'TXN-2998', date: '2026-09-23', description: 'Transfer to Alex Chen', category: 'Transfer', status: 'completed', amount: -250 },
  { id: 'TXN-2997', date: '2026-09-22', description: 'Uber Eats', category: 'Dining', status: 'pending', amount: -32.45 },
  { id: 'TXN-2996', date: '2026-09-21', description: 'Electric Company', category: 'Utilities', status: 'failed', amount: -110.2 },
  { id: 'TXN-2995', date: '2026-09-20', description: 'Amazon', category: 'Shopping', status: 'completed', amount: -67.89 },
  { id: 'TXN-2994', date: '2026-09-18', description: 'Delta Airlines', category: 'Travel', status: 'pending', amount: -420 },
  { id: 'TXN-2993', date: '2026-09-17', description: 'Spotify', category: 'Subscriptions', status: 'completed', amount: -9.99 },
  { id: 'TXN-2992', date: '2026-09-15', description: "Trader Joe's", category: 'Groceries', status: 'completed', amount: -46.1 },
  { id: 'TXN-2991', date: '2026-09-12', description: 'Transfer from Jordan Lee', category: 'Transfer', status: 'completed', amount: 500 },
  { id: 'TXN-2990', date: '2026-09-10', description: 'Gym Membership', category: 'Subscriptions', status: 'failed', amount: -45 },
];

const categories = Array.from(new Set(transactions.map((t) => t.category))).sort();

const statusCopy: Record<Status, { label: string; tone: 'success' | 'warning' | 'danger' }> = {
  completed: { label: 'Completed', tone: 'success' },
  pending: { label: 'Pending', tone: 'warning' },
  failed: { label: 'Failed', tone: 'danger' },
};

const ALL_CATEGORIES = '__all';

const csvCell = (value: string | number) => {
  const s = String(value);
  return /[",\n]/.test(s) ? `"${s.replaceAll('"', '""')}"` : s;
};

export default function Screen() {
  const { locale } = useLocale();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<string>(ALL_CATEGORIES);
  const [dateRange, setDateRange] = useState<{ start: DateValue; end: DateValue } | null>(null);

  const dateFormatter = useMemo(
    () => new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }),
    [locale],
  );
  const amountFormatter = useMemo(
    () => new Intl.NumberFormat(locale, { style: 'currency', currency: 'USD', signDisplay: 'exceptZero' }),
    [locale],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLocaleLowerCase(locale);
    const start = dateRange?.start.toString();
    const end = dateRange?.end.toString();
    return transactions.filter((t) => {
      const matchesQuery = !q || t.description.toLocaleLowerCase(locale).includes(q) || t.category.toLocaleLowerCase(locale).includes(q);
      const matchesCategory = category === ALL_CATEGORIES || t.category === category;
      const matchesDate = !start || !end || (t.date >= start && t.date <= end);
      return matchesQuery && matchesCategory && matchesDate;
    });
  }, [query, category, dateRange, locale]);

  const clearFilters = () => {
    setQuery('');
    setCategory(ALL_CATEGORIES);
    setDateRange(null);
  };

  const exportCsv = () => {
    const header = ['Date', 'Description', 'Category', 'Status', 'Amount'];
    const lines = filtered.map((t) =>
      [t.date, t.description, t.category, statusCopy[t.status].label, t.amount].map(csvCell).join(','),
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
          <time dateTime={row.date}>{dateFormatter.format(new Date(`${row.date}T00:00:00Z`))}</time>
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
          <Badge variant="status" tone={statusCopy[row.status].tone}>
            {statusCopy[row.status].label}
          </Badge>
        ),
      },
      {
        id: 'amount',
        header: 'Amount',
        align: 'end',
        allowsSorting: true,
        cell: (row) => (
          <span className={row.amount > 0 ? styles.amountIn : undefined}>{amountFormatter.format(row.amount)}</span>
        ),
      },
    ],
    [dateFormatter, amountFormatter],
  );

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.titleBlock}>
          <h1 className={styles.title}>Transactions</h1>
          <p className={styles.description}>Your 12 most recent account transactions.</p>
        </div>
        <Button variant="outline" onPress={exportCsv} isDisabled={filtered.length === 0}>
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
              {categories.map((c) => (
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
        </DataTableToolbar>

        <CardContent variant="inset">
          <DataTable
            aria-label="Transactions"
            columns={columns}
            rows={filtered}
            getRowId={(row) => row.id}
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

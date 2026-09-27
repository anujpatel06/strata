'use client';

import { useMemo, useState } from 'react';
import {
  Badge,
  Button,
  Card,
  CardContent,
  DataTable,
  DataTableToolbar,
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

interface Transaction {
  id: string;
  date: string;
  description: string;
  category: string;
  status: Status;
  amount: number;
}

const TODAY = new Date('2026-09-27T00:00:00Z');
const CURRENCY = 'USD';
const LOCALE = 'en-US';
const ALL = '__all';

const transactions: Transaction[] = [
  { id: 'TXN-30412', date: '2026-09-26', description: 'Whole Foods Market', category: 'Groceries', status: 'completed', amount: -86.42 },
  { id: 'TXN-30398', date: '2026-09-25', description: 'Acme Corp Payroll', category: 'Income', status: 'completed', amount: 3200 },
  { id: 'TXN-30375', date: '2026-09-24', description: 'Metro Transit Pass', category: 'Transport', status: 'completed', amount: -55 },
  { id: 'TXN-30361', date: '2026-09-22', description: 'Riverside Electric Co.', category: 'Utilities', status: 'pending', amount: -142.7 },
  { id: 'TXN-30340', date: '2026-09-20', description: 'The Corner Bistro', category: 'Dining', status: 'completed', amount: -47.15 },
  { id: 'TXN-30322', date: '2026-09-18', description: 'Streamline+ Subscription', category: 'Entertainment', status: 'failed', amount: -14.99 },
  { id: 'TXN-30298', date: '2026-09-14', description: 'Cityline Apartments', category: 'Rent', status: 'completed', amount: -1450 },
  { id: 'TXN-30271', date: '2026-09-10', description: 'Northside Pharmacy', category: 'Healthcare', status: 'completed', amount: -32.5 },
  { id: 'TXN-30255', date: '2026-09-07', description: 'Lakeview Dental', category: 'Healthcare', status: 'pending', amount: -210 },
  { id: 'TXN-30219', date: '2026-08-29', description: 'Harbor Outfitters', category: 'Shopping', status: 'completed', amount: -93.2 },
  { id: 'TXN-30188', date: '2026-08-20', description: 'Transfer to Savings', category: 'Transfer', status: 'completed', amount: -500 },
  { id: 'TXN-30152', date: '2026-08-05', description: 'Skyline Airlines', category: 'Travel', status: 'failed', amount: -412.6 },
];

const statusCopy: Record<Status, { label: string; tone: 'success' | 'warning' | 'danger' }> = {
  completed: { label: 'Completed', tone: 'success' },
  pending: { label: 'Pending', tone: 'warning' },
  failed: { label: 'Failed', tone: 'danger' },
};

const dateRanges = [
  { id: ALL, label: 'All time' },
  { id: '7', label: 'Last 7 days' },
  { id: '30', label: 'Last 30 days' },
  { id: '90', label: 'Last 90 days' },
];

const categories = Array.from(new Set(transactions.map((t) => t.category))).sort();

const money = new Intl.NumberFormat(LOCALE, { style: 'currency', currency: CURRENCY });
const day = new Intl.DateTimeFormat(LOCALE, { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });

const csvCell = (v: string | number) => {
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replaceAll('"', '""')}"` : s;
};

const columns: DataTableColumn<Transaction>[] = [
  {
    id: 'date',
    header: 'Date',
    allowsSorting: true,
    cell: (row) => (
      <time dateTime={row.date} className={styles.date}>
        {day.format(new Date(`${row.date}T00:00:00Z`))}
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
      <span className={styles.amount}>
        {row.amount > 0 ? '+' : ''}
        {money.format(row.amount)}
      </span>
    ),
  },
];

export default function Screen() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<string>(ALL);
  const [dateRange, setDateRange] = useState<string>(ALL);

  const filtered = useMemo(() => {
    const q = query.trim().toLocaleLowerCase(LOCALE);
    const maxDays = dateRange === ALL ? undefined : Number(dateRange);
    return transactions.filter((t) => {
      if (category !== ALL && t.category !== category) return false;
      if (maxDays !== undefined) {
        const ageDays = (TODAY.getTime() - new Date(`${t.date}T00:00:00Z`).getTime()) / 86_400_000;
        if (ageDays > maxDays) return false;
      }
      if (q && ![t.description, t.category, t.id].some((v) => v.toLocaleLowerCase(LOCALE).includes(q))) return false;
      return true;
    });
  }, [query, category, dateRange]);

  const clearFilters = () => {
    setQuery('');
    setCategory(ALL);
    setDateRange(ALL);
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

  return (
    <main className={styles.page} aria-labelledby="transactions-title">
      <div className={styles.header}>
        <div className={styles.titleBlock}>
          <h1 id="transactions-title" className={styles.title}>
            Transactions
          </h1>
          <p className={styles.description}>Your most recent account activity.</p>
        </div>
        <Button variant="outline" onPress={exportCsv} isDisabled={filtered.length === 0}>
          <IconDownload aria-hidden />
          Export CSV
        </Button>
      </div>

      <Card className={styles.card}>
        <DataTableToolbar className={styles.toolbar}>
          <SearchField
            aria-label="Search transactions"
            placeholder="Search by description or reference"
            value={query}
            onChange={setQuery}
            className={styles.search}
          />
          <Select aria-label="Category" selectedKey={category} onSelectionChange={(key) => setCategory(String(key))} className={styles.filter}>
            <SelectItem id={ALL}>All categories</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c} id={c}>
                {c}
              </SelectItem>
            ))}
          </Select>
          <Select
            aria-label="Date range"
            selectedKey={dateRange}
            onSelectionChange={(key) => setDateRange(String(key))}
            className={styles.filter}
          >
            {dateRanges.map((r) => (
              <SelectItem key={r.id} id={r.id}>
                {r.label}
              </SelectItem>
            ))}
          </Select>
        </DataTableToolbar>

        <CardContent variant="inset" className={styles.tableWell}>
          <DataTable
            aria-labelledby="transactions-title"
            columns={columns}
            rows={filtered}
            getRowId={(row) => row.id}
            stickyHeader={false}
            emptyState={
              <EmptyState
                size="sm"
                level={2}
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
    </main>
  );
}

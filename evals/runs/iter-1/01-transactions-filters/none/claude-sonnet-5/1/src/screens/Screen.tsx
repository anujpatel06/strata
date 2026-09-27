import { useMemo, useState } from 'react';
import styles from './Screen.module.css';

type Status = 'completed' | 'pending' | 'failed';

interface Transaction {
  id: string;
  date: string; // ISO yyyy-mm-dd
  description: string;
  category: string;
  status: Status;
  amount: number;
}

const TRANSACTIONS: Transaction[] = [
  { id: 'tx-1', date: '2026-09-26', description: 'Whole Foods Market', category: 'Groceries', status: 'completed', amount: -84.32 },
  { id: 'tx-2', date: '2026-09-25', description: 'Salary - Acme Corp', category: 'Income', status: 'completed', amount: 4200.0 },
  { id: 'tx-3', date: '2026-09-24', description: 'Netflix Subscription', category: 'Subscription', status: 'completed', amount: -15.99 },
  { id: 'tx-4', date: '2026-09-23', description: 'Transfer to Savings', category: 'Transfer', status: 'completed', amount: -500.0 },
  { id: 'tx-5', date: '2026-09-22', description: 'Electric Company', category: 'Utilities', status: 'pending', amount: -132.5 },
  { id: 'tx-6', date: '2026-09-21', description: 'Uber Trip', category: 'Travel', status: 'completed', amount: -23.4 },
  { id: 'tx-7', date: '2026-09-20', description: 'Amazon.com', category: 'Shopping', status: 'failed', amount: -67.89 },
  { id: 'tx-8', date: '2026-09-18', description: 'The Coffee House', category: 'Dining', status: 'completed', amount: -6.75 },
  { id: 'tx-9', date: '2026-09-17', description: 'Rent Payment', category: 'Housing', status: 'completed', amount: -1450.0 },
  { id: 'tx-10', date: '2026-09-15', description: 'ATM Withdrawal', category: 'Cash', status: 'completed', amount: -200.0 },
  { id: 'tx-11', date: '2026-09-12', description: 'Refund - Zara', category: 'Refund', status: 'completed', amount: 45.99 },
  { id: 'tx-12', date: '2026-09-10', description: 'Gym Membership', category: 'Subscription', status: 'pending', amount: -39.0 },
];

const CATEGORIES = Array.from(new Set(TRANSACTIONS.map((t) => t.category))).sort();

const STATUS_LABEL: Record<Status, string> = {
  completed: 'Completed',
  pending: 'Pending',
  failed: 'Failed',
};

const dateFormatter = new Intl.DateTimeFormat(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
const currencyFormatter = new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD', signDisplay: 'exceptZero' });

function formatDate(iso: string): string {
  const [year, month, day] = iso.split('-').map(Number);
  return dateFormatter.format(new Date(year, month - 1, day));
}

function toCsv(rows: Transaction[]): string {
  const header = ['Date', 'Description', 'Category', 'Status', 'Amount'];
  const escape = (value: string) => `"${value.replace(/"/g, '""')}"`;
  const lines = rows.map((t) =>
    [formatDate(t.date), escape(t.description), t.category, STATUS_LABEL[t.status], t.amount.toFixed(2)].join(','),
  );
  return [header.join(','), ...lines].join('\n');
}

export default function Screen() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return TRANSACTIONS.filter((t) => {
      if (term && !t.description.toLowerCase().includes(term)) return false;
      if (category !== 'all' && t.category !== category) return false;
      if (dateFrom && t.date < dateFrom) return false;
      if (dateTo && t.date > dateTo) return false;
      return true;
    });
  }, [search, category, dateFrom, dateTo]);

  const hasFilters = search.trim() !== '' || category !== 'all' || dateFrom !== '' || dateTo !== '';

  const handleClearFilters = () => {
    setSearch('');
    setCategory('all');
    setDateFrom('');
    setDateTo('');
  };

  const handleExport = () => {
    const csv = toCsv(filtered);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'transactions.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className={styles.screen}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Transactions</h1>
          <p className={styles.subtitle}>Your 12 most recent transactions</p>
        </div>
        <button type="button" className={styles.exportButton} onClick={handleExport} disabled={filtered.length === 0}>
          Export CSV
        </button>
      </header>

      <div className={styles.filters}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="tx-search">
            Search
          </label>
          <input
            id="tx-search"
            type="search"
            className={styles.input}
            placeholder="Search by description"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="tx-category">
            Category
          </label>
          <select id="tx-category" className={styles.input} value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="all">All categories</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="tx-date-from">
            From
          </label>
          <input
            id="tx-date-from"
            type="date"
            className={styles.input}
            value={dateFrom}
            max={dateTo || undefined}
            onChange={(e) => setDateFrom(e.target.value)}
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="tx-date-to">
            To
          </label>
          <input
            id="tx-date-to"
            type="date"
            className={styles.input}
            value={dateTo}
            min={dateFrom || undefined}
            onChange={(e) => setDateTo(e.target.value)}
          />
        </div>
      </div>

      <div className={styles.tableCard}>
        {filtered.length > 0 ? (
          <table className={styles.table}>
            <thead>
              <tr>
                <th scope="col">Date</th>
                <th scope="col">Description</th>
                <th scope="col">Category</th>
                <th scope="col">Status</th>
                <th scope="col" className={styles.amountHeader}>
                  Amount
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t) => (
                <tr key={t.id}>
                  <td>{formatDate(t.date)}</td>
                  <td>{t.description}</td>
                  <td>{t.category}</td>
                  <td>
                    <span className={`${styles.badge} ${styles[`badge-${t.status}`]}`}>{STATUS_LABEL[t.status]}</span>
                  </td>
                  <td className={`${styles.amount} ${t.amount >= 0 ? styles.amountPositive : ''}`}>
                    {currencyFormatter.format(t.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className={styles.emptyState}>
            <p className={styles.emptyTitle}>No transactions match your filters</p>
            <p className={styles.emptyText}>Try adjusting the search, category or date range.</p>
            {hasFilters && (
              <button type="button" className={styles.clearButton} onClick={handleClearFilters}>
                Clear filters
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

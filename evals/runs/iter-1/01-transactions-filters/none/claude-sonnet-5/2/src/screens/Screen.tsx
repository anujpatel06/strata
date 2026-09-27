import { useMemo, useState } from 'react';
import styles from './Screen.module.css';

type TransactionStatus = 'completed' | 'pending' | 'failed';

interface Transaction {
  id: string;
  date: string; // ISO date, YYYY-MM-DD
  description: string;
  category: string;
  status: TransactionStatus;
  amount: number;
}

const TRANSACTIONS: Transaction[] = [
  { id: 'txn-1', date: '2026-09-27', description: 'Whole Foods Market', category: 'Groceries', status: 'completed', amount: -84.32 },
  { id: 'txn-2', date: '2026-09-26', description: 'Payroll Deposit - Acme Corp', category: 'Income', status: 'completed', amount: 3200 },
  { id: 'txn-3', date: '2026-09-25', description: 'Netflix Subscription', category: 'Entertainment', status: 'completed', amount: -15.99 },
  { id: 'txn-4', date: '2026-09-24', description: 'Transfer to Savings', category: 'Transfer', status: 'completed', amount: -500 },
  { id: 'txn-5', date: '2026-09-22', description: 'Uber Trip', category: 'Transportation', status: 'pending', amount: -23.5 },
  { id: 'txn-6', date: '2026-09-20', description: 'Electric Company', category: 'Utilities', status: 'completed', amount: -112.47 },
  { id: 'txn-7', date: '2026-09-18', description: 'Amazon.com', category: 'Shopping', status: 'failed', amount: -67.89 },
  { id: 'txn-8', date: '2026-09-15', description: 'Starbucks', category: 'Dining', status: 'completed', amount: -6.75 },
  { id: 'txn-9', date: '2026-09-12', description: 'Gym Membership', category: 'Health & Fitness', status: 'pending', amount: -45 },
  { id: 'txn-10', date: '2026-09-10', description: 'ATM Withdrawal', category: 'Cash', status: 'completed', amount: -200 },
  { id: 'txn-11', date: '2026-09-05', description: 'Refund - Zara', category: 'Shopping', status: 'completed', amount: 34.99 },
  { id: 'txn-12', date: '2026-09-01', description: 'Rent Payment', category: 'Housing', status: 'completed', amount: -1450 },
];

const CATEGORIES = Array.from(new Set(TRANSACTIONS.map((t) => t.category))).sort();

const STATUS_META: Record<TransactionStatus, { label: string; className: string }> = {
  completed: { label: 'Completed', className: styles.badgeCompleted },
  pending: { label: 'Pending', className: styles.badgePending },
  failed: { label: 'Failed', className: styles.badgeFailed },
};

const dateFormatter = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
const amountFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
});

function formatDate(iso: string): string {
  const [year, month, day] = iso.split('-').map(Number);
  return dateFormatter.format(new Date(year, month - 1, day));
}

function formatAmount(amount: number): string {
  const formatted = amountFormatter.format(Math.abs(amount));
  return amount > 0 ? `+${formatted}` : `-${formatted}`;
}

function toCsvRow(fields: Array<string | number>): string {
  return fields
    .map((field) => {
      const value = String(field);
      return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
    })
    .join(',');
}

function downloadCsv(transactions: Transaction[]): void {
  const header = toCsvRow(['Date', 'Description', 'Category', 'Status', 'Amount']);
  const rows = transactions.map((t) =>
    toCsvRow([t.date, t.description, t.category, STATUS_META[t.status].label, t.amount.toFixed(2)]),
  );
  const csv = [header, ...rows].join('\n');
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
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const hasActiveFilters = search.trim() !== '' || category !== 'all' || dateFrom !== '' || dateTo !== '';

  const filteredTransactions = useMemo(() => {
    const query = search.trim().toLowerCase();
    return TRANSACTIONS.filter((t) => {
      if (query && !t.description.toLowerCase().includes(query) && !t.category.toLowerCase().includes(query)) {
        return false;
      }
      if (category !== 'all' && t.category !== category) {
        return false;
      }
      if (dateFrom && t.date < dateFrom) {
        return false;
      }
      if (dateTo && t.date > dateTo) {
        return false;
      }
      return true;
    });
  }, [search, category, dateFrom, dateTo]);

  function clearFilters() {
    setSearch('');
    setCategory('all');
    setDateFrom('');
    setDateTo('');
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Transactions</h1>
          <p className={styles.subtitle}>A record of your most recent account activity.</p>
        </div>
        <button
          type="button"
          className={styles.exportButton}
          onClick={() => downloadCsv(filteredTransactions)}
          disabled={filteredTransactions.length === 0}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path
              d="M8 1.5v8.5m0 0 3-3m-3 3-3-3M2.5 12.5v1a1 1 0 0 0 1 1h9a1 1 0 0 0 1-1v-1"
              stroke="currentColor"
              strokeWidth="1.3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Export CSV
        </button>
      </div>

      <div className={styles.toolbar}>
        <div className={styles.searchField}>
          <svg className={styles.searchIcon} width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.3" />
            <path d="m14 14-3-3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
          </svg>
          <label htmlFor="txn-search" className={styles.visuallyHidden}>
            Search transactions
          </label>
          <input
            id="txn-search"
            type="text"
            className={styles.searchInput}
            placeholder="Search by description or category"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className={styles.filterField}>
          <label htmlFor="txn-category" className={styles.visuallyHidden}>
            Filter by category
          </label>
          <select
            id="txn-category"
            className={styles.select}
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="all">All categories</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.dateRange}>
          <label htmlFor="txn-date-from" className={styles.visuallyHidden}>
            From date
          </label>
          <input
            id="txn-date-from"
            type="date"
            className={styles.dateInput}
            value={dateFrom}
            max={dateTo || undefined}
            onChange={(e) => setDateFrom(e.target.value)}
          />
          <span className={styles.dateRangeSeparator} aria-hidden="true">
            &ndash;
          </span>
          <label htmlFor="txn-date-to" className={styles.visuallyHidden}>
            To date
          </label>
          <input
            id="txn-date-to"
            type="date"
            className={styles.dateInput}
            value={dateTo}
            min={dateFrom || undefined}
            onChange={(e) => setDateTo(e.target.value)}
          />
        </div>

        {hasActiveFilters && (
          <button type="button" className={styles.clearLink} onClick={clearFilters}>
            Clear filters
          </button>
        )}
      </div>

      {filteredTransactions.length === 0 ? (
        <div className={styles.emptyState}>
          <svg
            className={styles.emptyStateIcon}
            width="48"
            height="48"
            viewBox="0 0 48 48"
            fill="none"
            aria-hidden="true"
          >
            <rect x="7" y="12" width="34" height="26" rx="3" stroke="currentColor" strokeWidth="1.6" />
            <path d="M7 19h34" stroke="currentColor" strokeWidth="1.6" />
            <path d="m18 30 5 5 9-10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" opacity="0.4" />
          </svg>
          <p className={styles.emptyStateTitle}>No transactions found</p>
          <p className={styles.emptyStateText}>Try adjusting your search or filters to find what you&rsquo;re looking for.</p>
          {hasActiveFilters && (
            <button type="button" className={styles.emptyStateButton} onClick={clearFilters}>
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <div className={styles.tableWrapper}>
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
              {filteredTransactions.map((t) => {
                const meta = STATUS_META[t.status];
                return (
                  <tr key={t.id}>
                    <td className={styles.dateCell}>{formatDate(t.date)}</td>
                    <td>{t.description}</td>
                    <td className={styles.categoryCell}>{t.category}</td>
                    <td>
                      <span className={`${styles.badge} ${meta.className}`}>{meta.label}</span>
                    </td>
                    <td className={`${styles.amountCell} ${t.amount > 0 ? styles.amountPositive : ''}`}>
                      {formatAmount(t.amount)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

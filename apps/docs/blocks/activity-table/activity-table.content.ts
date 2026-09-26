/**
 * Content for the activity-table block: every label and row. Replace this object to translate or rebrand it.
 * Amounts are signed numbers in `currency`, dates are ISO; both are formatted with Intl in `locale`. Counts use
 * plural forms chosen by Intl.PluralRules, so languages with more than two forms (Arabic has six) read naturally.
 */

/** Plural forms keyed by Intl.PluralRules category; `{count}` is replaced with the formatted number. */
export type ActivityPlural = { other: string } & Partial<Record<'zero' | 'one' | 'two' | 'few' | 'many', string>>;

export type ActivityTone = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

export interface ActivityRow {
  /** Unique row id, e.g. a transaction reference. */
  id: string;
  /** ISO date. */
  date: string;
  title: string;
  /** Secondary line under the title. */
  meta: string;
  category: string;
  /** Key into `statuses`. */
  status: string;
  /** Signed amount in `currency`. Negative = money out. */
  amount: number;
}

export interface ActivityTableContent {
  /** BCP 47 locale for numbers and dates. */
  locale: string;
  /** ISO 4217 currency code. */
  currency: string;
  product: { name: string };
  activity: {
    title: string;
    description: string;
    export: string;
    /** Toast after exporting. */
    exported: ActivityPlural;
    refresh: string;
    search: { label: string; placeholder: string };
    status: { label: string; all: string };
    density: { label: string; comfortable: string; compact: string };
    /** Menu of actions on the selected rows; each has its own confirmation toast. */
    bulk: { label: string; items: { id: string; label: string; done: ActivityPlural }[] };
    /** "3 selected". */
    selected: ActivityPlural;
    columns: { date: string; description: string; category: string; status: string; amount: string };
    statuses: Record<string, { label: string; tone: ActivityTone }>;
    rows: ActivityRow[];
    empty: { title: string; description: string; clear: string };
    pagination: {
      label: string;
      previous: string;
      next: string;
      page: string;
      of: string;
      /** `{start}`, `{end}` and `{total}` are replaced with formatted numbers. */
      summary: string;
      none: string;
    };
    /** Read by screen readers on skeleton rows. */
    loading: string;
  };
}

export const activityTableContent: ActivityTableContent = {
  locale: 'en-US',
  currency: 'USD',
  product: { name: 'Acme' },
  activity: {
    title: 'Transactions',
    description: 'Every payment in and out of your account.',
    export: 'Export CSV',
    exported: { one: 'Exported {count} transaction', other: 'Exported {count} transactions' },
    refresh: 'Refresh',
    search: { label: 'Search transactions', placeholder: 'Search by name, reference or category' },
    status: { label: 'Status', all: 'All statuses' },
    density: { label: 'Row density', comfortable: 'Comfortable', compact: 'Compact' },
    bulk: {
      label: 'Bulk actions',
      items: [
        { id: 'review', label: 'Mark as reviewed', done: { one: '{count} transaction marked as reviewed', other: '{count} transactions marked as reviewed' } },
        { id: 'report', label: 'Add to expense report', done: { one: 'Added {count} transaction to your expense report', other: 'Added {count} transactions to your expense report' } },
      ],
    },
    selected: { one: '{count} selected', other: '{count} selected' },
    columns: { date: 'Date', description: 'Description', category: 'Category', status: 'Status', amount: 'Amount' },
    statuses: {
      completed: { label: 'Completed', tone: 'success' },
      pending: { label: 'Pending', tone: 'warning' },
      processing: { label: 'Processing', tone: 'info' },
      declined: { label: 'Declined', tone: 'danger' },
    },
    rows: [
      { id: 'TXN-4418', date: '2026-09-28', title: 'Brightwave Internet', meta: 'Autopay · October plan', category: 'Bills', status: 'pending', amount: -64.99 },
      { id: 'TXN-4403', date: '2026-09-26', title: 'Metro card reload', meta: 'Transit · Card •• 4821', category: 'Transport', status: 'completed', amount: -40 },
      { id: 'TXN-4397', date: '2026-09-25', title: 'Corner Roastery', meta: 'Card •• 4821', category: 'Food & drink', status: 'completed', amount: -6.4 },
      { id: 'TXN-4385', date: '2026-09-24', title: 'Transfer to Sam Ortiz', meta: 'Dinner split', category: 'Transfers', status: 'completed', amount: -38 },
      { id: 'TXN-4379', date: '2026-09-23', title: 'Refund from Loomcraft Home', meta: 'Order LC-88213', category: 'Shopping', status: 'processing', amount: 89.99 },
      { id: 'TXN-4366', date: '2026-09-22', title: 'Green Basket Market', meta: 'Card •• 4821', category: 'Groceries', status: 'completed', amount: -112.36 },
      { id: 'TXN-4352', date: '2026-09-21', title: 'Brightcart Electronics', meta: 'Order BC-40317', category: 'Shopping', status: 'completed', amount: -349.99 },
      { id: 'TXN-4340', date: '2026-09-19', title: 'Lakeside Pharmacy', meta: 'Card •• 4821', category: 'Health', status: 'completed', amount: -23.15 },
      { id: 'TXN-4331', date: '2026-09-17', title: 'Skyfare Travel', meta: 'Online card limit reached', category: 'Travel', status: 'declined', amount: -642 },
      { id: 'TXN-4318', date: '2026-09-15', title: 'Vacation fund', meta: 'Moved to savings goal', category: 'Savings', status: 'completed', amount: -285 },
      { id: 'TXN-4306', date: '2026-09-12', title: 'City Power & Light', meta: 'Autopay · Account 7730', category: 'Bills', status: 'completed', amount: -96.2 },
      { id: 'TXN-4291', date: '2026-09-10', title: 'Interest earned', meta: 'Savings · August', category: 'Income', status: 'completed', amount: 11.64 },
      { id: 'TXN-4277', date: '2026-09-05', title: 'Maple Court Apartments', meta: 'Rent · Unit 3B', category: 'Housing', status: 'completed', amount: -1850 },
      { id: 'TXN-4260', date: '2026-09-01', title: 'Payroll deposit', meta: 'Brightloom Labs · Direct deposit', category: 'Income', status: 'completed', amount: 4180 },
    ],
    empty: {
      title: 'No matching transactions',
      description: 'Try a different search or clear the filters to see everything.',
      clear: 'Clear filters',
    },
    pagination: {
      label: 'Transaction pages',
      previous: 'Previous',
      next: 'Next',
      page: 'Page',
      of: 'of',
      summary: 'Showing {start}–{end} of {total}',
      none: 'No results',
    },
    loading: 'Loading transactions',
  },
};

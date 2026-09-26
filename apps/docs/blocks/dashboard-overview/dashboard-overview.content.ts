/**
 * Content for the dashboard-overview block: every string and number it shows. Replace this object to translate
 * or rebrand the block; the component never hard-codes copy. Numbers and dates are raw values, formatted with
 * Intl in `locale` (and `currency`) at render time.
 */

export type DashboardTone = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

export interface DashboardStat {
  label: string;
  /** Raw number, formatted with Intl in the content locale. */
  value: number;
  format: 'currency' | 'number' | 'percent';
  /** Fractional change: 0.064 = +6.4%. Omit to show `deltaLabel` as a caption instead. */
  delta?: number;
  deltaLabel?: string;
  /** Whether an increase is good news (a balance) or bad news (spending). Default true. */
  positiveIsGood?: boolean;
}

export interface DashboardActivityRow {
  /** ISO date, e.g. "2026-09-24". */
  date: string;
  title: string;
  /** Secondary line under the title: a merchant, reference or channel. */
  meta: string;
  category: string;
  /** Key into `overview.statusLabels`. */
  status: string;
  /** Signed amount in `currency`. Negative = money out. */
  amount: number;
}

export interface DashboardFormField {
  type: 'text' | 'select';
  id: string;
  label: string;
  hint?: string;
  placeholder?: string;
  /** Options of a `select` field. */
  options?: string[];
  /** Prefilled text, or the selected option. */
  value?: string;
  inputMode?: 'text' | 'numeric' | 'decimal';
  /** Shows the currency symbol (from `currency` + `locale`) inside a text field. */
  currencyAffix?: boolean;
}

export interface DashboardNotification {
  id: string;
  title: string;
  description: string;
  /** How long ago, formatted with Intl.RelativeTimeFormat. */
  ago: { value: number; unit: 'minute' | 'hour' | 'day' | 'week' };
}

export interface DashboardOverviewContent {
  /** BCP 47 locale for numbers and dates, e.g. "en-US" or "ar-AE-u-nu-latn". */
  locale: string;
  /** ISO 4217 currency code, e.g. "USD". */
  currency: string;
  product: { name: string };
  /** Main navigation. The first item is the current page. */
  nav: string[];
  /** `initials` overrides the ones the Avatar derives from `name` (useful for names with articles, e.g. "Al-"). */
  user: { name: string; initials?: string };
  /** Accessible names for icon buttons and landmarks. */
  a11y: { search: string; notifications: string; account: string; mainNav: string };
  overview: {
    greeting: string;
    subtitle: string;
    primaryAction: string;
    secondaryAction: string;
    alert: { tone: DashboardTone; title: string; body: string; action: string };
    stats: DashboardStat[];
    table: {
      title: string;
      action: string;
      columns: { date: string; description: string; category: string; status: string; amount: string };
      rows: DashboardActivityRow[];
    };
    statusLabels: Record<string, { label: string; tone: DashboardTone }>;
    form: { title: string; description: string; fields: DashboardFormField[]; submit: string };
    /** `value` is a fraction 0–1 (0.62 = 62%). */
    progress: { title: string; value: number; label: string; caption: string };
  };
  dashboard: {
    /** Draws a sparkline in one stat tile: `stat` is its index in `overview.stats`, `values` oldest first. */
    sparkline?: { stat: number; values: number[] };
    command: {
      placeholder: string;
      /** Shown when nothing matches; `{query}` is replaced with the search text. */
      empty: string;
      pages: string;
      actions: string;
      recent: string;
      hints: { navigate: string; select: string; close: string };
    };
    notifications: { title: string; markAllRead: string; items: DashboardNotification[] };
    account: { profile: string; settings: string; help: string; signOut: string };
    /** Toast shown when the quick-action form is submitted. */
    formSubmitted: { title: string; description: string };
  };
}

export const dashboardOverviewContent: DashboardOverviewContent = {
  locale: 'en-US',
  currency: 'USD',
  product: { name: 'Acme' },
  nav: ['Overview', 'Payments', 'Cards', 'Savings', 'Insights'],
  user: { name: 'Jordan Lee' },
  a11y: {
    search: 'Search transactions',
    notifications: 'Notifications, 2 unread',
    account: 'Account menu for Jordan Lee',
    mainNav: 'Main',
  },
  overview: {
    greeting: 'Good morning, Jordan',
    subtitle: 'Here’s how your money is moving this September.',
    primaryAction: 'Send money',
    secondaryAction: 'Download statement',
    alert: {
      tone: 'warning',
      title: 'Your debit card ending 4821 expires on September 30',
      body: 'Your replacement card is on its way. Activate it when it arrives so automatic payments keep working.',
      action: 'Track card',
    },
    stats: [
      { label: 'Available balance', value: 12840.5, format: 'currency', delta: 0.064, deltaLabel: 'vs last month', positiveIsGood: true },
      { label: 'Spent this month', value: 3215.8, format: 'currency', delta: 0.112, deltaLabel: 'vs August', positiveIsGood: false },
      { label: 'Savings goals', value: 8600, format: 'currency', delta: 0.085, deltaLabel: 'vs last month', positiveIsGood: true },
    ],
    table: {
      title: 'Recent activity',
      action: 'View all',
      columns: { date: 'Date', description: 'Description', category: 'Category', status: 'Status', amount: 'Amount' },
      rows: [
        { date: '2026-09-28', title: 'Brightwave Internet', meta: 'Autopay · October plan', category: 'Bills', status: 'scheduled', amount: -64.99 },
        { date: '2026-09-25', title: 'Corner Roastery', meta: 'Card •• 4821', category: 'Food & drink', status: 'completed', amount: -6.4 },
        { date: '2026-09-24', title: 'Transfer to Sam Ortiz', meta: 'Dinner split', category: 'Transfers', status: 'completed', amount: -38 },
        { date: '2026-09-23', title: 'Refund from Loomcraft Home', meta: 'Order LC-88213', category: 'Shopping', status: 'processing', amount: 89.99 },
        { date: '2026-09-22', title: 'Green Basket Market', meta: 'Card •• 4821', category: 'Groceries', status: 'completed', amount: -112.36 },
        { date: '2026-09-17', title: 'Skyfare Travel', meta: 'Online card limit reached', category: 'Travel', status: 'declined', amount: -642 },
        { date: '2026-09-01', title: 'Payroll deposit', meta: 'Brightloom Labs · Direct deposit', category: 'Income', status: 'completed', amount: 4180 },
      ],
    },
    statusLabels: {
      completed: { label: 'Completed', tone: 'success' },
      scheduled: { label: 'Scheduled', tone: 'warning' },
      processing: { label: 'Processing', tone: 'info' },
      declined: { label: 'Declined', tone: 'danger' },
    },
    form: {
      title: 'Quick transfer',
      description: 'Send money to a saved contact instantly.',
      fields: [
        {
          type: 'select',
          id: 'recipient',
          label: 'Recipient',
          placeholder: 'Choose a contact',
          options: ['Sam Ortiz · Checking •• 2231', 'Riley Chen · Checking •• 9014', 'Maple Court Apartments · Rent'],
          value: 'Sam Ortiz · Checking •• 2231',
        },
        {
          type: 'text',
          id: 'amount',
          label: 'Amount',
          placeholder: '0.00',
          value: '250',
          inputMode: 'decimal',
          currencyAffix: true,
          hint: 'You can send up to $5,000 a day.',
        },
      ],
      submit: 'Review transfer',
    },
    progress: {
      title: 'Vacation fund',
      value: 0.62,
      label: '$1,860 of $3,000',
      caption: 'Put aside $285 a month to reach your goal by January 2027.',
    },
  },
  dashboard: {
    sparkline: { stat: 0, values: [10420, 10980, 10310, 11260, 11790, 11520, 12070, 12840.5] },
    command: {
      placeholder: 'Search pages, actions and activity…',
      empty: 'No results for “{query}”',
      pages: 'Pages',
      actions: 'Actions',
      recent: 'Recent activity',
      hints: { navigate: 'to navigate', select: 'to select', close: 'to close' },
    },
    notifications: {
      title: 'Notifications',
      markAllRead: 'Mark all as read',
      items: [
        { id: 'refund', title: 'Refund on its way', description: 'Loomcraft Home sent $89.99 back to your card.', ago: { value: 2, unit: 'hour' } },
        { id: 'card', title: 'Card ending 4821 expires soon', description: 'Your replacement card was mailed on September 22.', ago: { value: 1, unit: 'day' } },
      ],
    },
    account: { profile: 'Your profile', settings: 'Settings', help: 'Help center', signOut: 'Sign out' },
    formSubmitted: { title: 'Transfer ready to review', description: 'Check the details, then confirm to send.' },
  },
};

/**
 * Mock content for the showcase bento. One small business-money product, told as specific moments (a revenue
 * week, a card limit, a payout waiting on approval), so the grid reads as a designed product rather than a
 * component catalogue. The grid renders in every tenant's theme (a neobank, an insurer, a grocer, a health
 * benefits app, the site), so the copy stays about money any of them moves, and every name is invented.
 *
 * Figures are illustrative product data, not claims about Syntara: nothing here is measured or reported.
 * Money is USD and formatted in en-US whatever the locale, because the copy is English (see showcase-grid.tsx).
 */

/** Numbers and money in the cards are formatted in this locale; direction and dates still follow the scope. */
export const COPY_LOCALE = 'en-US';
export const CURRENCY = 'USD';

export const money = (value: number, digits = 0) =>
  new Intl.NumberFormat(COPY_LOCALE, {
    style: 'currency',
    currency: CURRENCY,
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value);

/* ---- Revenue: one chart, three periods -------------------------------------------------------------- */

export type Period = '7d' | '4w' | '12m';

export interface RevenuePeriod {
  label: string;
  /** What the delta compares against. */
  versus: string;
  /** Axis name for the chart's data table. */
  xLabel: string;
  total: number;
  delta: number;
  points: Array<{ x: string; current: number; previous: number }>;
}

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MONTHS = ['Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'];

const series = (xs: string[], current: number[], previous: number[]) =>
  xs.map((x, i) => ({ x, current: current[i] ?? 0, previous: previous[i] ?? 0 }));
const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);

const WEEK = [4820, 5310, 4960, 6240, 7180, 5590, 6030];
const WEEK_BEFORE = [4410, 4730, 5020, 5150, 5880, 4960, 5210];
const MONTH = [
  4210, 4480, 4390, 4720, 4960, 5210, 4870, 5030, 5390, 5620, 5480, 5810, 6040, 5720, 5960, 6210, 6480, 6130, 6390,
  6670, 6420, 6810, 7040, 6720, 7110, 7380, 7020, 7290, 7560, 7820,
];
const MONTH_BEFORE = [
  3920, 4050, 4110, 4020, 4290, 4380, 4210, 4460, 4520, 4390, 4610, 4730, 4680, 4820, 4910, 4760, 4990, 5120, 5040,
  5210, 5170, 5330, 5290, 5460, 5510, 5380, 5620, 5690, 5580, 5740,
];
const YEAR = [118400, 124900, 139200, 121800, 128300, 142600, 138100, 151400, 149200, 163800, 171200, 184600];
const YEAR_BEFORE = [96200, 101400, 117800, 99300, 104100, 112600, 115900, 121300, 124800, 129400, 133100, 140200];

const pct = (a: number[], b: number[]) => Math.round((sum(a) / sum(b) - 1) * 1000) / 1000;

export const REVENUE: Record<Period, RevenuePeriod> = {
  '7d': {
    label: '7D',
    versus: 'vs last week',
    xLabel: 'Day',
    total: sum(WEEK),
    delta: pct(WEEK, WEEK_BEFORE),
    points: series(DAYS, WEEK, WEEK_BEFORE),
  },
  '4w': {
    label: '4W',
    versus: 'vs the 4 weeks before',
    xLabel: 'Date',
    total: sum(MONTH.slice(2)),
    delta: pct(MONTH.slice(2), MONTH_BEFORE.slice(2)),
    // Four weeks (Sep 3 to 30): 28 points, so the chart's thinned date labels land evenly on its first and last day.
    points: series(
      MONTH.slice(2).map((_, i) => `Sep ${i + 3}`),
      MONTH.slice(2),
      MONTH_BEFORE.slice(2),
    ),
  },
  '12m': {
    label: '12M',
    versus: 'vs the year before',
    xLabel: 'Month',
    total: sum(YEAR),
    delta: pct(YEAR, YEAR_BEFORE),
    points: series(MONTHS, YEAR, YEAR_BEFORE),
  },
};

/** The three figures under the revenue chart. */
export const REVENUE_SPLIT = [
  { label: 'Card payments', value: 28460, delta: 0.084, spark: [18, 21, 19, 24, 23, 27, 29] },
  { label: 'Bank transfers', value: 9870, delta: 0.031, spark: [9, 8, 10, 9, 11, 10, 11] },
  { label: 'Refunds', value: 1240, delta: -0.12, positiveIsGood: false, spark: [6, 7, 5, 6, 4, 5, 4] },
] as const;

/* ---- Accounts ------------------------------------------------------------------------------------------ */

export type AccountIcon = 'bank' | 'wallet' | 'piggy' | 'coins' | 'card';

export interface Account {
  id: string;
  name: string;
  detail: string;
  icon: AccountIcon;
  balance: number;
  change: number;
  trend: number[];
}

export const ACCOUNTS: readonly Account[] = [
  { id: 'ops', name: 'Operating', detail: 'Checking ·· 4821', icon: 'bank', balance: 84250.4, change: 0.052, trend: [61, 64, 62, 69, 71, 70, 76, 81, 84] },
  { id: 'tax', name: 'Tax reserve', detail: 'Savings ·· 3306', icon: 'piggy', balance: 32600, change: -0.061, trend: [36, 36, 37, 37, 38, 38, 35, 34, 33] },
  { id: 'reserve', name: 'Reserve fund', detail: 'Treasury · 4.1% yield', icon: 'coins', balance: 124800, change: 0.034, trend: [118, 119, 119, 120, 121, 121, 122, 123, 125] },
  { id: 'settling', name: 'Card sales', detail: 'Settling · lands Oct 1', icon: 'card', balance: 6840, change: 0.126, trend: [3, 4, 4, 5, 4, 5, 6, 6, 7] },
  { id: 'payroll', name: 'Payroll', detail: 'Checking ·· 7730', icon: 'wallet', balance: 41200, change: 0.021, trend: [38, 39, 38, 40, 39, 40, 41, 40, 41] },
];

/* ---- People --------------------------------------------------------------------------------------------- */

export const APPROVERS = ['Maya Lindqvist', 'Tomás Reyes', 'Ines Adeyemi'] as const;
export const PAYEES = [
  { id: 'lumen', name: 'Lumen Print Co.', detail: 'Supplier · ACH' },
  { id: 'orbit', name: 'Orbit Freight', detail: 'Supplier · Wire' },
  { id: 'kaito', name: 'Kaito Mori', detail: 'Contractor · ACH' },
] as const;

/* ---- Activity ------------------------------------------------------------------------------------------- */

export type ActivityStatus = 'done' | 'waiting' | 'failed' | 'scheduled';

export interface ActivityItem {
  id: string;
  title: string;
  meta: string;
  amount: number;
  status: ActivityStatus;
}

export const ACTIVITY: readonly ActivityItem[] = [
  { id: 'a1', title: 'Payout to Lumen Print Co.', meta: 'Today, 09:42', amount: -4800, status: 'waiting' },
  { id: 'a2', title: 'Invoice #1042 paid', meta: 'Today, 08:15', amount: 12650, status: 'done' },
  { id: 'a3', title: 'Card charge at Northline Air', meta: 'Yesterday', amount: -612.4, status: 'failed' },
  { id: 'a4', title: 'Payroll, 14 people', meta: 'Fri, Oct 2', amount: -38420, status: 'scheduled' },
];

export const ACTIVITY_STATUS = {
  done: { label: 'Completed', tone: 'success' },
  waiting: { label: 'Needs approval', tone: 'warning' },
  failed: { label: 'Declined', tone: 'danger' },
  scheduled: { label: 'Scheduled', tone: 'info' },
} as const satisfies Record<ActivityStatus, { label: string; tone: 'success' | 'warning' | 'danger' | 'info' }>;

/* ---- Calendar ------------------------------------------------------------------------------------------- */

/** Fixed dates (CLAUDE.md gotcha): a statically built page hydrates the same on any day. */
export const SCHEDULE = [
  { date: '2026-10-01', title: 'Office rent', amount: -6200 },
  { date: '2026-10-02', title: 'Payroll', amount: -38420 },
  { date: '2026-10-15', title: 'Quarterly tax', amount: -9150 },
] as const;

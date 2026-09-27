/**
 * Content for the portfolio block: a wealth dashboard. Replace this object to translate or rebrand it; the component
 * never hard-codes copy, numbers or dates.
 *
 * Nothing that can be derived is typed in:
 * - a holding's price is the last of its daily closes, its value is units × price, its 7-day change is last ÷ first;
 * - net worth is the holdings plus cash; each asset class is the sum of its holdings;
 * - the hero chart's history is a shape relative to today (the last point is 1), multiplied by net worth, except 7D,
 *   which is summed from the holdings' daily closes, so the chart and the table can't disagree;
 * - "total return" is market value minus cost; "invested this month" is the last contribution.
 *
 * Placeholders: `{name}`, `{change}`, `{percent}`, `{month}`, `{units}`.
 *
 * `portfolioTenantCopy` is sample copy for the docs' reference tenants, so every tenant shows the block in its own
 * voice, language and currency. It's data, like content.json; the component never reads tenant ids. Asset names and
 * tickers are invented: no real funds, exchanges or coins.
 */

export type PortfolioIcon = 'world' | 'cpu' | 'leaf' | 'bank' | 'coins' | 'chart' | 'wallet' | 'home';

/** Icon tile fill. Each is a contrast-checked pair (see IconTile). */
export type PortfolioTint = 'brand' | 'accent' | 'info' | 'success' | 'warning';

export type PortfolioPeriod = '24h' | '7d' | '1m' | '1y';

export type PortfolioActivityKind = 'buy' | 'sell' | 'dividend' | 'deposit' | 'withdrawal';

export interface PortfolioClass {
  /** Holdings point at it; `cash` is the one class without holdings (it's `cash` below). */
  id: string;
  label: string;
  icon: PortfolioIcon;
  tint: PortfolioTint;
}

export interface PortfolioHolding {
  id: string;
  name: string;
  /** Invented. */
  ticker: string;
  class: string;
  icon: PortfolioIcon;
  tint: PortfolioTint;
  units: number;
  /** Average cost per unit. */
  cost: number;
  /** Daily closes, oldest first; the last is today's price. Eight points = seven days of change. */
  prices: number[];
}

export interface PortfolioActivity {
  id: string;
  kind: PortfolioActivityKind;
  /** What it was: an asset, an account. */
  title: string;
  /** Always positive; the kind says which way the money moved. */
  amount: number;
  /** ISO date-time (UTC). */
  at: string;
}

export interface PortfolioLabels {
  /** Sidebar subtitle under the product name. */
  subtitle: string;
  nav: {
    label: string;
    open: string;
    overview: string;
    dashboard: string;
    holdings: string;
    markets: string;
    marketsBadge: string;
    money: string;
    transfers: string;
    statements: string;
    goals: string;
    account: string;
    alerts: string;
    settings: string;
    personal: string;
  };
  /** `{name}` is the first name. */
  greeting: string;
  /** `{change}` is the signed 1-month change in money. */
  intro: string;
  search: { label: string; placeholder: string };
  notifications: string;
  kpi: {
    netWorth: string;
    netWorthDelta: string;
    today: string;
    todayDelta: string;
    returns: string;
    returnsDelta: string;
    invested: string;
    /** `{month}` is the previous month's name. */
    investedDelta: string;
  };
  chart: {
    title: string;
    period: string;
    periods: Record<PortfolioPeriod, string>;
    /** After the delta chip: "in 24 hours". */
    versus: Record<PortfolioPeriod, string>;
    series: string;
    /** The data table's first column. */
    x: Record<PortfolioPeriod, string>;
  };
  allocation: {
    title: string;
    /** `{percent}` of the whole. */
    share: string;
  };
  contributions: {
    title: string;
    /** `{month}` is the latest month. */
    caption: string;
    series: string;
    x: string;
  };
  promo: {
    eyebrow: string;
    title: string;
    body: string;
    cash: string;
    /** Label of the next scheduled investment. */
    next: string;
    deposit: string;
    withdraw: string;
  };
  activity: {
    title: string;
    viewAll: string;
    kinds: Record<PortfolioActivityKind, string>;
  };
  holdings: {
    title: string;
    asset: string;
    price: string;
    change: string;
    trend: string;
    holding: string;
    value: string;
    allocation: string;
    /** `{units}` formatted. */
    units: string;
    /** Names the row's sparkline: `{name}`, `{change}`. */
    trendLabel: string;
  };
}

export interface PortfolioData {
  /** "Now": ISO date-time (UTC). Chart x labels count back from it. */
  asOf: string;
  cash: number;
  /** Relative to today's net worth; the last point is 1. 7D comes from the holdings instead. */
  history: Record<Exclude<PortfolioPeriod, '7d'>, number[]>;
  /** Oldest first. `month` is YYYY-MM. */
  contributions: { month: string; amount: number }[];
  classes: PortfolioClass[];
  holdings: PortfolioHolding[];
  activity: PortfolioActivity[];
  labels: PortfolioLabels;
}

export interface PortfolioContent {
  /** BCP 47 locale for numbers and dates. */
  locale: string;
  /** ISO 4217. */
  currency: string;
  product?: { name: string; industry?: string };
  user?: { name: string; initials?: string };
  portfolio: PortfolioData;
}

/* ------------------------------------------------------------------------------------------------ shared data */

const AS_OF = '2026-10-27T16:30:00Z';

/** Shapes relative to today (last = 1). Shared by every tenant; only the money scale differs. */
const HISTORY: PortfolioData['history'] = {
  '24h': [0.994, 0.996, 0.9955, 0.9938, 0.9934, 0.9941, 0.9943, 0.9938, 0.9946, 0.9975, 1.0004, 1.001, 1],
  '1m': [
    0.962, 0.964, 0.9644, 0.9663, 0.967, 0.9644, 0.9624, 0.9654, 0.9703, 0.9709, 0.9672, 0.9638, 0.9617, 0.9575,
    0.9514, 0.9495, 0.9545, 0.9617, 0.9661, 0.9693, 0.9745, 0.9792, 0.9796, 0.9779, 0.9803, 0.9873, 0.9933, 0.9956,
    0.9974, 1,
  ],
  '1y': [0.792, 0.8099, 0.8052, 0.8325, 0.8507, 0.8564, 0.861, 0.8462, 0.8688, 0.9249, 0.9549, 0.9822, 1],
};

type HoldingSeed = Omit<PortfolioHolding, 'name'>;

/** In US dollars and a US-sized account; tenants scale these (see `scaled`). */
const HOLDINGS: HoldingSeed[] = [
  { id: 'geqx', ticker: 'GEQX', class: 'equity', icon: 'world', tint: 'brand', units: 420, cost: 150.2, prices: [184.6, 186.1, 185.2, 187.9, 189.3, 188.1, 190.2, 191.4] },
  { id: 'tlfd', ticker: 'TLFD', class: 'equity', icon: 'cpu', tint: 'info', units: 160, cost: 198.5, prices: [251.3, 249.8, 254.6, 258.2, 256.9, 259.4, 257.8, 262.05] },
  { id: 'clen', ticker: 'CLEN', class: 'equity', icon: 'leaf', tint: 'success', units: 380, cost: 44.1, prices: [41.62, 41.18, 40.95, 41.3, 40.44, 40.12, 39.96, 39.8] },
  { id: 'bndl', ticker: 'BNDL', class: 'bonds', icon: 'bank', tint: 'accent', units: 600, cost: 97.1, prices: [98.21, 98.3, 98.26, 98.41, 98.38, 98.52, 98.49, 98.6] },
  { id: 'aurm', ticker: 'AURM', class: 'gold', icon: 'coins', tint: 'warning', units: 24, cost: 1902, prices: [2381, 2396, 2410, 2402, 2427, 2433, 2441, 2455] },
];

const CASH = 18400;

const CONTRIBUTIONS = [
  { month: '2026-05', amount: 2400 },
  { month: '2026-06', amount: 3100 },
  { month: '2026-07', amount: 2750 },
  { month: '2026-08', amount: 3600 },
  { month: '2026-09', amount: 2900 },
  { month: '2026-10', amount: 4200 },
];

type ActivitySeed = Omit<PortfolioActivity, 'title'>;

const ACTIVITY: ActivitySeed[] = [
  { id: 'a1', kind: 'buy', amount: 1914, at: '2026-10-27T09:42:00Z' },
  { id: 'a2', kind: 'dividend', amount: 312, at: '2026-10-26T14:05:00Z' },
  { id: 'a3', kind: 'deposit', amount: 4200, at: '2026-10-25T08:10:00Z' },
  { id: 'a4', kind: 'sell', amount: 398, at: '2026-10-23T11:20:00Z' },
  { id: 'a5', kind: 'withdrawal', amount: 1500, at: '2026-10-21T17:45:00Z' },
];

const CLASSES: PortfolioClass[] = [
  { id: 'equity', label: 'Equity', icon: 'chart', tint: 'brand' },
  { id: 'bonds', label: 'Bonds', icon: 'bank', tint: 'accent' },
  { id: 'gold', label: 'Gold', icon: 'coins', tint: 'warning' },
  { id: 'cash', label: 'Cash', icon: 'wallet', tint: 'success' },
];

const round = (n: number, digits: number) => Math.round(n * 10 ** digits) / 10 ** digits;
/** Money rounded to something a person would type: whole units above 1,000, else two decimals. */
const money = (n: number) => (n >= 1000 ? Math.round(n) : round(n, 2));

/**
 * The shared data in another currency and account size. `fx` converts prices (per unit); `size` scales how much the
 * person holds (units, cash, flows). Names come from the tenant, in its language.
 */
function scaled(
  fx: number,
  size: number,
  names: { holdings: Record<string, string>; activity: Record<string, string>; classes: Record<string, string> },
  labels: PortfolioLabels,
): PortfolioData {
  return {
    asOf: AS_OF,
    cash: money(CASH * fx * size),
    history: HISTORY,
    contributions: CONTRIBUTIONS.map((c) => ({ month: c.month, amount: money(c.amount * fx * size) })),
    classes: CLASSES.map((c) => ({ ...c, label: names.classes[c.id] ?? c.label })),
    holdings: HOLDINGS.map((h) => ({
      ...h,
      name: names.holdings[h.id] ?? h.id,
      units: round(h.units * size, h.units * size < 10 ? 2 : 0),
      cost: money(h.cost * fx),
      prices: h.prices.map((p) => money(p * fx)),
    })),
    activity: ACTIVITY.map((a) => ({ ...a, title: names.activity[a.id] ?? a.id, amount: money(a.amount * fx * size) })),
    labels,
  };
}

/* ------------------------------------------------------------------------------------------------ English */

const EN: PortfolioLabels = {
  subtitle: 'Wealth',
  nav: {
    label: 'Main',
    open: 'Open navigation',
    overview: 'Overview',
    dashboard: 'Dashboard',
    holdings: 'Holdings',
    markets: 'Markets',
    marketsBadge: 'New',
    money: 'Money',
    transfers: 'Transfers',
    statements: 'Statements',
    goals: 'Goals',
    account: 'Account',
    alerts: 'Alerts',
    settings: 'Settings',
    personal: 'Personal account',
  },
  greeting: 'Good evening, {name}',
  intro: 'Your portfolio is {change} this month.',
  search: { label: 'Search', placeholder: 'Search assets and activity' },
  notifications: 'Notifications',
  kpi: {
    netWorth: 'Net worth',
    netWorthDelta: 'this month',
    today: 'Today',
    todayDelta: 'in 24 hours',
    returns: 'Total return',
    returnsDelta: 'on what you put in',
    invested: 'Invested this month',
    investedDelta: 'vs {month}',
  },
  chart: {
    title: 'Portfolio value',
    period: 'Period',
    periods: { '24h': '24H', '7d': '7D', '1m': '1M', '1y': '1Y' },
    versus: { '24h': 'in 24 hours', '7d': 'in 7 days', '1m': 'in a month', '1y': 'in a year' },
    series: 'Value',
    x: { '24h': 'Time', '7d': 'Day', '1m': 'Date', '1y': 'Month' },
  },
  allocation: { title: 'Allocation', share: '{percent} of portfolio' },
  contributions: { title: 'Monthly investing', caption: 'Invested in {month}', series: 'Invested', x: 'Month' },
  promo: {
    eyebrow: 'Cash ready to invest',
    title: 'Put idle cash to work',
    body: 'Move money in or out in seconds. Deposits are invested on the next trading day.',
    cash: 'Available cash',
    next: 'Next auto-invest',
    deposit: 'Deposit',
    withdraw: 'Withdraw',
  },
  activity: {
    title: 'Recent activity',
    viewAll: 'View all',
    kinds: { buy: 'Bought', sell: 'Sold', dividend: 'Dividend', deposit: 'Deposit', withdrawal: 'Withdrawal' },
  },
  holdings: {
    title: 'Holdings',
    asset: 'Asset',
    price: 'Price',
    change: '7D',
    trend: 'Last 7 days',
    holding: 'Holding',
    value: 'Value',
    allocation: 'Share',
    units: '{units} units',
    trendLabel: '{name}: {change} over 7 days',
  },
};

const EN_NAMES = {
  holdings: {
    geqx: 'Global Equity Index',
    tlfd: 'Tech Leaders Fund',
    clen: 'Clean Energy Fund',
    bndl: 'Government Bond Ladder',
    aurm: 'Gold Reserve',
  },
  activity: {
    a1: 'Global Equity Index',
    a2: 'Government Bond Ladder',
    a3: 'From checking ••42',
    a4: 'Clean Energy Fund',
    a5: 'To checking ••42',
  },
  classes: { equity: 'Equity', bonds: 'Bonds', gold: 'Gold', cash: 'Cash' },
};

/** The sample: a US account, used when a tenant supplies no `portfolio` (and by the site's own brand). */
export const portfolioContent: PortfolioContent = {
  locale: 'en-US',
  currency: 'USD',
  product: { name: 'Ledger', industry: 'Wealth' },
  user: { name: 'Jordan Lee', initials: 'JL' },
  portfolio: scaled(1, 1, EN_NAMES, EN),
};

/* ------------------------------------------------------------------------------------------------ tenants */

const EN_IN: PortfolioLabels = {
  ...EN,
  intro: 'Your investments are {change} this month.',
  search: { label: 'Search', placeholder: 'Search funds and activity' },
};

const EN_GB: PortfolioLabels = {
  ...EN,
  subtitle: 'Investments',
  greeting: 'Good afternoon, {name}',
  intro: 'Your investments are {change} this month.',
  kpi: { ...EN.kpi, returns: 'Total return', returnsDelta: 'on what you’ve paid in' },
  promo: {
    eyebrow: 'Cash ready to invest',
    title: 'Top up your ISA',
    body: 'Pay in or take money out in seconds. New money is invested on the next working day.',
    cash: 'Cash in your account',
    next: 'Next regular investment',
    deposit: 'Pay in',
    withdraw: 'Withdraw',
  },
  activity: {
    ...EN.activity,
    kinds: { buy: 'Bought', sell: 'Sold', dividend: 'Dividend', deposit: 'Paid in', withdrawal: 'Withdrawal' },
  },
  holdings: { ...EN.holdings, units: '{units} units' },
};

const AR: PortfolioLabels = {
  subtitle: 'الثروة',
  nav: {
    label: 'الرئيسية',
    open: 'فتح القائمة',
    overview: 'نظرة عامة',
    dashboard: 'لوحة التحكم',
    holdings: 'المقتنيات',
    markets: 'الأسواق',
    marketsBadge: 'جديد',
    money: 'الأموال',
    transfers: 'التحويلات',
    statements: 'الكشوفات',
    goals: 'الأهداف',
    account: 'الحساب',
    alerts: 'التنبيهات',
    settings: 'الإعدادات',
    personal: 'حساب شخصي',
  },
  greeting: 'مساء الخير، {name}',
  intro: 'تغيّرت محفظتك بمقدار {change} هذا الشهر.',
  search: { label: 'بحث', placeholder: 'ابحث في الأصول والعمليات' },
  notifications: 'الإشعارات',
  kpi: {
    netWorth: 'صافي الثروة',
    netWorthDelta: 'هذا الشهر',
    today: 'اليوم',
    todayDelta: 'خلال 24 ساعة',
    returns: 'إجمالي العائد',
    returnsDelta: 'على ما استثمرته',
    invested: 'المستثمر هذا الشهر',
    investedDelta: 'مقارنةً بـ{month}',
  },
  chart: {
    title: 'قيمة المحفظة',
    period: 'الفترة',
    periods: { '24h': '24 س', '7d': '7 أيام', '1m': 'شهر', '1y': 'سنة' },
    versus: { '24h': 'خلال 24 ساعة', '7d': 'خلال 7 أيام', '1m': 'خلال شهر', '1y': 'خلال سنة' },
    series: 'القيمة',
    x: { '24h': 'الوقت', '7d': 'اليوم', '1m': 'التاريخ', '1y': 'الشهر' },
  },
  allocation: { title: 'توزيع الأصول', share: '{percent} من المحفظة' },
  contributions: { title: 'الاستثمار الشهري', caption: 'استثمرت في {month}', series: 'المستثمر', x: 'الشهر' },
  promo: {
    eyebrow: 'نقد جاهز للاستثمار',
    title: 'استثمر نقدك المتاح',
    body: 'أودِع أو اسحب خلال ثوانٍ. تُستثمر الإيداعات في يوم التداول التالي.',
    cash: 'النقد المتاح',
    next: 'الاستثمار التلقائي التالي',
    deposit: 'إيداع',
    withdraw: 'سحب',
  },
  activity: {
    title: 'آخر العمليات',
    viewAll: 'عرض الكل',
    kinds: { buy: 'شراء', sell: 'بيع', dividend: 'توزيعات أرباح', deposit: 'إيداع', withdrawal: 'سحب' },
  },
  holdings: {
    title: 'المقتنيات',
    asset: 'الأصل',
    price: 'السعر',
    change: '7 أيام',
    trend: 'آخر 7 أيام',
    holding: 'الكمية',
    value: 'القيمة',
    allocation: 'الحصة',
    units: '{units} وحدة',
    trendLabel: '{name}: {change} خلال 7 أيام',
  },
};

type TenantCopy = Pick<PortfolioContent, 'portfolio'>;

/** Sample copy per docs tenant (see the note at the top). Keys are tenant folder names. */
export const portfolioTenantCopy: Record<string, TenantCopy> = {
  /** Vela is a neobank: the wealth tab of a current account, in rupees. */
  vela: {
    portfolio: scaled(83, 0.12, { ...EN_NAMES, activity: { ...EN_NAMES.activity, a3: 'From Vela savings ••42', a5: 'To Vela savings ••42' } }, EN_IN),
  },
  /** Harbor is an insurer: an investment ISA next to the policies, in pounds. */
  harbor: {
    portfolio: scaled(
      0.79,
      0.8,
      {
        holdings: { ...EN_NAMES.holdings, bndl: 'Gilt Ladder' },
        activity: { ...EN_NAMES.activity, a2: 'Gilt Ladder', a3: 'From current account ••42', a5: 'To current account ••42' },
        classes: { ...EN_NAMES.classes, bonds: 'Gilts' },
      },
      EN_GB,
    ),
  },
  /** Qamar is a grocery and rewards app: a small savings pot that invests, in dirhams, in Arabic. */
  qamar: {
    portfolio: scaled(
      3.6725,
      0.5,
      {
        holdings: {
          geqx: 'مؤشر الأسهم العالمية',
          tlfd: 'صندوق رواد التقنية',
          clen: 'صندوق الطاقة النظيفة',
          bndl: 'سُلّم السندات الحكومية',
          aurm: 'احتياطي الذهب',
        },
        activity: {
          a1: 'مؤشر الأسهم العالمية',
          a2: 'سُلّم السندات الحكومية',
          a3: 'من محفظة قمر ••42',
          a4: 'صندوق الطاقة النظيفة',
          a5: 'إلى محفظة قمر ••42',
        },
        classes: { equity: 'أسهم', bonds: 'سندات', gold: 'ذهب', cash: 'نقد' },
      },
      AR,
    ),
  },
  /** Care is a family health-benefits product: a health fund the family invests for later care, in rupees. */
  care: {
    portfolio: scaled(
      83,
      0.05,
      {
        ...EN_NAMES,
        activity: { ...EN_NAMES.activity, a3: 'Monthly family top-up', a5: 'Hospital bill, Aarav' },
      },
      {
        ...EN_IN,
        subtitle: 'Family health fund',
        intro: 'Your family’s health fund is {change} this month.',
        promo: {
          eyebrow: 'Cash ready for care',
          title: 'Keep a cushion for care',
          body: 'Top up the family fund, or take money out for a bill. Top-ups are invested on the next trading day.',
          cash: 'Available cash',
          next: 'Next monthly top-up',
          deposit: 'Top up',
          withdraw: 'Take out',
        },
      },
    ),
  },
};

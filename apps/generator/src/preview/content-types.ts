/**
 * Shape of tenants/<name>/content.json.
 * A tenant differs from another by tokens (brand.json) and copy (content.json) only — never by components.
 * Phase 1 covers the Overview screen. The optional sections at the end feed the docs blocks (wave 2).
 */

export type Tone = 'success' | 'warning' | 'danger' | 'info';

export interface StatContent {
  label: string;
  /** Raw number; formatted with Intl using the tenant locale. */
  value: number;
  format: 'currency' | 'number' | 'percent';
  /** Fractional change, e.g. 0.032 = +3.2%. Omit for no delta. */
  delta?: number;
  deltaLabel?: string;
  /** Whether an increase is good news (spend going up is not). */
  positiveIsGood?: boolean;
}

export interface ActivityRow {
  /** ISO date, e.g. "2026-09-24". Formatted with Intl.DateTimeFormat in the tenant locale. */
  date: string;
  title: string;
  /** Secondary line under the title, e.g. merchant or reference. */
  meta: string;
  category: string;
  /** Key into `statusLabels`. */
  status: string;
  /** Signed amount in the tenant currency. Negative = money out. */
  amount: number;
}

export interface FormFieldContent {
  type: 'text' | 'select';
  id: string;
  label: string;
  hint?: string;
  placeholder?: string;
  options?: string[];
  /** Prefilled value (text) or selected option (select). */
  value?: string;
  /** Optional. Virtual-keyboard hint for text fields, e.g. "decimal" for an amount. */
  inputMode?: 'text' | 'numeric' | 'decimal';
  /** Optional. Shows the tenant currency symbol (derived from `currency` + `locale` via Intl) inside the control. */
  currencyAffix?: boolean;
}

export interface TenantContent {
  /** BCP 47, e.g. "en-IN", "en-GB", "ar-AE-u-nu-latn". */
  locale: string;
  dir: 'ltr' | 'rtl';
  /** ISO 4217, e.g. "INR". */
  currency: string;
  product: { name: string; industry: string };
  nav: string[];
  user: { name: string; initials: string };
  a11y: { search: string; notifications: string; account: string; mainNav: string };
  overview: {
    greeting: string;
    subtitle: string;
    primaryAction: string;
    secondaryAction: string;
    alert: { tone: Tone; title: string; body: string; action: string };
    stats: StatContent[];
    table: {
      title: string;
      action: string;
      columns: { date: string; description: string; category: string; status: string; amount: string };
      rows: ActivityRow[];
    };
    statusLabels: Record<string, { label: string; tone: Tone }>;
    form: { title: string; description: string; fields: FormFieldContent[]; submit: string };
    /** `value` is a fraction 0–1 (0.62 = 62%), like StatContent.delta. Values above 1 are read as a percentage. */
    progress: { title: string; value: number; label: string; caption: string };
  };
  /* Optional sections read by the docs blocks (apps/docs/blocks); types below. */
  dashboard?: DashboardSection;
  requestFlow?: RequestFlowSection;
  settings?: SettingsSection;
  signIn?: SignInSection;
  activity?: ActivitySection;
}

/* ------------------------------------------------------------------ *
 * Blocks (apps/docs/blocks) — optional sections, added in wave 2.
 * Each block's own <name>.content.ts declares the same shape for registry installs; keep them in step.
 * The dashboard-overview block reads `overview` plus `dashboard`.
 * ------------------------------------------------------------------ */

/** Plural forms keyed by Intl.PluralRules category; `{count}` is replaced with the formatted number. */
export type PluralContent = { other: string } & Partial<Record<'zero' | 'one' | 'two' | 'few' | 'many', string>>;

export interface OptionContent {
  id: string;
  label: string;
}

export interface DashboardSection {
  /** Sparkline on one stat tile: `stat` is its index in `overview.stats`, `values` oldest first. */
  sparkline?: { stat: number; values: number[] };
  command: {
    placeholder: string;
    /** `{query}` is replaced with the search text. */
    empty: string;
    pages: string;
    actions: string;
    recent: string;
    hints: { navigate: string; select: string; close: string };
  };
  notifications: {
    title: string;
    markAllRead: string;
    items: { id: string; title: string; description: string; ago: { value: number; unit: 'minute' | 'hour' | 'day' | 'week' } }[];
  };
  account: { profile: string; settings: string; help: string; signOut: string };
  formSubmitted: { title: string; description: string };
}

export interface RequestFlowSection {
  exit: string;
  title: string;
  subtitle: string;
  progressLabel: string;
  stepWord: string;
  ofWord: string;
  completedWord: string;
  steps: { details: string; evidence: string; review: string };
  /** `date` is ISO; `amount` is signed, in the tenant currency. */
  subject: { label: string; title: string; meta: string; dateLabel: string; date: string; amountLabel: string; amount: number };
  help: { title: string; items: string[] };
  errorSummary: string;
  back: string;
  next: string;
  details: {
    title: string;
    description: string;
    reason: { label: string; options: { id: string; label: string; description: string }[]; error: string };
    field: {
      kind: 'amount' | 'text';
      label: string;
      description?: string;
      placeholder?: string;
      errors: { required: string; invalid?: string; tooHigh?: string };
    };
    date: { label: string; description?: string; errors: { required: string; future: string } };
  };
  evidence: {
    title: string;
    description: string;
    upload: { label: string; description?: string; dropLabel: string; browseLabel: string; hint: string; error: string };
  };
  review: {
    title: string;
    description: string;
    edit: string;
    labels: { reason: string; field: string; date: string; files: string };
    files: PluralContent;
    confirm: { label: string; error: string };
    submit: string;
    dialog: { title: string; body: string; action: string; cancel: string };
  };
  /** `description` may contain `{reference}`. */
  success: { title: string; description: string; reference: string; track: string; done: string };
}

export interface SettingsSection {
  title: string;
  description: string;
  tabsLabel: string;
  tabs: { profile: string; notifications: string; security: string; billing: string };
  save: string;
  saved: string;
  profile: {
    title: string;
    description: string;
    photo: { label: string; dropLabel: string; browseLabel: string; hint: string };
    name: { label: string; value: string; description?: string };
    email: { label: string; value: string; description?: string };
    phone: { label: string; value: string; description?: string };
    language: { label: string; value: string; options: OptionContent[] };
    /** `value` and option ids are IANA time zones. */
    region: { label: string; value: string; options: OptionContent[] };
  };
  display: {
    title: string;
    description: string;
    theme: { label: string; options: { system: string; light: string; dark: string } };
    density: { label: string; options: { comfortable: string; compact: string } };
  };
  danger: { title: string; description: string; action: string; dialog: { title: string; body: string; action: string; cancel: string }; done: string };
  notifications: {
    title: string;
    description: string;
    groups: { title: string; items: { id: string; label: string; description: string; on: boolean; locked?: boolean }[] }[];
    channels: { label: string; options: OptionContent[]; selected: string[] };
  };
  security: {
    title: string;
    description: string;
    twoFactor: { label: string; description: string; on: boolean };
    password: { label: string; description: string; action: string };
    sessions: {
      title: string;
      description: string;
      columns: { device: string; location: string; lastActive: string; actions: string };
      current: string;
      /** `{device}` is replaced. */
      actionsLabel: string;
      signOut: string;
      signedOut: string;
      /** `lastActive` is an ISO date-time with offset. */
      rows: { id: string; device: string; kind: 'desktop' | 'mobile' | 'tablet'; location: string; lastActive: string; current?: boolean }[];
    };
  };
  billing: {
    title: string;
    description: string;
    plan: { name: string; price: number; period: string; badge: string; features: string[]; change: string };
    method: { title: string; label: string; detail: string; update: string };
  };
}

export interface SignInSection {
  title: string;
  subtitle: string;
  email: { label: string; placeholder: string; errors: { required: string; invalid: string } };
  password: { label: string; show: string; hide: string; forgot: string; errors: { required: string } };
  remember: string;
  submit: string;
  or: string;
  passkey: string;
  signUp: { prompt: string; action: string };
  legal: { terms: string; privacy: string; help: string };
  brand: { headline: string; body: string };
  success: { title: string };
}

export interface ActivitySection {
  title: string;
  description: string;
  export: string;
  exported: PluralContent;
  refresh: string;
  search: { label: string; placeholder: string };
  status: { label: string; all: string };
  density: { label: string; comfortable: string; compact: string };
  bulk: { label: string; items: { id: string; label: string; done: PluralContent }[] };
  selected: PluralContent;
  columns: { date: string; description: string; category: string; status: string; amount: string };
  statuses: Record<string, { label: string; tone: Tone | 'neutral' }>;
  /** Same shape as the overview rows, plus a unique id. */
  rows: (ActivityRow & { id: string })[];
  empty: { title: string; description: string; clear: string };
  pagination: { label: string; previous: string; next: string; page: string; of: string; summary: string; none: string };
  loading: string;
}

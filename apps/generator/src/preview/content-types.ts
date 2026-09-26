/**
 * Shape of tenants/<name>/content.json.
 * A tenant differs from another by tokens (brand.json) and copy (content.json) only — never by components.
 * Phase 1 covers the Overview screen; request flow and settings arrive in Phase 3.
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
    progress: { title: string; value: number; label: string; caption: string };
  };
}

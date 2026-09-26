/**
 * Locale-driven formatting for the reference screens. Everything goes through Intl with the tenant's
 * `locale` + `currency` from content.json — the screen never hand-formats a number or a date.
 *
 *   en-IN            → ₹1,84,250 (lakh grouping), 12 Sept
 *   en-GB            → £1,146.20, 12 Sept
 *   ar-AE-u-nu-latn  → ‏1,286 د.إ.‏ (Western digits, Arabic currency symbol), 12 سبتمبر
 *
 * Formatters are memoised: the Brand Generator re-renders every screen on each keystroke.
 */
import type { StatContent } from './content-types';

const MINUS = '−'; // "−" true minus sign; same bidi class (ES) as "-", so RTL ordering is unchanged.

const numberFormats = new Map<string, Intl.NumberFormat>();
const dateFormats = new Map<string, Intl.DateTimeFormat>();

function numberFormat(locale: string, options: Intl.NumberFormatOptions): Intl.NumberFormat {
  const key = locale + JSON.stringify(options);
  let format = numberFormats.get(key);
  if (!format) {
    format = new Intl.NumberFormat(locale, options);
    numberFormats.set(key, format);
  }
  return format;
}

/** Formats, swapping the ASCII hyphen Intl uses for negatives with a typographic minus. */
function withMinus(format: Intl.NumberFormat, value: number): string {
  return format
    .formatToParts(value)
    .map((part) => (part.type === 'minusSign' ? part.value.replace('-', MINUS) : part.value))
    .join('');
}

/** Primary language subtag for the `lang` attribute: "ar-AE-u-nu-latn" → "ar". */
export function languageOf(locale: string): string {
  try {
    return new Intl.Locale(locale).language;
  } catch {
    return locale.split('-')[0] ?? locale;
  }
}

/** Whole amounts drop the minor unit (₹1,84,250); fractional ones keep it (£1,146.20). */
function fractionDigits(value: number): Intl.NumberFormatOptions {
  return Number.isInteger(value) ? { maximumFractionDigits: 0 } : {};
}

export function formatCurrency(value: number, locale: string, currency: string): string {
  return withMinus(numberFormat(locale, { style: 'currency', currency, ...fractionDigits(value) }), value);
}

/** Ledger amount, always with the minor unit and an explicit sign: +₹1,42,000.00 / −₹420.00. */
export function formatSignedAmount(value: number, locale: string, currency: string): string {
  return withMinus(numberFormat(locale, { style: 'currency', currency, signDisplay: 'exceptZero' }), value);
}

export function formatNumber(value: number, locale: string): string {
  return withMinus(numberFormat(locale, { maximumFractionDigits: 2 }), value);
}

/** `value` is a fraction: 0.112 → "11.2%". `signed` adds "+" / "−" for deltas. */
export function formatPercent(value: number, locale: string, signed = false): string {
  return withMinus(
    numberFormat(locale, {
      style: 'percent',
      maximumFractionDigits: 1,
      ...(signed ? { signDisplay: 'exceptZero' as const } : {}),
    }),
    value,
  );
}

export function formatStatValue(stat: StatContent, locale: string, currency: string): string {
  switch (stat.format) {
    case 'currency':
      return formatCurrency(stat.value, locale, currency);
    case 'percent':
      return formatPercent(stat.value, locale);
    default:
      return formatNumber(stat.value, locale);
  }
}

/** The tenant's currency symbol as the locale writes it ("₹", "£", "د.إ."). */
export function currencySymbol(locale: string, currency: string): string {
  const part = numberFormat(locale, { style: 'currency', currency })
    .formatToParts(0)
    .find((p) => p.type === 'currency');
  return part?.value ?? currency;
}

/** ISO date → short day + month in the tenant locale: "12 Sept", "12 سبتمبر". Read and written in UTC so it never shifts a day. */
export function formatShortDate(iso: string, locale: string): string {
  const key = locale;
  let format = dateFormats.get(key);
  if (!format) {
    format = new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short', timeZone: 'UTC' });
    dateFormats.set(key, format);
  }
  const date = new Date(`${iso}T00:00:00Z`);
  return Number.isNaN(date.getTime()) ? iso : format.format(date);
}

/** Progress value as a 0–100 integer for aria-valuenow. Accepts a fraction (0.62) or a percentage (62). */
export function toPercentInt(value: number): number {
  const pct = value > 1 ? value : value * 100;
  return Math.round(Math.min(100, Math.max(0, pct)));
}

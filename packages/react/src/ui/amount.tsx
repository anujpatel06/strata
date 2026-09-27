'use client';

import { useMemo, type HTMLAttributes, type JSX, type Ref } from 'react';
import { isRTL, useLocale } from 'react-aria-components';
import styles from './amount.module.css';

const cx = (...c: Array<string | false | null | undefined>) => c.filter(Boolean).join(' ');

const MINUS = '−'; // "−": a true minus sign. The hyphen Intl returns reads as punctuation at display sizes.

export interface AmountProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'children'> {
  /** The amount in major units (18000 = ₹18,000). */
  value: number;
  /** ISO 4217 code, e.g. "INR", "GBP", "AED". */
  currency: string;
  /** Formatting locale. Defaults to the React Aria locale (ThemeScope `locale` or I18nProvider). */
  locale?: string;
  /** Display size: sm = font-size 2xl, md = 3xl, lg = 4xl, xl = 5xl. */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** `raised`: the currency sign sits small and high beside the figure. `inline`: plain text. */
  symbol?: 'raised' | 'inline';
  /** Colour of the figure. The currency sign and fraction stay `text.subtle`. */
  tone?: 'neutral' | 'brand' | 'accent' | 'info' | 'success' | 'warning' | 'danger';
  /** Short notation: ₹18K, ₹1.8L, £18k (locale-correct, one decimal at most). */
  compact?: boolean;
  /**
   * Extra Intl.NumberFormat options (e.g. `currencyDisplay: 'narrowSymbol'`, `signDisplay: 'always'`,
   * `maximumFractionDigits: 2`). Whole numbers show no decimals unless you ask for them.
   */
  formatOptions?: Omit<Intl.NumberFormatOptions, 'style' | 'currency'>;
  ref?: Ref<HTMLSpanElement>;
}

type PartKind = 'currency' | 'fraction' | 'sign' | 'text';

/**
 * Money set as type: the figure in the heading face with tabular, size-tracked digits and the currency sign
 * raised and small before it (or after it, where the locale puts it there). Grouping comes from the locale via
 * Intl.NumberFormat, so en-IN reads 1,84,250 and de-DE 1.249,50 €. Screen readers hear the full string once.
 */
export function Amount({
  value,
  currency,
  locale: localeProp,
  size = 'md',
  symbol = 'raised',
  tone = 'neutral',
  compact = false,
  formatOptions,
  className,
  ref,
  ...rest
}: AmountProps): JSX.Element {
  const { locale: contextLocale } = useLocale();
  const locale = localeProp ?? contextLocale;

  const { full, parts } = useMemo(() => {
    const whole = Number.isInteger(value);
    const options: Intl.NumberFormatOptions = {
      style: 'currency',
      currency,
      ...(compact
        ? { notation: 'compact', compactDisplay: 'short', maximumFractionDigits: 1 }
        : whole
          ? { minimumFractionDigits: 0, maximumFractionDigits: 0 }
          : {}),
      ...formatOptions,
    };
    const raw = new Intl.NumberFormat(locale, options).formatToParts(value);
    const out: Array<{ kind: PartKind; text: string }> = [];
    raw.forEach((part, i) => {
      const nextToCurrency = raw[i - 1]?.type === 'currency' || raw[i + 1]?.type === 'currency';
      // A raised sign is spaced by margin, so the locale's (non-breaking) space beside it would double the gap.
      if (symbol === 'raised' && part.type === 'literal' && nextToCurrency && /^\s+$/.test(part.value)) return;
      let kind: PartKind = 'text';
      if (part.type === 'currency') kind = 'currency';
      else if (part.type === 'minusSign' || part.type === 'plusSign') kind = 'sign';
      // Cents are set smaller; in compact notation the decimal belongs to the figure ("1.8L"), so it stays full size.
      else if (!compact && (part.type === 'decimal' || part.type === 'fraction')) kind = 'fraction';
      out.push({ kind, text: part.type === 'minusSign' ? part.value.replace('-', MINUS) : part.value });
    });
    const text = raw.map((p) => (p.type === 'minusSign' ? p.value.replace('-', MINUS) : p.value)).join('');
    return { full: text, parts: out };
  }, [value, currency, locale, compact, formatOptions, symbol]);

  const currencyIndex = parts.findIndex((p) => p.kind === 'currency');
  const numberIndex = parts.findIndex((p) => p.kind === 'text' && /\d/.test(p.text));
  const symbolSide = currencyIndex > -1 && numberIndex > -1 && currencyIndex > numberIndex ? 'after' : 'before';

  return (
    <span
      {...rest}
      ref={ref}
      data-size={size}
      data-symbol={symbol}
      data-tone={tone}
      className={cx(styles.amount, className)}
    >
      {/* The figure follows its own locale's direction, so "₹18,000" never reorders inside an RTL page. */}
      <span className={styles.figure} aria-hidden="true" dir={isRTL(locale) ? 'rtl' : 'ltr'}>
        {parts.map((part, i) => {
          if (part.kind === 'currency')
            return (
              <span
                key={i}
                className={styles.currency}
                data-side={symbolSide}
                data-long={[...part.text.replace(/[\p{M}\p{Cf}.]/gu, '')].length > 1 ? '' : undefined}
              >
                {part.text}
              </span>
            );
          if (part.kind === 'fraction')
            return (
              <span key={i} className={styles.fraction}>
                {part.text}
              </span>
            );
          return part.text;
        })}
      </span>
      <span className={styles.srOnly}>{full}</span>
    </span>
  );
}

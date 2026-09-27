'use client';

import { useCallback, useId, type CSSProperties, type JSX, type ReactNode, type Ref } from 'react';
import {
  Label,
  Meter as AriaMeter,
  composeRenderProps,
  useLocale,
  type MeterProps as AriaMeterProps,
} from 'react-aria-components';
import styles from './meter.module.css';

const cx = (...c: Array<string | false | null | undefined>) => c.filter(Boolean).join(' ');

/** A visible label, or an accessible name for meters that sit under their own heading (the KYB usage row). */
type MeterLabelling =
  | { label: ReactNode; 'aria-label'?: string; 'aria-labelledby'?: string }
  | { label?: undefined; 'aria-label': string; 'aria-labelledby'?: string }
  | { label?: undefined; 'aria-label'?: string; 'aria-labelledby': string };

export type MeterProps = Omit<AriaMeterProps, 'children' | 'valueLabel' | 'aria-label' | 'aria-labelledby'> &
  MeterLabelling & {
    /**
     * The value as shown and announced, e.g. "₹7,400 used". Defaults to the value formatted with
     * `formatOptions` (a percentage unless you pass e.g. `{ style: 'currency', currency: 'INR' }`).
     */
    valueLabel?: string;
    /** Shows the value at the inline end of the label row. */
    showValue?: boolean;
    /** Quiet context after the value: the limit or the pool it draws from ("of ₹18,000", "from ₹18K wallet"). Announced as the meter's description. */
    caption?: ReactNode;
    /** Fill colour. Every tone reaches 3:1 against the track. */
    tone?: 'brand' | 'accent' | 'neutral' | 'info' | 'success' | 'warning' | 'danger';
    /** `card` sets the meter in an inset panel, for usage rows inside a card. */
    variant?: 'default' | 'card';
    ref?: Ref<HTMLDivElement>;
  };

/**
 * A quantity within a known range: wallet usage, storage, a limit. Not for task progress (use ProgressBar).
 * The fill slides in from the start edge on mount and glides to new values.
 */
export function Meter({
  label,
  valueLabel,
  showValue = true,
  caption,
  tone = 'brand',
  variant = 'default',
  className,
  'aria-describedby': describedBy,
  ref,
  ...rest
}: MeterProps): JSX.Element {
  const captionId = useId();
  // React Aria renders role="meter progressbar" (a fallback list for old screen readers), and axe-core 4.13 rejects the
  // value attributes on that list. Every screen reader we support knows "meter" (ARIA 1.2), so the element gets that
  // role alone once mounted. React never resets it: its own value for the prop doesn't change between renders.
  const setRef = useCallback(
    (el: HTMLDivElement | null) => {
      el?.setAttribute('role', 'meter');
      if (typeof ref === 'function') ref(el);
      else if (ref) (ref as { current: HTMLDivElement | null }).current = el;
    },
    [ref],
  );
  const { direction } = useLocale();
  const hasCaption = caption != null && caption !== false && caption !== '';
  return (
    <AriaMeter
      {...rest}
      ref={setRef}
      valueLabel={valueLabel}
      aria-describedby={cx(hasCaption && captionId, describedBy) || undefined}
      data-tone={tone}
      data-variant={variant}
      data-labelled={label != null ? '' : undefined}
      className={composeRenderProps(className, (c) => cx(styles.meter, c))}
    >
      {({ percentage, valueText }) => (
        <>
          {(label != null || showValue || hasCaption) && (
            <div className={styles.header}>
              {label != null && <Label className={styles.label}>{label}</Label>}
              {(showValue || hasCaption) && (
                <span className={styles.readout}>
                  {showValue && (
                    // A value React Aria formatted follows the locale's direction; an authored label ("₹7,400 used")
                    // takes the direction of its own first letter, so it never reorders inside an RTL page.
                    <span className={styles.value} dir={valueLabel != null ? 'auto' : direction}>
                      {valueText}
                    </span>
                  )}
                  {hasCaption && (
                    <span id={captionId} className={styles.caption} dir={typeof caption === 'string' ? 'auto' : undefined}>
                      {caption}
                    </span>
                  )}
                </span>
              )}
            </div>
          )}
          <div className={styles.track}>
            <div className={styles.fill} style={{ '--_pct': `${percentage}%` } as CSSProperties} />
          </div>
        </>
      )}
    </AriaMeter>
  );
}

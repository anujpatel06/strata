'use client';

import type { CSSProperties, JSX, ReactNode, Ref } from 'react';
import {
  Label,
  ProgressBar as AriaProgressBar,
  composeRenderProps,
  type ProgressBarProps as AriaProgressBarProps,
} from 'react-aria-components';
import styles from './progress.module.css';

const cx = (...c: Array<string | false | null | undefined>) => c.filter(Boolean).join(' ');

/** A visible label, or an accessible name for bars that sit next to their own heading. */
type ProgressBarLabelling =
  | { label: ReactNode; 'aria-label'?: string; 'aria-labelledby'?: string }
  | { label?: undefined; 'aria-label': string; 'aria-labelledby'?: string }
  | { label?: undefined; 'aria-label'?: string; 'aria-labelledby': string };

export type ProgressBarProps = Omit<AriaProgressBarProps, 'children' | 'aria-label' | 'aria-labelledby'> &
  ProgressBarLabelling & {
    /** Shows the formatted value (see `formatOptions`, default percent) at the inline end of the label row. */
    showValue?: boolean;
    /** Fill colour. `default` uses the brand accent. */
    tone?: 'default' | 'success' | 'warning' | 'danger';
    size?: 'sm' | 'md';
    ref?: Ref<HTMLDivElement>;
  };

/** Shows how far an operation has got. Omit `value` or set `isIndeterminate` when the duration is unknown. */
export function ProgressBar({
  label,
  showValue = false,
  tone = 'default',
  size = 'md',
  className,
  ...rest
}: ProgressBarProps): JSX.Element {
  return (
    <AriaProgressBar
      {...rest}
      data-tone={tone}
      data-size={size}
      className={composeRenderProps(className, (c) => cx(styles.progress, c))}
    >
      {({ percentage, valueText, isIndeterminate }) => (
        <>
          {(label != null || (showValue && !isIndeterminate)) && (
            <div className={styles.header}>
              {label != null && <Label className={styles.label}>{label}</Label>}
              {showValue && !isIndeterminate && <span className={styles.value}>{valueText}</span>}
            </div>
          )}
          <div className={styles.track}>
            <div
              className={styles.fill}
              data-indeterminate={isIndeterminate || undefined}
              style={isIndeterminate ? undefined : ({ '--_pct': `${percentage ?? 0}%` } as CSSProperties)}
            />
          </div>
        </>
      )}
    </AriaProgressBar>
  );
}

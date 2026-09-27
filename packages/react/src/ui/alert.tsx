'use client';

import { useId, type HTMLAttributes, type JSX, type ReactNode, type Ref } from 'react';
import { Button as AriaButton } from 'react-aria-components';
import { IconAlertCircleFilled, IconAlertTriangleFilled, IconInfoCircleFilled, IconSealCheckFilled, IconX } from '@strata/icons';
import styles from './alert.module.css';

const cx = (...c: Array<string | false | null | undefined>) => c.filter(Boolean).join(' ');

export type AlertTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger';

/*
 * Filled status shapes, the same set as Toast (Anuj's reference). Each tone has its own shape, so tone never relies
 * on colour alone; neutral shares info's shape in text.subtle. CSS colours the shape feedback.<tone>.fg and knocks
 * the glyph out in feedback.<tone>.bg (proof: test/alert.test.tsx).
 */
const TONE_ICON: Record<AlertTone, typeof IconInfoCircleFilled> = {
  neutral: IconInfoCircleFilled,
  info: IconInfoCircleFilled,
  success: IconSealCheckFilled,
  warning: IconAlertCircleFilled,
  danger: IconAlertTriangleFilled,
};

export interface AlertProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  tone?: AlertTone;
  /** Short summary, shown in semibold above the body. */
  title?: ReactNode;
  /** Replaces the tone icon. Pass `false` to show no icon. */
  icon?: ReactNode | false;
  /**
   * One link or small button, placed at the inline end on wide alerts and under the text on narrow ones. Match its
   * weight to the tone: `<Button size="sm" variant="contrast">` for danger/warning, `variant="outline"` otherwise.
   */
  action?: ReactNode;
  /** Shows a close button that calls this. */
  onDismiss?: () => void;
  /** Accessible name of the close button. */
  dismissLabel?: string;
  /**
   * Announce the alert when it appears. `true` / `'assertive'` → role="alert" (interrupts);
   * `'polite'` → role="status". Leave unset for alerts that are part of the page on load.
   */
  live?: boolean | 'assertive' | 'polite';
  ref?: Ref<HTMLDivElement>;
}

/** An inline message about the page or a section of it. */
export function Alert({
  tone = 'neutral',
  title,
  icon,
  action,
  onDismiss,
  dismissLabel = 'Dismiss',
  live,
  className,
  children,
  ...rest
}: AlertProps): JSX.Element {
  const titleId = useId();
  const ToneIcon = TONE_ICON[tone];
  const role = live === 'polite' ? 'status' : live ? 'alert' : undefined;
  const hasTitle = title != null && title !== false;
  const hasBody = children != null && children !== false;

  return (
    <div
      role={role}
      aria-labelledby={role && hasTitle ? titleId : undefined}
      {...rest}
      data-tone={tone}
      data-dismissible={onDismiss ? '' : undefined}
      className={cx(styles.alert, className)}
    >
      <div className={styles.layout}>
        <div className={styles.main}>
          <div className={styles.lead}>
            {icon !== false && (
              <span className={styles.icon} aria-hidden="true">
                {icon ?? <ToneIcon />}
              </span>
            )}
            <div className={styles.content}>
              {hasTitle && (
                <div id={titleId} className={styles.title}>
                  {title}
                </div>
              )}
              {hasBody && <div className={styles.body}>{children}</div>}
            </div>
          </div>
          {action != null && action !== false && <div className={styles.action}>{action}</div>}
        </div>
        {onDismiss && (
          <AriaButton className={styles.dismiss} aria-label={dismissLabel} onPress={onDismiss}>
            <IconX aria-hidden="true" stroke={2} />
          </AriaButton>
        )}
      </div>
    </div>
  );
}

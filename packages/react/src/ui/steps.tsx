'use client';

import { IconCheck } from '@tabler/icons-react';
import { useMemo, type HTMLAttributes, type JSX, type ReactNode } from 'react';
import { Button as RACButton, useLocale } from 'react-aria-components';
import styles from './steps.module.css';

const cx = (...c: Array<string | false | null | undefined>) => c.filter(Boolean).join(' ');

export interface StepItem {
  id: string;
  label: ReactNode;
  description?: ReactNode;
}

export type StepStatus = 'complete' | 'current' | 'upcoming';

export interface StepsProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  steps: StepItem[];
  /** Id of the current step. Steps before it are complete, steps after it are upcoming. */
  current: string;
  orientation?: 'horizontal' | 'vertical';
  /** Makes completed steps buttons that navigate back to them. */
  onStepPress?: (id: string) => void;
  /** Accessible name of the list. */
  'aria-label'?: string;
  /** Read after a completed step's label by screen readers ("Details, completed"). */
  completedLabel?: string;
  /** Words used in the narrow summary "Step 2 of 3". */
  stepLabel?: string;
  ofLabel?: string;
}

/**
 * Progress through a multi-step flow. Renders an ordered list with `aria-current="step"` on the current step.
 * Horizontal steps collapse to "Step 2 of 3 · Upload" plus a segmented bar when their container is too narrow
 * (under 480px for up to 3 steps, 640px for more).
 */
export function Steps({
  steps,
  current,
  orientation = 'horizontal',
  onStepPress,
  'aria-label': ariaLabel = 'Progress',
  completedLabel = 'completed',
  stepLabel = 'Step',
  ofLabel = 'of',
  className,
  ...rest
}: StepsProps): JSX.Element {
  const { locale } = useLocale();
  const nf = useMemo(() => new Intl.NumberFormat(locale), [locale]);
  const currentIndex = Math.max(0, steps.findIndex((s) => s.id === current));
  const status = (i: number): StepStatus => (i < currentIndex ? 'complete' : i === currentIndex ? 'current' : 'upcoming');
  const currentStep = steps[currentIndex];

  return (
    <div
      {...rest}
      className={cx(styles.root, className)}
      data-orientation={orientation}
      data-size={steps.length <= 3 ? 'sm' : 'lg'}
    >
      <ol className={styles.list} aria-label={ariaLabel}>
        {steps.map((step, i) => {
          const s = status(i);
          const body = (
            <>
              <span className={styles.marker} aria-hidden="true">
                {s === 'complete' ? <IconCheck size="1.15em" stroke={2.25} /> : nf.format(i + 1)}
              </span>
              <span className={styles.label}>
                {step.label}
                {s === 'complete' && <span className={styles.srOnly}>, {completedLabel}</span>}
              </span>
              {step.description != null && <span className={styles.description}>{step.description}</span>}
            </>
          );
          return (
            <li key={step.id} className={styles.step} data-status={s} aria-current={s === 'current' ? 'step' : undefined}>
              {s === 'complete' && onStepPress ? (
                <RACButton className={cx(styles.body, styles.button)} onPress={() => onStepPress(step.id)}>
                  {body}
                </RACButton>
              ) : (
                <div className={styles.body}>{body}</div>
              )}
              {i < steps.length - 1 && <span className={styles.connector} aria-hidden="true" />}
            </li>
          );
        })}
      </ol>

      {orientation === 'horizontal' && currentStep && (
        <div className={styles.compact}>
          <p className={styles.summary}>
            <span className={styles.summaryCount}>
              {stepLabel} {nf.format(currentIndex + 1)} {ofLabel} {nf.format(steps.length)}
            </span>
            <span className={styles.summaryDot} aria-hidden="true">
              ·
            </span>
            <span className={styles.summaryLabel}>{currentStep.label}</span>
          </p>
          <span className={styles.segments} aria-hidden="true">
            {steps.map((step, i) => (
              <span key={step.id} className={styles.segment} data-status={status(i)} />
            ))}
          </span>
        </div>
      )}
    </div>
  );
}

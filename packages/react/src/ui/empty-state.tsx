'use client';

import type { HTMLAttributes, JSX, ReactNode, Ref } from 'react';
import styles from './empty-state.module.css';

const cx = (...c: Array<string | false | null | undefined>) => c.filter(Boolean).join(' ');

export interface EmptyStateProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  /** Decorative icon, shown in a tinted tile above the title. */
  icon?: ReactNode;
  title: ReactNode;
  /** One or two sentences: why it's empty and what to do next. */
  description?: ReactNode;
  /** Primary next step, usually a Button (or a Button and a Link). */
  action?: ReactNode;
  /** `sm` for tables, popovers and cards; `md` for whole pages or sections. */
  size?: 'sm' | 'md';
  /** Heading level of the title. */
  level?: 2 | 3 | 4 | 5 | 6;
  ref?: Ref<HTMLDivElement>;
}

/** What to show when there is nothing to show — no data yet, no results, or nothing left to do. */
export function EmptyState({
  icon,
  title,
  description,
  action,
  size = 'md',
  level = 3,
  className,
  children,
  ...rest
}: EmptyStateProps): JSX.Element {
  const Heading = `h${level}` as const;
  return (
    <div {...rest} data-size={size} className={cx(styles.empty, className)}>
      {icon != null && icon !== false && (
        <div className={styles.icon} aria-hidden="true">
          {icon}
        </div>
      )}
      <div className={styles.text}>
        <Heading className={styles.title}>{title}</Heading>
        {description != null && description !== false && <p className={styles.description}>{description}</p>}
      </div>
      {children}
      {action != null && action !== false && <div className={styles.action}>{action}</div>}
    </div>
  );
}

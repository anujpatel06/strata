import Link from 'next/link';
import type { ReactNode } from 'react';
import styles from './button-link.module.css';

/**
 * A link that looks like a Strata Button (primary / outline / ghost). Navigation belongs on <a>, so this is
 * a styled next/link rather than a <button>; it reads the same tokens as Button.
 */
export function ButtonLink({
  href,
  variant = 'primary',
  children,
}: {
  href: string;
  variant?: 'primary' | 'outline' | 'ghost';
  children: ReactNode;
}) {
  const external = /^https?:/.test(href);
  if (external) {
    return (
      <a href={href} className={styles.link} data-variant={variant} rel="noreferrer">
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={styles.link} data-variant={variant}>
      {children}
    </Link>
  );
}

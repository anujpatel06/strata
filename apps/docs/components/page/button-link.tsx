import Link from 'next/link';
import type { ReactNode } from 'react';
import styles from './button-link.module.css';

/**
 * A link that looks like a Syntara Button (primary / outline / ghost). Navigation belongs on <a>, so this is
 * a styled next/link rather than a <button>; it reads the same tokens as Button.
 *
 * `inverse` is the site's own marketing CTA: surface.inverse + text.inverse (a pair the engine checks), so it's
 * near-black on a light page and near-white on a dark one whatever the house primary is. `size="lg"` is the
 * tall, fully rounded marketing size used on the homepage.
 */
export function ButtonLink({
  href,
  variant = 'primary',
  size = 'md',
  children,
}: {
  href: string;
  variant?: 'primary' | 'inverse' | 'outline' | 'ghost';
  size?: 'md' | 'lg';
  children: ReactNode;
}) {
  const external = /^https?:/.test(href);
  if (external) {
    return (
      <a href={href} className={styles.link} data-variant={variant} data-size={size} rel="noreferrer">
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={styles.link} data-variant={variant} data-size={size}>
      {children}
    </Link>
  );
}

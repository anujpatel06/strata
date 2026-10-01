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
 *
 * `theme` paints the link in another tenant's tokens. The attribute goes on the link itself rather than on a
 * wrapper, because a wrapper would become a flex item of whatever row the button sits in and would shift the
 * nth-child selectors that stagger the homepage hero's entrance. `data-syntara-scheme="site"` keeps the link on
 * the page's own light/dark: it is standing on the site's canvas, not inside a themed preview.
 */
export function ButtonLink({
  href,
  variant = 'primary',
  size = 'md',
  theme,
  children,
}: {
  href: string;
  variant?: 'primary' | 'inverse' | 'outline' | 'ghost';
  size?: 'md' | 'lg';
  /** A data-syntara-theme id. Omitted, the link uses whatever theme it is sitting in. */
  theme?: string;
  children: ReactNode;
}) {
  const themeProps = theme ? { 'data-syntara-theme': theme, 'data-syntara-scheme': 'site' } : undefined;
  const external = /^https?:/.test(href);
  if (external) {
    return (
      <a href={href} className={styles.link} data-variant={variant} data-size={size} rel="noreferrer" {...themeProps}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={styles.link} data-variant={variant} data-size={size} {...themeProps}>
      {children}
    </Link>
  );
}

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MAIN_NAV, activeMainNav } from '@/lib/site';
import styles from './site-header.module.css';

export function MainNav() {
  const pathname = usePathname() ?? '/';
  const active = activeMainNav(pathname);
  return (
    <nav aria-label="Main" className={styles.mainNav}>
      <ul className={styles.mainNavList}>
        {MAIN_NAV.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className={styles.mainNavLink}
              aria-current={active === item.href ? 'page' : undefined}
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

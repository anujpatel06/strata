'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';
import type { NavGroup } from '@/lib/nav';
import styles from './docs-sidebar.module.css';

export function DocsSidebar({ groups }: { groups: NavGroup[] }) {
  const pathname = usePathname() ?? '';
  const ref = useRef<HTMLElement>(null);

  // Keep the current page in view when the sidebar is taller than the viewport.
  useEffect(() => {
    const current = ref.current?.querySelector<HTMLElement>('[aria-current="page"]');
    const scroller = ref.current?.parentElement;
    if (!current || !scroller) return;
    const top = current.offsetTop - scroller.offsetTop;
    if (top < scroller.scrollTop || top > scroller.scrollTop + scroller.clientHeight - current.offsetHeight) {
      scroller.scrollTop = top - scroller.clientHeight / 3;
    }
  }, [pathname]);

  return (
    <nav ref={ref} aria-label="Docs" className={styles.nav}>
      {groups.map((group) => (
        <div key={group.label} className={styles.group}>
          <p className={styles.groupLabel}>{group.label}</p>
          {group.sections.map((section, i) => (
            <div key={section.label ?? i} className={styles.section}>
              {section.label && <p className={styles.sectionLabel}>{section.label}</p>}
              <ul className={styles.list}>
                {section.items.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={styles.link}
                      aria-current={pathname === item.href ? 'page' : undefined}
                    >
                      <span className={styles.linkText}>{item.title}</span>
                      {item.badge && <span className={styles.badge}>{item.badge}</span>}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      ))}
    </nav>
  );
}

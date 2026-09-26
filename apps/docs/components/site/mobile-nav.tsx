'use client';

import { IconMenu2 } from '@tabler/icons-react';
import { Button, DialogTrigger, Sheet } from '@strata/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MAIN_NAV, activeMainNav } from '@/lib/site';
import type { NavGroup } from '@/lib/nav';
import styles from './mobile-nav.module.css';

/** Below 768px the header nav and the docs sidebar move into a sheet from the start edge. */
export function MobileNav({ groups }: { groups: NavGroup[] }) {
  const pathname = usePathname() ?? '/';
  const active = activeMainNav(pathname);
  return (
    <DialogTrigger>
      <Button variant="ghost" size="icon" aria-label="Open menu" className={styles.trigger}>
        <IconMenu2 aria-hidden stroke={1.75} />
      </Button>
      <Sheet side="start" title="Menu" className={styles.sheet}>
        {({ close }) => (
          <div className={styles.content}>
            <nav aria-label="Main">
              <ul className={styles.list}>
                {MAIN_NAV.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={close}
                      className={styles.primaryLink}
                      aria-current={active === item.href ? 'page' : undefined}
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
            <nav aria-label="Docs" className={styles.docs}>
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
                              onClick={close}
                              className={styles.link}
                              aria-current={pathname === item.href ? 'page' : undefined}
                            >
                              {item.title}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              ))}
            </nav>
          </div>
        )}
      </Sheet>
    </DialogTrigger>
  );
}

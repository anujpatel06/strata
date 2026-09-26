'use client';

import { useEffect, useState } from 'react';
import type { TocItem } from '@/lib/toc';
import styles from './toc.module.css';

/** "On this page": headings of the current page; the one being read is highlighted. */
export function Toc({ items }: { items: TocItem[] }) {
  const [active, setActive] = useState<string | undefined>(items[0]?.id);

  useEffect(() => {
    const headings = items
      .map((item) => document.getElementById(item.id))
      .filter((el): el is HTMLElement => el != null);
    if (headings.length === 0) return;

    // The active heading is the last one whose top has scrolled past a line just under the sticky header.
    const update = () => {
      const line = parseFloat(getComputedStyle(document.documentElement).scrollPaddingBlockStart || '0') + 8;
      let current = headings[0]!.id;
      for (const h of headings) {
        if (h.getBoundingClientRect().top <= line) current = h.id;
        else break;
      }
      const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;
      setActive(atBottom ? headings[headings.length - 1]!.id : current);
    };
    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [items]);

  if (items.length === 0) return null;
  return (
    <nav aria-labelledby="toc-heading" className={styles.toc}>
      <p id="toc-heading" className={styles.heading}>
        On this page
      </p>
      <ul className={styles.list}>
        {items.map((item) => (
          <li key={item.id} data-depth={item.depth}>
            <a href={`#${item.id}`} className={styles.link} aria-current={active === item.id ? 'location' : undefined}>
              {item.title}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

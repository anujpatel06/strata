'use client';

/**
 * The component gallery on the homepage: a row of category chips with counts, then the components in the
 * selected category. "All" is first and carries the total.
 *
 * Client-side because the filter is the point — the whole set is in the markup either way, so nothing here
 * changes what a crawler or a reader without JavaScript sees; the chips just stop being useful.
 */

import { Badge } from '@syntara/react';
import Link from 'next/link';
import { useState } from 'react';
import styles from './sections.module.css';

export interface FilterItem {
  name: string;
  title: string;
  category: string;
  categoryLabel: string;
  maturity: string;
}

const ALL = 'All';

export function ComponentFilter({ items, initial }: { items: readonly FilterItem[]; initial?: string }) {
  const categories: { key: string; label: string; count: number }[] = [];
  for (const i of items) {
    const found = categories.find((c) => c.key === i.category);
    if (found) found.count += 1;
    else categories.push({ key: i.category, label: i.categoryLabel, count: 1 });
  }
  const chips = [{ key: ALL, label: ALL, count: items.length }, ...categories];
  const [active, setActive] = useState(initial && chips.some((c) => c.key === initial) ? initial : ALL);
  const shown = active === ALL ? items : items.filter((i) => i.category === active);

  return (
    <>
      {/* A radiogroup, not a list of buttons: it is one choice out of several, and arrow keys should move it. */}
      <div className={styles.filterRow} role="radiogroup" aria-label="Filter components by category">
        {chips.map((c) => (
          <button
            key={c.key}
            type="button"
            role="radio"
            aria-checked={c.key === active}
            className={styles.filterChip}
            data-active={c.key === active ? 'true' : undefined}
            onClick={() => setActive(c.key)}
          >
            {c.label}
            <span className={styles.filterCount}>{c.count}</span>
          </button>
        ))}
      </div>
      <ul className={styles.componentGrid}>
        {shown.map((c) => (
          <li key={c.name}>
            <Link href={`/docs/components/${c.name}`} className={styles.componentChip}>
              <span className={styles.componentName}>{c.title}</span>
              {c.maturity !== 'stable' && (
                <Badge size="sm" tone="neutral" variant="outline">
                  {c.maturity}
                </Badge>
              )}
            </Link>
          </li>
        ))}
      </ul>
      <p className={styles.filterCountNote} aria-live="polite">
        Showing {shown.length} of {items.length}
        {active !== ALL ? ` · ${chips.find((c) => c.key === active)?.label}` : ''}
      </p>
    </>
  );
}

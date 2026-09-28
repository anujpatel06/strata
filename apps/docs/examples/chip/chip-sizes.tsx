'use client';

import { Chip, ChipGroup } from '@syntara/react';

// md is the control height (next to a Button or TextField); sm is one step smaller. wrap={false} keeps one scrolling row.
export default function Example() {
  const statuses = ['Submitted', 'In review', 'Approved', 'Paid', 'Rejected', 'Withdrawn'];
  return (
    <div style={{ display: 'grid', gap: 'var(--syntara-space-4)', inlineSize: '100%', minInlineSize: 0 }}>
      <ChipGroup aria-label="Status, medium" defaultSelectedKeys={['Approved']}>
        {statuses.slice(0, 4).map((s) => <Chip key={s} id={s}>{s}</Chip>)}
      </ChipGroup>
      <ChipGroup aria-label="Status, small" size="sm" defaultSelectedKeys={['Approved']}>
        {statuses.slice(0, 4).map((s) => <Chip key={s} id={s}>{s}</Chip>)}
      </ChipGroup>
      <ChipGroup aria-label="Status, one row" size="sm" wrap={false} disabledKeys={['Withdrawn']}>
        {statuses.map((s) => <Chip key={s} id={s}>{s}</Chip>)}
      </ChipGroup>
    </div>
  );
}

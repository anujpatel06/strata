'use client';

import { PersonChip, PersonChipGroup } from '@strata/react';

export default function Example() {
  return (
    <div style={{ display: 'grid', gap: 'var(--strata-space-2)' }}>
      <PersonChipGroup aria-label="Covered members">
        <PersonChip name="Arjun Shah" />
        <PersonChip name="Priya Shah" />
        <PersonChip name="Aarav Shah" />
        <PersonChip name="Father" placeholder />
      </PersonChipGroup>
      <p style={{ margin: 0, fontSize: 'var(--strata-font-size-sm)', color: 'var(--strata-color-text-subtle)' }}>
        Father isn&rsquo;t added yet. He can still use network rates.
      </p>
    </div>
  );
}

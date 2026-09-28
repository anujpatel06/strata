'use client';

import { PersonChip, PersonChipGroup } from '@syntara/react';

export default function Example() {
  return (
    <div style={{ display: 'grid', gap: 'var(--syntara-space-2)' }}>
      <PersonChipGroup aria-label="Covered members">
        <PersonChip name="Arjun Shah" />
        <PersonChip name="Priya Shah" />
        <PersonChip name="Aarav Shah" />
        <PersonChip name="Father" placeholder />
      </PersonChipGroup>
      <p style={{ margin: 0, fontSize: 'var(--syntara-font-size-sm)', color: 'var(--syntara-color-text-subtle)' }}>
        Father isn&rsquo;t added yet. He can still use network rates.
      </p>
    </div>
  );
}

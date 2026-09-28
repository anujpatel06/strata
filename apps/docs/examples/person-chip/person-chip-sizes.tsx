'use client';

import { PersonChip, PersonChipGroup } from '@syntara/react';

export default function Example() {
  return (
    <div style={{ display: 'grid', gap: 'var(--syntara-space-3)', justifyItems: 'start' }}>
      <PersonChipGroup aria-label="Reviewers" size="md">
        <PersonChip name="Daniel Okafor" />
        <PersonChip name="Mei Lin" />
        <PersonChip name="Spouse" placeholder />
      </PersonChipGroup>
      <PersonChipGroup aria-label="Reviewers, compact" size="sm">
        <PersonChip name="Daniel Okafor" />
        <PersonChip name="Mei Lin" />
        <PersonChip name="Spouse" placeholder />
      </PersonChipGroup>
    </div>
  );
}

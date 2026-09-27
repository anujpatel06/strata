'use client';

import { PersonChip, PersonChipGroup } from '@strata/react';

export default function Example() {
  return (
    <div style={{ display: 'grid', gap: 'var(--strata-space-3)', justifyItems: 'start' }}>
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

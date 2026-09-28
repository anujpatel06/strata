'use client';

import { ToggleButton, ToggleButtonGroup } from '@syntara/react';

export default function Example() {
  return (
    <div style={{ display: 'grid', gap: 16, justifyItems: 'center' }}>
      <ToggleButtonGroup size="sm" aria-label="Status (small)" defaultSelectedKeys={['open']} disallowEmptySelection>
        <ToggleButton id="all">All</ToggleButton>
        <ToggleButton id="open">Open</ToggleButton>
        <ToggleButton id="closed">Closed</ToggleButton>
      </ToggleButtonGroup>
      <ToggleButtonGroup size="md" aria-label="Status (medium)" defaultSelectedKeys={['open']} disallowEmptySelection>
        <ToggleButton id="all">All</ToggleButton>
        <ToggleButton id="open">Open</ToggleButton>
        <ToggleButton id="closed">Closed</ToggleButton>
      </ToggleButtonGroup>
    </div>
  );
}

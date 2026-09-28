'use client';

import { useState } from 'react';
import { Chip, ChipGroup, type Selection } from '@syntara/react';

// Filter chips with counts. "All" is on when nothing else is: picking a category turns it off, clearing them turns it back on.
export default function Example() {
  const [keys, setKeys] = useState<Set<string>>(new Set(['all']));
  const onChange = (next: Selection) => {
    const picked = new Set([...(next === 'all' ? [] : next)].map(String));
    const added = [...picked].find((k) => !keys.has(k));
    if (added === 'all' || picked.size === 0) setKeys(new Set(['all']));
    else setKeys(new Set([...picked].filter((k) => k !== 'all')));
  };
  return (
    <ChipGroup label="Benefits" selectedKeys={keys} onSelectionChange={onChange}>
      <Chip id="all" count={10}>All</Chip>
      <Chip id="sponsored" count={3}>Sponsored</Chip>
      <Chip id="discounted" count={2}>Discounted</Chip>
      <Chip id="consults" count={4}>Consults</Chip>
    </ChipGroup>
  );
}

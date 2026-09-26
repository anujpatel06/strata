'use client';

import { useState } from 'react';
import type { Key } from 'react-aria-components';
import { Select, SelectItem } from '@strata/react';

const statuses = [
  { id: 'open', name: 'Open' },
  { id: 'in-review', name: 'In review' },
  { id: 'approved', name: 'Approved' },
  { id: 'closed', name: 'Closed' },
];

export default function Example() {
  const [status, setStatus] = useState<Key | null>('in-review');
  return (
    <div style={{ display: 'grid', gap: 12, inlineSize: '100%', maxInlineSize: 320 }}>
      <Select label="Status" items={statuses} selectedKey={status} onSelectionChange={setStatus}>
        {(item) => <SelectItem id={item.id}>{item.name}</SelectItem>}
      </Select>
      <p style={{ margin: 0, fontSize: 'var(--strata-font-size-sm)', color: 'var(--strata-color-text-subtle)' }}>
        Selected key: {String(status)}
      </p>
    </div>
  );
}

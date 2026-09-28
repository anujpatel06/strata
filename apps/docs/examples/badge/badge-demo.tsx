'use client';

import { Badge } from '@syntara/react';

export default function Example() {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--syntara-space-2)', alignItems: 'center' }}>
      <Badge>Draft</Badge>
      <Badge tone="info">In review</Badge>
      <Badge tone="success">Paid</Badge>
      <Badge tone="warning">Pending</Badge>
      <Badge tone="danger">Rejected</Badge>
      <Badge tone="brand" variant="solid">New</Badge>
    </div>
  );
}

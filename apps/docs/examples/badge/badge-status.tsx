'use client';

import { Badge } from '@strata/react';

/* No chip: a tone dot and the label in body text. The words carry the meaning; the dot is decoration. */
export default function Example() {
  return (
    <div style={{ display: 'grid', gap: 'var(--strata-space-3)', justifyItems: 'start' }}>
      <Badge variant="status" tone="success">Ready to review</Badge>
      <Badge variant="status" tone="info">Processing</Badge>
      <Badge variant="status" tone="warning">Waiting on approval</Badge>
      <Badge variant="status" tone="danger">Build failed</Badge>
      <Badge variant="status" tone="brand">In beta</Badge>
      <Badge variant="status">Archived</Badge>
      <Badge variant="status" tone="success" size="sm">Synced</Badge>
    </div>
  );
}

'use client';

import { IconAlertTriangle, IconCheck, IconClock } from '@syntara/icons';
import { Badge } from '@syntara/react';

export default function Example() {
  return (
    <div style={{ display: 'grid', gap: 'var(--syntara-space-3)', justifyItems: 'start' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--syntara-space-2)' }}>
        <Badge tone="success" icon={<IconCheck />}>Approved</Badge>
        <Badge tone="info" icon={<IconClock />}>Awaiting documents</Badge>
        <Badge tone="warning" icon={<IconAlertTriangle />}>Needs attention</Badge>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--syntara-space-2)' }}>
        <Badge variant="outline" tone="success" dot>Active</Badge>
        <Badge variant="outline" tone="warning" dot>Paused</Badge>
        <Badge variant="outline" dot>Archived</Badge>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--syntara-space-2)', alignItems: 'center' }}>
        <Badge size="sm" tone="brand">Beta</Badge>
        <Badge size="sm" variant="solid" tone="danger">12</Badge>
        <Badge size="sm" tone="neutral">v2.4.0</Badge>
      </div>
    </div>
  );
}

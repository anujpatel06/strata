'use client';

import { Alert } from '@syntara/react';

export default function Example() {
  return (
    <div style={{ display: 'grid', gap: 'var(--syntara-space-4)', inlineSize: '100%', maxInlineSize: 560 }}>
      <Alert tone="info" title="Scheduled maintenance">
        Claims can't be submitted on Sunday between 02:00 and 04:00 UTC. Anything in progress is saved.
      </Alert>
      <Alert title="You can add up to 4 dependants">Spouse, children and parents can share your cover.</Alert>
    </div>
  );
}

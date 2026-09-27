'use client';

import { Tag } from '@strata/react';

export default function Example() {
  return (
    <div style={{ display: 'grid', gap: 'var(--strata-space-3)', justifyItems: 'start' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 'var(--strata-space-2)' }}>
        <Tag size="md">Network clinics</Tag>
        <Tag size="md" tone="success" uppercase>
          Cashless
        </Tag>
        <Tag size="md" variant="dashed">
          Optional add-on
        </Tag>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 'var(--strata-space-1)' }}>
        <Tag size="sm">Network clinics</Tag>
        <Tag size="sm" tone="success" uppercase>
          Cashless
        </Tag>
        <Tag size="sm" variant="dashed">
          Optional add-on
        </Tag>
      </div>
    </div>
  );
}

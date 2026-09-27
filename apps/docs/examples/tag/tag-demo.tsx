'use client';

import { Tag } from '@strata/react';

export default function Example() {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 'var(--strata-space-2)' }}>
      <Tag tone="success" uppercase>
        Cashless
      </Tag>
      <Tag uppercase>Own pocket</Tag>
      <Tag>Prescription required</Tag>
      <Tag>Home collection</Tag>
    </div>
  );
}

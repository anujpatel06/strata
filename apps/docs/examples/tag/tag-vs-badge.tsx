'use client';

import { Badge, Tag } from '@strata/react';

// Tags describe what something is; a Badge says what state it's in.
export default function Example() {
  return (
    <div style={{ display: 'grid', gap: 'var(--strata-space-2)', inlineSize: '100%', maxInlineSize: '24rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--strata-space-3)' }}>
        <span style={{ fontFamily: 'var(--strata-font-heading)', fontSize: 'var(--strata-font-size-lg)' }}>Lab tests</span>
        <Badge tone="success" dot>
          Active
        </Badge>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--strata-space-1)' }}>
        <Tag size="sm" tone="success" uppercase>
          Cashless
        </Tag>
        <Tag size="sm">Home collection</Tag>
        <Tag size="sm">Prescription required</Tag>
      </div>
    </div>
  );
}

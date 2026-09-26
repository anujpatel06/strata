'use client';

import { SkeletonText } from '@strata/react';

export default function Example() {
  return (
    <div style={{ display: 'grid', gap: 'var(--strata-space-6)', inlineSize: '100%', maxInlineSize: 420 }}>
      <SkeletonText lines={4} />
      <div style={{ fontSize: 'var(--strata-font-size-2xl)' }}>
        <SkeletonText lines={1} style={{ inlineSize: '40%' }} />
      </div>
    </div>
  );
}

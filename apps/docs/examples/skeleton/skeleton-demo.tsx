'use client';

import { Skeleton } from '@strata/react';

export default function Example() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--strata-space-4)', inlineSize: '100%', maxInlineSize: 320 }}>
      <Skeleton circle inlineSize={48} />
      <div style={{ display: 'grid', flex: 1, gap: 'var(--strata-space-2)' }}>
        <Skeleton blockSize={14} inlineSize="80%" />
        <Skeleton blockSize={14} inlineSize="55%" />
      </div>
    </div>
  );
}

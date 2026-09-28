'use client';

import { SkeletonText } from '@syntara/react';

export default function Example() {
  return (
    <div style={{ display: 'grid', gap: 'var(--syntara-space-6)', inlineSize: '100%', maxInlineSize: 420 }}>
      <SkeletonText lines={4} />
      <div style={{ fontSize: 'var(--syntara-font-size-2xl)' }}>
        <SkeletonText lines={1} style={{ inlineSize: '40%' }} />
      </div>
    </div>
  );
}

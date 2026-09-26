'use client';

import { Card, CardContent, CardHeader, Skeleton, SkeletonText } from '@strata/react';

export default function Example() {
  return (
    <Card aria-busy="true" style={{ inlineSize: '100%', maxInlineSize: 380 }}>
      <CardHeader>
        <Skeleton blockSize={18} inlineSize="50%" />
        <Skeleton blockSize={12} inlineSize="75%" />
      </CardHeader>
      <CardContent style={{ display: 'grid', gap: 'var(--strata-space-4)' }}>
        <Skeleton blockSize={120} radius="container" />
        <SkeletonText lines={3} />
      </CardContent>
    </Card>
  );
}

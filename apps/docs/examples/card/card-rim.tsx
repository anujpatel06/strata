'use client';

import { Card, CardDescription, CardHeader, CardTitle } from '@strata/react';

export default function Example() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--strata-space-4)', inlineSize: '100%' }}>
      <Card>
        <CardHeader>
          <CardTitle>Without rim</CardTitle>
          <CardDescription>The default hairline edge.</CardDescription>
        </CardHeader>
      </Card>
      <Card rim>
        <CardHeader>
          <CardTitle>With rim</CardTitle>
          <CardDescription>The edge catches light at the top-left.</CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}

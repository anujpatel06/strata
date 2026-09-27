'use client';

import { Card, CardDescription, CardHeader, CardTitle } from '@strata/react';

export default function Example() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--strata-space-4)', inlineSize: '100%' }}>
      <Card>
        <CardHeader>
          <CardTitle>Default</CardTitle>
          <CardDescription>A hairline edge in light; in dark the rim is built in.</CardDescription>
        </CardHeader>
      </Card>
      <Card rim>
        <CardHeader>
          <CardTitle>With rim</CardTitle>
          <CardDescription>The edge catches light at the top-left, in light too.</CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}

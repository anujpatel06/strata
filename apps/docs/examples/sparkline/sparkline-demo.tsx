'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle, Sparkline } from '@strata/react';

export default function Example() {
  return (
    <Card style={{ inlineSize: '100%', maxInlineSize: 320 }}>
      <CardHeader>
        <CardDescription>Monthly recurring revenue</CardDescription>
        <CardTitle>$48,210</CardTitle>
      </CardHeader>
      <CardContent>
        <Sparkline
          aria-label="Up 18% over the last 12 months"
          data={[31, 33, 32, 36, 35, 38, 41, 39, 43, 44, 46, 48]}
          style={{ blockSize: 'var(--strata-space-12)' }}
        />
      </CardContent>
    </Card>
  );
}

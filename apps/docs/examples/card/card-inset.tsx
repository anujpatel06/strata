'use client';

import { Badge, Button, Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@strata/react';
import { IconGitBranch } from '@strata/icons';

const files = [
  { name: 'src/checkout/summary.tsx', change: '+42 −8' },
  { name: 'src/checkout/totals.ts', change: '+11 −3' },
  { name: 'src/checkout/summary.test.tsx', change: '+27' },
];

export default function Example() {
  return (
    <Card style={{ inlineSize: '100%', maxInlineSize: 440 }}>
      <CardHeader>
        <CardTitle>Order summary refactor</CardTitle>
        <CardDescription>
          <IconGitBranch aria-hidden />
          feature/summary · 3 files
        </CardDescription>
      </CardHeader>
      <CardContent variant="inset">
        <ul style={{ display: 'grid', gap: 'var(--strata-space-2)', margin: 0, padding: 0, listStyle: 'none', fontSize: 'var(--strata-font-size-sm)' }}>
          {files.map((f) => (
            <li key={f.name} style={{ display: 'flex', justifyContent: 'space-between', gap: 'var(--strata-space-3)' }}>
              <span dir="ltr" style={{ fontFamily: 'var(--strata-font-mono)', overflowWrap: 'anywhere' }}>{f.name}</span>
              <span dir="ltr" style={{ color: 'var(--strata-color-text-subtle)', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>{f.change}</span>
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter style={{ justifyContent: 'space-between' }}>
        <Badge variant="status" tone="success">Ready to review</Badge>
        <Button variant="contrast">Review</Button>
      </CardFooter>
    </Card>
  );
}

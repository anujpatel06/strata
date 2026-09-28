'use client';

import { Button, Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle, IconTile } from '@syntara/react';
import { IconArrowDownLeft, IconArrowUpRight, IconSparkles } from '@syntara/icons';

export default function Example() {
  return (
    <Card variant="feature" stars style={{ inlineSize: '100%', maxInlineSize: 420 }}>
      <CardHeader>
        <IconTile tint="solid" size="sm" style={{ marginBlockEnd: 'var(--syntara-space-2)' }}>
          <IconSparkles />
        </IconTile>
        <CardTitle level={2}>Your whole portfolio, <em>in one place</em></CardTitle>
        <CardDescription>Track savings, cards and investments together, and move money between them in seconds.</CardDescription>
      </CardHeader>
      <CardContent style={{ fontSize: 'var(--syntara-font-size-3xl)', fontWeight: 'var(--syntara-font-weight-semibold)', fontVariantNumeric: 'tabular-nums', letterSpacing: 'var(--syntara-font-tracking-3xl)' }}>
        ₹4,82,150.00
      </CardContent>
      <CardFooter>
        <Button><IconArrowDownLeft aria-hidden />Deposit</Button>
        <Button variant="secondary"><IconArrowUpRight aria-hidden />Withdraw</Button>
      </CardFooter>
    </Card>
  );
}

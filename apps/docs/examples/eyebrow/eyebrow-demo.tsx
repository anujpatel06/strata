'use client';

import { Button, Card, CardDescription, CardFooter, CardHeader, CardTitle, Eyebrow } from '@strata/react';

export default function Example() {
  return (
    <Card style={{ inlineSize: '100%', maxInlineSize: 400 }}>
      <CardHeader>
        <Eyebrow lead="rule" tone="accent">First time here</Eyebrow>
        <CardTitle level={2}>
          One wallet, <em>three</em> services
        </CardTitle>
        <CardDescription>Consultations, tests and medicines all draw from the same yearly balance.</CardDescription>
      </CardHeader>
      <CardFooter>
        <Button size="sm">Show me around</Button>
        <Button size="sm" variant="ghost">Skip</Button>
      </CardFooter>
    </Card>
  );
}

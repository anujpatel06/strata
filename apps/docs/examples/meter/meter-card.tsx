'use client';

import { Badge, Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle, Meter } from '@syntara/react';

export default function Example() {
  return (
    <Card style={{ inlineSize: '100%', maxInlineSize: 380 }}>
      <CardHeader>
        <CardTitle>
          In-clinic <em>consultation</em>
        </CardTitle>
        <CardDescription>GP, specialist or a second opinion</CardDescription>
        <CardAction>
          <Badge size="sm" tone="success">Cashless</Badge>
        </CardAction>
      </CardHeader>
      <CardContent>
        <Meter
          variant="card"
          aria-label="Consultation spend"
          value={2600}
          maxValue={18000}
          valueLabel="₹2,600 used"
          caption="from ₹18K wallet"
        />
      </CardContent>
    </Card>
  );
}

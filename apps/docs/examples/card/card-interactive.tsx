'use client';

import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@strata/react';

const plans = [
  { id: 'health', title: 'Health cover', text: 'Hospital stays, day care and check-ups for the family.', status: 'Popular' },
  { id: 'travel', title: 'Travel cover', text: 'Medical emergencies, lost bags and trip delays abroad.', status: 'New' },
];

export default function Example() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--strata-space-4)', inlineSize: '100%' }}>
      {plans.map((plan) => (
        <Card key={plan.id} interactive>
          <CardHeader>
            <CardTitle>
              <a href={`#${plan.id}`}>{plan.title}</a>
            </CardTitle>
            <CardDescription>{plan.text}</CardDescription>
          </CardHeader>
          <CardContent>
            <Badge tone="brand">{plan.status}</Badge>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

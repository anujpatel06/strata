'use client';

import { IconSearch } from '@syntara/icons';
import { Button, Card, CardDescription, CardHeader, CardTitle, EmptyState } from '@syntara/react';

export default function Example() {
  return (
    <Card style={{ inlineSize: '100%', maxInlineSize: 520 }}>
      <CardHeader divider>
        <CardTitle>Transactions</CardTitle>
        <CardDescription>Filtered by: Pharmacy · Last 30 days</CardDescription>
      </CardHeader>
      <EmptyState
        size="sm"
        icon={<IconSearch />}
        title="No matching transactions"
        description="Try a wider date range or remove a filter."
        action={<Button variant="outline" size="sm">Clear filters</Button>}
      />
    </Card>
  );
}

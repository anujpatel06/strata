'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@syntara/react';

const variants = [
  { variant: 'default', title: 'Default', text: 'Raised surface with a border and shadow.' },
  { variant: 'outline', title: 'Outline', text: 'Border only, for dense layouts.' },
  { variant: 'ghost', title: 'Ghost', text: 'No chrome, keeps the spacing.' },
] as const;

export default function Example() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 'var(--syntara-space-4)', inlineSize: '100%' }}>
      {variants.map(({ variant, title, text }) => (
        <Card key={variant} variant={variant}>
          <CardHeader>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{text}</CardDescription>
          </CardHeader>
          <CardContent style={{ fontSize: 'var(--syntara-font-size-sm)' }}>variant=&quot;{variant}&quot;</CardContent>
        </Card>
      ))}
    </div>
  );
}

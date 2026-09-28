'use client';

import { Badge, Eyebrow } from '@syntara/react';

export default function Example() {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--syntara-space-3)', inlineSize: '100%', maxInlineSize: 360 }}>
      <Eyebrow as="span">Wed · 20 May</Eyebrow>
      <Badge size="sm" tone="success">Cashless</Badge>
    </div>
  );
}

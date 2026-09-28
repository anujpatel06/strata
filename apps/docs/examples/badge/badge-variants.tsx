'use client';

import { Badge, type BadgeTone, type BadgeVariant } from '@syntara/react';

const tones: BadgeTone[] = ['neutral', 'brand', 'info', 'success', 'warning', 'danger'];
const variants: BadgeVariant[] = ['soft', 'solid', 'outline'];

export default function Example() {
  return (
    <div style={{ display: 'grid', gap: 'var(--syntara-space-3)' }}>
      {variants.map((variant) => (
        <div key={variant} style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--syntara-space-2)' }}>
          {tones.map((tone) => (
            <Badge key={tone} tone={tone} variant={variant}>
              {tone[0]!.toUpperCase() + tone.slice(1)}
            </Badge>
          ))}
        </div>
      ))}
    </div>
  );
}

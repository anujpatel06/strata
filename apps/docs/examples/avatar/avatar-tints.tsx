'use client';

import { Avatar } from '@syntara/react';

const tints = ['brand', 'accent', 'info', 'success', 'warning', 'danger', 'none'] as const;

export default function Example() {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 'var(--syntara-space-3)' }}>
      {tints.map((tint) => (
        <Avatar key={tint} name="Lena Fischer" tint={tint} size="lg" alt={`Lena Fischer (${tint})`} />
      ))}
    </div>
  );
}

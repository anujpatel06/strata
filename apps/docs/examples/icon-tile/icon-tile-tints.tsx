'use client';

import { IconTile } from '@syntara/react';
import { IconStar } from '@syntara/icons';

const tints = ['solid', 'brand', 'accent', 'info', 'success', 'warning', 'danger', 'none'] as const;

export default function Example() {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--syntara-space-4)' }}>
      {tints.map((tint) => (
        <div key={tint} style={{ display: 'grid', justifyItems: 'center', gap: 'var(--syntara-space-1)', fontSize: 'var(--syntara-font-size-xs)', color: 'var(--syntara-color-text-subtle)' }}>
          <IconTile tint={tint}><IconStar /></IconTile>
          {tint}
        </div>
      ))}
    </div>
  );
}

'use client';

import { IconTile } from '@strata/react';
import { IconStar } from '@strata/icons';

const tints = ['solid', 'brand', 'accent', 'info', 'success', 'warning', 'danger', 'none'] as const;

export default function Example() {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--strata-space-4)' }}>
      {tints.map((tint) => (
        <div key={tint} style={{ display: 'grid', justifyItems: 'center', gap: 'var(--strata-space-1)', fontSize: 'var(--strata-font-size-xs)', color: 'var(--strata-color-text-subtle)' }}>
          <IconTile tint={tint}><IconStar /></IconTile>
          {tint}
        </div>
      ))}
    </div>
  );
}

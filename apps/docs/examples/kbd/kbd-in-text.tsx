'use client';

import { Kbd, KbdGroup } from '@strata/react';

const text = { margin: 0, color: 'var(--strata-color-text-subtle)', fontSize: 'var(--strata-font-size-sm)' };

export default function Example() {
  return (
    <div style={{ display: 'grid', gap: 'var(--strata-space-3)' }}>
      <p style={text}>
        Press <Kbd>/</Kbd> to search claims, or{' '}
        <KbdGroup>
          <Kbd>⌘</Kbd>
          <Kbd>K</Kbd>
        </KbdGroup>{' '}
        to open the command menu.
      </p>
      <p style={text}>
        Use <Kbd>↑</Kbd> <Kbd>↓</Kbd> to move between rows and <Kbd>Space</Kbd> to select.
      </p>
    </div>
  );
}

'use client';

import { Avatar } from '@syntara/react';

export default function Example() {
  return (
    <div style={{ display: 'grid', gap: 'var(--syntara-space-4)', justifyItems: 'center' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--syntara-space-3)' }}>
        <Avatar name="Arjun Mehta" size="sm" />
        <Avatar name="Arjun Mehta" size="md" />
        <Avatar name="Arjun Mehta" size="lg" />
        <Avatar name="Arjun Mehta" size="lg" shape="square" />
      </div>
      {/* Beside a visible name, hide the avatar from screen readers with alt="". */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--syntara-space-3)' }}>
        <Avatar name="نور الهدى" alt="" size="lg" />
        <div style={{ display: 'grid' }}>
          <span style={{ fontWeight: 'var(--syntara-font-weight-medium)' }}>نور الهدى</span>
          <span style={{ color: 'var(--syntara-color-text-subtle)', fontSize: 'var(--syntara-font-size-sm)' }}>Policy holder</span>
        </div>
      </div>
    </div>
  );
}

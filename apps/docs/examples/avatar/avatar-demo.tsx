'use client';

import { Avatar } from '@strata/react';

// A stand-in photo (inline SVG) so the example works offline.
const photo =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" fill="#c9d6e3"/><circle cx="32" cy="26" r="12" fill="#8a9bb0"/><path d="M10 64c2-14 11-21 22-21s20 7 22 21z" fill="#8a9bb0"/></svg>',
  );

export default function Example() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--strata-space-4)' }}>
      <Avatar name="Priya Raman" src={photo} />
      <Avatar name="Daniel Okafor" />
      <Avatar name="Mei Lin" />
      <Avatar name="Omar Haddad" shape="square" />
      {/* A broken image falls back to initials. */}
      <Avatar name="Sofia Duarte" src="/does-not-exist.jpg" />
    </div>
  );
}

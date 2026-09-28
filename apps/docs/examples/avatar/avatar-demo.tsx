'use client';

import { Avatar } from '@syntara/react';

// A stand-in photo (inline SVG) so the example works offline.
const photo =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" fill="#c9d6e3"/><circle cx="32" cy="26" r="12" fill="#8a9bb0"/><path d="M10 64c2-14 11-21 22-21s20 7 22 21z" fill="#8a9bb0"/></svg>',
  );

export default function Example() {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 'var(--syntara-space-4)' }}>
      <Avatar name="Priya Raman" src={photo} size="lg" />
      {/* Each name hashes to its own tint, so a person keeps their colour everywhere. */}
      <Avatar name="Arjun Shah" size="lg" />
      <Avatar name="Meera Iyer" size="lg" />
      <Avatar name="Daniel Okafor" size="lg" />
      <Avatar name="Omar Haddad" size="lg" shape="square" />
      {/* A broken image falls back to initials. */}
      <Avatar name="Sofia Duarte" src="/does-not-exist.jpg" size="lg" />
    </div>
  );
}

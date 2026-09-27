'use client';

import { IconTile } from '@strata/react';

// A merchant logo as an image. Logos bring their own colours, so an image tile defaults to the neutral face.
const logo =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="11" fill="#e8590c"/><path d="M7 12.5l3 3 7-7" stroke="#fff" stroke-width="2.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>');

export default function Example() {
  return (
    <div style={{ display: 'flex', gap: 'var(--strata-space-3)' }}>
      <IconTile src={logo} alt="Corner Grocer" size="lg" />
      <IconTile src={logo} alt="Corner Grocer" size="lg" tint="warning" />
    </div>
  );
}

'use client';

import { IconTile } from '@strata/react';
import { IconWallet } from '@strata/icons';

export default function Example() {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 'var(--strata-space-3)' }}>
      <IconTile size="sm"><IconWallet /></IconTile>
      <IconTile size="md"><IconWallet /></IconTile>
      <IconTile size="lg"><IconWallet /></IconTile>
      <IconTile size="sm" tint="solid"><IconWallet /></IconTile>
      <IconTile size="md" tint="solid"><IconWallet /></IconTile>
      <IconTile size="lg" tint="solid"><IconWallet /></IconTile>
    </div>
  );
}

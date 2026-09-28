'use client';

import { IconTile } from '@syntara/react';
import { IconBuildingBank, IconCreditCard, IconSparkles, IconTrendingUp, IconWallet } from '@syntara/icons';

export default function Example() {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--syntara-space-3)' }}>
      <IconTile tint="solid"><IconSparkles /></IconTile>
      <IconTile><IconWallet /></IconTile>
      <IconTile tint="accent"><IconCreditCard /></IconTile>
      <IconTile tint="info"><IconBuildingBank /></IconTile>
      <IconTile tint="success"><IconTrendingUp /></IconTile>
    </div>
  );
}

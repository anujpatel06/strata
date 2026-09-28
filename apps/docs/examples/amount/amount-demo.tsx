'use client';

import { Amount, Eyebrow } from '@syntara/react';
import { IconWallet } from '@syntara/icons';

export default function Example() {
  return (
    <div style={{ display: 'grid', gap: 'var(--syntara-space-2)' }}>
      <Eyebrow icon={<IconWallet />}>Wallet · 2026</Eyebrow>
      <Amount value={18000} currency="INR" locale="en-IN" size="xl" />
    </div>
  );
}

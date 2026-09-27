'use client';

import { Amount, Eyebrow } from '@strata/react';
import { IconWallet } from '@strata/icons';

export default function Example() {
  return (
    <div style={{ display: 'grid', gap: 'var(--strata-space-2)' }}>
      <Eyebrow icon={<IconWallet />}>Wallet · 2026</Eyebrow>
      <Amount value={18000} currency="INR" locale="en-IN" size="xl" />
    </div>
  );
}

'use client';

import { Eyebrow } from '@syntara/react';
import { IconShieldCheck, IconWallet } from '@syntara/icons';

export default function Example() {
  return (
    <div style={{ display: 'grid', gap: 'var(--syntara-space-4)' }}>
      <Eyebrow>Plan details</Eyebrow>
      <Eyebrow lead="rule">How it works</Eyebrow>
      <Eyebrow icon={<IconWallet />}>Wallet · 2026</Eyebrow>
      <Eyebrow icon={<IconShieldCheck />}>Covered by your employer</Eyebrow>
    </div>
  );
}

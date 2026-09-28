'use client';

import { IconTile } from '@syntara/react';
import { IconBuildingBank, IconCreditCard, IconWallet } from '@syntara/icons';

const accounts = [
  { name: 'Everyday account', detail: 'Savings · 4821', amount: '₹84,250.00', icon: <IconBuildingBank /> },
  { name: 'Travel card', detail: 'Credit · 0917', amount: '₹12,400.50', icon: <IconCreditCard /> },
  { name: 'Emergency fund', detail: 'Deposit · 3306', amount: '₹2,00,000.00', icon: <IconWallet /> },
];

/** tint="auto" gives each account a stable colour from its name. The tile is decorative: the name sits beside it. */
export default function Example() {
  return (
    <ul style={{ display: 'grid', gap: 'var(--syntara-space-4)', inlineSize: '100%', maxInlineSize: 380, margin: 0, padding: 0, listStyle: 'none' }}>
      {accounts.map((a) => (
        <li key={a.name} style={{ display: 'flex', alignItems: 'center', gap: 'var(--syntara-space-3)' }}>
          <IconTile tint="auto" name={a.name}>{a.icon}</IconTile>
          <div style={{ display: 'grid', flex: 1, fontSize: 'var(--syntara-font-size-sm)' }}>
            <span style={{ fontWeight: 'var(--syntara-font-weight-medium)' }}>{a.name}</span>
            <span style={{ color: 'var(--syntara-color-text-subtle)', fontSize: 'var(--syntara-font-size-xs)' }}>{a.detail}</span>
          </div>
          <span style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 'var(--syntara-font-weight-semibold)', fontSize: 'var(--syntara-font-size-sm)' }}>{a.amount}</span>
        </li>
      ))}
    </ul>
  );
}

'use client';

import { IconTile } from '@strata/react';
import { IconBuildingBank, IconCreditCard, IconWallet } from '@strata/icons';

const accounts = [
  { name: 'Everyday account', detail: 'Savings · 4821', amount: '₹84,250.00', icon: <IconBuildingBank /> },
  { name: 'Travel card', detail: 'Credit · 0917', amount: '₹12,400.50', icon: <IconCreditCard /> },
  { name: 'Emergency fund', detail: 'Deposit · 3306', amount: '₹2,00,000.00', icon: <IconWallet /> },
];

/** tint="auto" gives each account a stable colour from its name. The tile is decorative: the name sits beside it. */
export default function Example() {
  return (
    <ul style={{ display: 'grid', gap: 'var(--strata-space-4)', inlineSize: '100%', maxInlineSize: 380, margin: 0, padding: 0, listStyle: 'none' }}>
      {accounts.map((a) => (
        <li key={a.name} style={{ display: 'flex', alignItems: 'center', gap: 'var(--strata-space-3)' }}>
          <IconTile tint="auto" name={a.name}>{a.icon}</IconTile>
          <div style={{ display: 'grid', flex: 1, fontSize: 'var(--strata-font-size-sm)' }}>
            <span style={{ fontWeight: 'var(--strata-font-weight-medium)' }}>{a.name}</span>
            <span style={{ color: 'var(--strata-color-text-subtle)', fontSize: 'var(--strata-font-size-xs)' }}>{a.detail}</span>
          </div>
          <span style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 'var(--strata-font-weight-semibold)', fontSize: 'var(--strata-font-size-sm)' }}>{a.amount}</span>
        </li>
      ))}
    </ul>
  );
}

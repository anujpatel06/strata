'use client';

import { Amount } from '@syntara/react';

const rows = [
  { locale: 'en-IN', currency: 'INR', value: 184250, note: 'Lakh grouping' },
  { locale: 'en-GB', currency: 'GBP', value: 1249.5, note: 'Pence set smaller' },
  { locale: 'de-DE', currency: 'EUR', value: 1249.5, note: 'Sign after the figure' },
  { locale: 'ar-AE', currency: 'AED', value: 18000, note: 'Arabic locale' },
];

export default function Example() {
  return (
    <dl style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', alignItems: 'baseline', gap: 'var(--syntara-space-4) var(--syntara-space-6)', margin: 0 }}>
      {rows.map((r) => (
        <div key={r.locale} style={{ display: 'contents' }}>
          <dt style={{ color: 'var(--syntara-color-text-subtle)', fontSize: 'var(--syntara-font-size-sm)' }}>{r.note}</dt>
          <dd style={{ margin: 0 }}>
            <Amount value={r.value} currency={r.currency} locale={r.locale} size="md" />
          </dd>
        </div>
      ))}
    </dl>
  );
}

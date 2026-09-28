'use client';

import { Meter } from '@syntara/react';

export default function Example() {
  return (
    <div style={{ display: 'grid', gap: 'var(--syntara-space-5)', inlineSize: '100%', maxInlineSize: 360 }}>
      {/* Default: a percentage. */}
      <Meter label="Storage" value={64} />
      {/* Currency, formatted for the locale by React Aria. */}
      <Meter label="Monthly budget" value={1840} maxValue={2500} formatOptions={{ style: 'currency', currency: 'GBP', maximumFractionDigits: 0 }} caption="of £2,500" />
      {/* No visible label: name it with aria-label. */}
      <Meter aria-label="Team seats" value={7} maxValue={10} valueLabel="7 of 10 seats" />
    </div>
  );
}

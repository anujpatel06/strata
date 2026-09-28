'use client';

import { Meter } from '@syntara/react';

export default function Example() {
  return (
    <div style={{ inlineSize: '100%', maxInlineSize: 360 }}>
      <Meter label="Consultations" value={7400} maxValue={18000} valueLabel="₹7,400 used" caption="of ₹18,000" />
    </div>
  );
}

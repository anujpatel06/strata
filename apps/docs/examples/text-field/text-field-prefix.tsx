'use client';

import { TextField } from '@syntara/react';
import { IconAt, IconWorld } from '@syntara/icons';

export default function Example() {
  return (
    <div style={{ display: 'grid', gap: 20, inlineSize: '100%', maxInlineSize: 320 }}>
      <TextField label="Amount" prefix="₹" suffix="INR" inputMode="decimal" placeholder="0.00" />
      <TextField label="Website" prefix={<IconWorld aria-hidden />} placeholder="example.com" />
      <TextField label="Username" prefix={<IconAt aria-hidden />} placeholder="yourname" />
    </div>
  );
}

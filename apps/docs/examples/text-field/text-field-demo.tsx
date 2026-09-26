'use client';

import { TextField } from '@strata/react';

export default function Example() {
  return (
    <TextField
      label="Email"
      type="email"
      placeholder="you@example.com"
      description="We’ll send receipts and claim updates here."
      style={{ inlineSize: '100%', maxInlineSize: 320 }}
    />
  );
}

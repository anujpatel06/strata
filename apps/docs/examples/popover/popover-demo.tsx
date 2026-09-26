'use client';

import { Button, DialogTrigger, Popover, TextField } from '@strata/react';

export default function Example() {
  return (
    <DialogTrigger>
      <Button variant="outline">Set spending limit</Button>
      <Popover placement="bottom start">
        <div style={{ display: 'grid', gap: 'var(--strata-field-gap)', inlineSize: 'calc(var(--strata-space-16) * 4)' }}>
          <div style={{ display: 'grid', gap: 'var(--strata-space-1)' }}>
            <strong style={{ fontWeight: 'var(--strata-font-weight-semibold)' }}>Monthly limit</strong>
            <span style={{ fontSize: 'var(--strata-font-size-sm)', color: 'var(--strata-color-text-subtle)' }}>
              Card payments above this amount are declined.
            </span>
          </div>
          <TextField label="Amount" defaultValue="25,000" prefix="₹" inputMode="numeric" />
          <Button size="sm">Save limit</Button>
        </div>
      </Popover>
    </DialogTrigger>
  );
}

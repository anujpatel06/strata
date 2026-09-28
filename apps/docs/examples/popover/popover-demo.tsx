'use client';

import { Button, DialogTrigger, Popover, TextField } from '@syntara/react';

export default function Example() {
  return (
    <DialogTrigger>
      <Button variant="outline">Set spending limit</Button>
      <Popover placement="bottom start">
        <div style={{ display: 'grid', gap: 'var(--syntara-field-gap)', inlineSize: 'calc(var(--syntara-space-16) * 4)' }}>
          <div style={{ display: 'grid', gap: 'var(--syntara-space-1)' }}>
            <strong style={{ fontWeight: 'var(--syntara-font-weight-semibold)' }}>Monthly limit</strong>
            <span style={{ fontSize: 'var(--syntara-font-size-sm)', color: 'var(--syntara-color-text-subtle)' }}>
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

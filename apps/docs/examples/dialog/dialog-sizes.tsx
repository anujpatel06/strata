'use client';

import { Button, Dialog, DialogTrigger } from '@strata/react';

const sizes = ['sm', 'md', 'lg'] as const;

export default function Example() {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--strata-space-2)' }}>
      {sizes.map((size) => (
        <DialogTrigger key={size}>
          <Button variant="outline">Open {size}</Button>
          <Dialog
            size={size}
            title="Session expiring"
            description="You’ve been inactive for a while. Stay signed in to keep your unsaved changes."
            footer={({ close }) => <Button onPress={close}>Stay signed in</Button>}
          />
        </DialogTrigger>
      ))}
    </div>
  );
}

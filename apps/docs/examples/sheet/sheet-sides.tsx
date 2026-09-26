'use client';

import { Button, DialogTrigger, Sheet } from '@strata/react';

const sides = ['end', 'start', 'top', 'bottom'] as const;

export default function Example() {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--strata-space-2)' }}>
      {sides.map((side) => (
        <DialogTrigger key={side}>
          <Button variant="outline">Open {side}</Button>
          <Sheet side={side} title="Notifications" description="You’re all caught up.">
            <p style={{ margin: 0, color: 'var(--strata-color-text-subtle)' }}>New activity on your account will appear here.</p>
          </Sheet>
        </DialogTrigger>
      ))}
    </div>
  );
}

'use client';

import { Button } from '@syntara/react';
import { IconPlus } from '@syntara/icons';

export default function Example() {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
      <Button>
        <IconPlus aria-hidden />
        New request
      </Button>
      <Button variant="outline">Save draft</Button>
      <Button variant="ghost">Cancel</Button>
    </div>
  );
}

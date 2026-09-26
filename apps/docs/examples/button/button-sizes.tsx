'use client';

import { Button } from '@strata/react';
import { IconSettings } from '@tabler/icons-react';

export default function Example() {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
      <Button size="sm" variant="outline">Small</Button>
      <Button size="md" variant="outline">Medium</Button>
      <Button size="lg" variant="outline">Large</Button>
      <Button size="icon" variant="outline" aria-label="Settings">
        <IconSettings aria-hidden />
      </Button>
    </div>
  );
}

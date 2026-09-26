'use client';

import { useState } from 'react';
import { Button, ToastRegion, toast } from '@strata/react';

export default function Example() {
  const [archived, setArchived] = useState(0);
  return (
    <div style={{ display: 'grid', gap: 'var(--strata-space-2)', justifyItems: 'center' }}>
      <ToastRegion />
      <Button
        variant="outline"
        onPress={() => {
          setArchived((n) => n + 1);
          toast({
            title: 'Claim archived',
            description: 'You can find it under Archived.',
            action: { label: 'Undo', onAction: () => setArchived((n) => n - 1) },
          });
        }}
      >
        Archive claim
      </Button>
      <span style={{ color: 'var(--strata-color-text-subtle)', fontSize: 'var(--strata-font-size-sm)' }}>Archived: {archived}</span>
    </div>
  );
}

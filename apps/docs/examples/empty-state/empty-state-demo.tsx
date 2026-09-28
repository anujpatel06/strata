'use client';

import { IconFileText } from '@syntara/icons';
import { Button, EmptyState } from '@syntara/react';

export default function Example() {
  return (
    <EmptyState
      icon={<IconFileText />}
      title="No claims yet"
      description="When you submit a claim, you can track its status and payments here."
      action={<Button>Start a claim</Button>}
    />
  );
}

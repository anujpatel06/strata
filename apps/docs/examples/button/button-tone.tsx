'use client';

import { Button } from '@strata/react';
import { IconTrash } from '@strata/icons';

export default function Example() {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
      <Button tone="danger">
        <IconTrash aria-hidden />
        Delete account
      </Button>
      <Button variant="outline" tone="danger">
        Remove card
      </Button>
      <Button variant="ghost" tone="danger">
        Discard draft
      </Button>
      <Button variant="outline" tone="danger" isDisabled>
        Remove card
      </Button>
    </div>
  );
}

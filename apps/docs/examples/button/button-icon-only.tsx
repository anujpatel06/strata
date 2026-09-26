'use client';

import { Button } from '@strata/react';
import { IconCopy, IconDotsVertical, IconPencil, IconTrash } from '@tabler/icons-react';

export default function Example() {
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      <Button size="icon" variant="ghost" aria-label="Edit">
        <IconPencil aria-hidden />
      </Button>
      <Button size="icon" variant="ghost" aria-label="Duplicate">
        <IconCopy aria-hidden />
      </Button>
      <Button size="icon" variant="ghost" aria-label="Delete">
        <IconTrash aria-hidden />
      </Button>
      <Button size="icon" variant="outline" aria-label="More actions">
        <IconDotsVertical aria-hidden />
      </Button>
    </div>
  );
}

'use client';

import { Button, Menu, MenuItem, MenuSeparator, MenuTrigger } from '@strata/react';
import { IconArchive, IconCopy, IconDotsVertical, IconPencil, IconTrash } from '@strata/icons';

export default function Example() {
  return (
    <MenuTrigger>
      <Button variant="outline" size="icon" aria-label="Claim actions">
        <IconDotsVertical aria-hidden />
      </Button>
      <Menu onAction={(key) => console.log(key)}>
        <MenuItem id="edit" icon={<IconPencil />}>
          Edit details
        </MenuItem>
        <MenuItem id="duplicate" icon={<IconCopy />}>
          Duplicate
        </MenuItem>
        <MenuItem id="archive" icon={<IconArchive />}>
          Archive
        </MenuItem>
        <MenuSeparator />
        <MenuItem id="delete" icon={<IconTrash />} tone="danger">
          Delete claim
        </MenuItem>
      </Menu>
    </MenuTrigger>
  );
}

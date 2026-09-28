'use client';

import { Button, Menu, MenuItem, MenuSection, MenuSeparator, MenuTrigger } from '@syntara/react';
import { IconChevronDown } from '@syntara/icons';

export default function Example() {
  return (
    <MenuTrigger>
      <Button variant="outline">
        Document
        <IconChevronDown aria-hidden />
      </Button>
      <Menu>
        <MenuSection title="File">
          <MenuItem shortcut="⌘N">New document</MenuItem>
          <MenuItem shortcut="⌘O">Open…</MenuItem>
          <MenuItem shortcut="⌘S">Save</MenuItem>
          <MenuItem shortcut="⇧⌘S" isDisabled>
            Save as…
          </MenuItem>
        </MenuSection>
        <MenuSeparator />
        <MenuSection title="Share">
          <MenuItem description="Anyone with the link can view">Copy link</MenuItem>
          <MenuItem shortcut="⌘P">Print</MenuItem>
        </MenuSection>
      </Menu>
    </MenuTrigger>
  );
}

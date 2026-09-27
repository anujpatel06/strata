'use client';

import { Button, Menu, MenuItem, MenuSeparator, MenuTrigger, SubmenuTrigger } from '@strata/react';
import { IconFolder, IconMail, IconLink, IconShare } from '@strata/icons';

export default function Example() {
  return (
    <MenuTrigger>
      <Button variant="outline">Options</Button>
      <Menu>
        <MenuItem>Rename</MenuItem>
        <SubmenuTrigger>
          <MenuItem icon={<IconFolder />}>Move to</MenuItem>
          <Menu>
            <MenuItem>Receipts</MenuItem>
            <MenuItem>Tax documents</MenuItem>
            <MenuItem>Archive</MenuItem>
          </Menu>
        </SubmenuTrigger>
        <SubmenuTrigger>
          <MenuItem icon={<IconShare />}>Share</MenuItem>
          <Menu>
            <MenuItem icon={<IconMail />}>Email</MenuItem>
            <MenuItem icon={<IconLink />}>Copy link</MenuItem>
          </Menu>
        </SubmenuTrigger>
        <MenuSeparator />
        <MenuItem tone="danger">Delete</MenuItem>
      </Menu>
    </MenuTrigger>
  );
}

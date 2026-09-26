'use client';

import { useState } from 'react';
import type { Selection } from 'react-aria-components';
import { Button, Menu, MenuItem, MenuSection, MenuSeparator, MenuTrigger } from '@strata/react';
import { IconArrowsSort } from '@tabler/icons-react';

export default function Example() {
  const [sort, setSort] = useState<Selection>(new Set(['newest']));
  const [columns, setColumns] = useState<Selection>(new Set(['amount', 'status']));
  return (
    <MenuTrigger>
      <Button variant="outline">
        <IconArrowsSort aria-hidden />
        View
      </Button>
      <Menu>
        <MenuSection title="Sort by" selectionMode="single" selectedKeys={sort} onSelectionChange={setSort}>
          <MenuItem id="newest">Newest first</MenuItem>
          <MenuItem id="oldest">Oldest first</MenuItem>
          <MenuItem id="amount-desc">Largest amount</MenuItem>
        </MenuSection>
        <MenuSeparator />
        <MenuSection title="Columns" selectionMode="multiple" selectedKeys={columns} onSelectionChange={setColumns}>
          <MenuItem id="amount">Amount</MenuItem>
          <MenuItem id="status">Status</MenuItem>
          <MenuItem id="category">Category</MenuItem>
        </MenuSection>
      </Menu>
    </MenuTrigger>
  );
}

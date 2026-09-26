'use client';

import { Button, SearchField } from '@strata/react';
import { IconFilter } from '@tabler/icons-react';

export default function Example() {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', inlineSize: '100%', maxInlineSize: 480 }}>
      <SearchField aria-label="Search claims" placeholder="Search claims" style={{ flex: '1 1 200px' }} />
      <div style={{ display: 'flex', gap: 8 }}>
        <Button variant="outline">
          <IconFilter aria-hidden />
          Filters
        </Button>
        <Button>New claim</Button>
      </div>
    </div>
  );
}

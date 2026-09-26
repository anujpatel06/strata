'use client';

import { Button, DialogTrigger, Popover } from '@strata/react';
import { IconInfoCircle } from '@tabler/icons-react';

export default function Example() {
  return (
    <DialogTrigger>
      <Button variant="ghost" size="icon" aria-label="About available balance">
        <IconInfoCircle aria-hidden />
      </Button>
      <Popover showArrow placement="top">
        <p style={{ margin: 0, maxInlineSize: 'calc(var(--strata-space-16) * 4)', fontSize: 'var(--strata-font-size-sm)' }}>
          Available balance excludes payments that are still pending. It updates within a few minutes of each transaction.
        </p>
      </Popover>
    </DialogTrigger>
  );
}

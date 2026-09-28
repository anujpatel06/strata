'use client';

import { Button, Tooltip, TooltipTrigger } from '@syntara/react';

const placements = ['top', 'bottom', 'start', 'end'] as const;

export default function Example() {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--syntara-space-2)' }}>
      {placements.map((placement) => (
        <TooltipTrigger key={placement}>
          <Button variant="outline">{placement}</Button>
          <Tooltip placement={placement}>Opens on the {placement} side</Tooltip>
        </TooltipTrigger>
      ))}
    </div>
  );
}

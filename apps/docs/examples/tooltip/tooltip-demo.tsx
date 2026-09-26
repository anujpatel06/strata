'use client';

import { Button, Tooltip, TooltipTrigger } from '@strata/react';

export default function Example() {
  return (
    <TooltipTrigger>
      <Button variant="outline">Export</Button>
      <Tooltip>Download the last 90 days as CSV</Tooltip>
    </TooltipTrigger>
  );
}

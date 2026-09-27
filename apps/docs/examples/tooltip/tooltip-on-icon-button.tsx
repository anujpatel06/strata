'use client';

import { Button, Tooltip, TooltipTrigger } from '@strata/react';
import { IconCopy, IconDownload, IconShare, IconTrash } from '@strata/icons';

const actions = [
  { label: 'Copy reference', icon: IconCopy },
  { label: 'Download statement', icon: IconDownload },
  { label: 'Share', icon: IconShare },
  { label: 'Delete', icon: IconTrash },
];

export default function Example() {
  return (
    <div style={{ display: 'flex', gap: 'var(--strata-space-1)' }}>
      {actions.map(({ label, icon: Icon }) => (
        <TooltipTrigger key={label}>
          <Button variant="ghost" size="icon" aria-label={label}>
            <Icon aria-hidden />
          </Button>
          <Tooltip>{label}</Tooltip>
        </TooltipTrigger>
      ))}
    </div>
  );
}

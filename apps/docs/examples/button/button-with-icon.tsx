'use client';

import { Button } from '@strata/react';
import { IconArrowRight, IconDownload, IconUpload } from '@tabler/icons-react';

export default function Example() {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
      <Button variant="secondary">
        <IconUpload aria-hidden />
        Upload receipt
      </Button>
      <Button variant="outline">
        <IconDownload aria-hidden />
        Export CSV
      </Button>
      <Button>
        Continue
        <IconArrowRight aria-hidden />
      </Button>
    </div>
  );
}

'use client';

import { Button } from '@syntara/react';
import { IconArrowRight, IconDownload, IconUpload } from '@syntara/icons';
import { useCopy } from '../_copy/use-copy';

export default function Example() {
  const t = useCopy();
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
      <Button variant="secondary">
        <IconUpload aria-hidden />
        {t('Upload receipt')}
      </Button>
      <Button variant="outline">
        <IconDownload aria-hidden />
        {t('Export CSV')}
      </Button>
      <Button>
        {t('Continue')}
        <IconArrowRight aria-hidden />
      </Button>
    </div>
  );
}

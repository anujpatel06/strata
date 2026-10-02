'use client';

import { Button } from '@syntara/react';
import { IconTrash } from '@syntara/icons';
import { useCopy } from '../_copy/use-copy';

export default function Example() {
  const t = useCopy();
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
      <Button tone="danger">
        <IconTrash aria-hidden />
        {t('Delete account')}
      </Button>
      <Button variant="outline" tone="danger">
        {t('Remove card')}
      </Button>
      <Button variant="ghost" tone="danger">
        {t('Discard draft')}
      </Button>
      <Button variant="outline" tone="danger" isDisabled>
        {t('Remove card')}
      </Button>
    </div>
  );
}

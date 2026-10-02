'use client';

import { Button } from '@syntara/react';
import { IconPlus } from '@syntara/icons';
import { useCopy } from '../_copy/use-copy';

export default function Example() {
  const t = useCopy();
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
      <Button>
        <IconPlus aria-hidden />
        {t('New request')}
      </Button>
      <Button variant="outline">{t('Save draft')}</Button>
      <Button variant="ghost">{t('Cancel')}</Button>
    </div>
  );
}

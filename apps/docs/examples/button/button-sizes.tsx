'use client';

import { Button } from '@syntara/react';
import { IconSettings } from '@syntara/icons';
import { useCopy } from '../_copy/use-copy';

export default function Example() {
  const t = useCopy();
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
      <Button size="sm" variant="outline">{t('Small')}</Button>
      <Button size="md" variant="outline">{t('Medium')}</Button>
      <Button size="lg" variant="outline">{t('Large')}</Button>
      <Button size="icon" variant="outline" aria-label={t('Settings')}>
        <IconSettings aria-hidden />
      </Button>
    </div>
  );
}

'use client';

import { Button } from '@syntara/react';
import { useCopy } from '../_copy/use-copy';

export default function Example() {
  const t = useCopy();
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
      <Button variant="primary">{t('Primary')}</Button>
      <Button variant="secondary">{t('Secondary')}</Button>
      <Button variant="outline">{t('Outline')}</Button>
      <Button variant="ghost">{t('Ghost')}</Button>
      <Button variant="contrast">{t('Contrast')}</Button>
      <Button tone="danger">{t('Delete')}</Button>
      <Button variant="link">{t('Link')}</Button>
    </div>
  );
}

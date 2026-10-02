'use client';

import { useState } from 'react';
import { Button } from '@syntara/react';
import { IconSend } from '@syntara/icons';
import { useCopy } from '../_copy/use-copy';

export default function Example() {
  const t = useCopy();
  const [isPending, setPending] = useState(false);
  const submit = () => {
    setPending(true);
    setTimeout(() => setPending(false), 2000);
  };
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
      <Button isPending={isPending} onPress={submit}>
        <IconSend aria-hidden />
        {t('Submit claim')}
      </Button>
      <Button variant="outline" isPending>
        {t('Saving')}
      </Button>
      <Button variant="ghost" isDisabled>
        {t('Disabled')}
      </Button>
    </div>
  );
}

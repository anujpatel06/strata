'use client';

import { useState } from 'react';
import { Button } from '@strata/react';
import { IconSend } from '@tabler/icons-react';

export default function Example() {
  const [isPending, setPending] = useState(false);
  const submit = () => {
    setPending(true);
    setTimeout(() => setPending(false), 2000);
  };
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
      <Button isPending={isPending} onPress={submit}>
        <IconSend aria-hidden />
        Submit claim
      </Button>
      <Button variant="outline" isPending>
        Saving
      </Button>
      <Button variant="ghost" isDisabled>
        Disabled
      </Button>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { Switch } from '@syntara/react';

export default function Example() {
  const [autopay, setAutopay] = useState(false);
  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <Switch isSelected={autopay} onChange={setAutopay}>
        Autopay is {autopay ? 'on' : 'off'}
      </Switch>
      <Switch isDisabled>Disabled off</Switch>
      <Switch isDisabled defaultSelected>
        Disabled on
      </Switch>
    </div>
  );
}

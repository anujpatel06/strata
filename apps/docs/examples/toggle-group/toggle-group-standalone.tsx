'use client';

import { useState } from 'react';
import { ToggleButton } from '@syntara/react';
import { IconPin, IconStar } from '@syntara/icons';

export default function Example() {
  const [starred, setStarred] = useState(true);
  return (
    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
      <ToggleButton isSelected={starred} onChange={setStarred}>
        <IconStar aria-hidden />
        {starred ? 'Starred' : 'Star'}
      </ToggleButton>
      <ToggleButton aria-label="Pin to top">
        <IconPin aria-hidden />
      </ToggleButton>
    </div>
  );
}

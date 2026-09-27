'use client';

import { IconLock, IconUsers, IconWorld } from '@strata/icons';
import { Select, SelectItem } from '@strata/react';

export default function Example() {
  return (
    <Select label="Visibility" defaultSelectedKey="team" style={{ inlineSize: '100%', maxInlineSize: 320 }}>
      <SelectItem id="private" icon={<IconLock />} description="Only you can see this report.">
        Private
      </SelectItem>
      <SelectItem id="team" icon={<IconUsers />} description="Everyone on your team can view it.">
        Team
      </SelectItem>
      <SelectItem id="public" icon={<IconWorld />} description="Anyone with the link can view it.">
        Public
      </SelectItem>
    </Select>
  );
}

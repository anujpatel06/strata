'use client';

import { Select, SelectItem } from '@strata/react';

export default function Example() {
  return (
    <Select label="Plan" placeholder="Choose a plan" description="You can change plans at any time." style={{ inlineSize: '100%', maxInlineSize: 320 }}>
      <SelectItem id="starter">Starter</SelectItem>
      <SelectItem id="team">Team</SelectItem>
      <SelectItem id="business">Business</SelectItem>
      <SelectItem id="enterprise">Enterprise</SelectItem>
    </Select>
  );
}

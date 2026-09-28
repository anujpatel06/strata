'use client';

import { Select, SelectItem } from '@syntara/react';

export default function Example() {
  return (
    <div style={{ display: 'grid', gap: 24, inlineSize: '100%', maxInlineSize: 320 }}>
      <Select label="Reason for refund" placeholder="Select a reason" isRequired isInvalid errorMessage="Choose a reason to continue.">
        <SelectItem id="damaged">Item arrived damaged</SelectItem>
        <SelectItem id="wrong">Wrong item sent</SelectItem>
        <SelectItem id="late">Delivery was late</SelectItem>
      </Select>
      <Select label="Region" defaultSelectedKey="eu" isDisabled description="Set by your organisation.">
        <SelectItem id="us">United States</SelectItem>
        <SelectItem id="eu">European Union</SelectItem>
      </Select>
    </div>
  );
}

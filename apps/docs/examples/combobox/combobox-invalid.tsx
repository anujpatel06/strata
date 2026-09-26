'use client';

import { Combobox, ComboboxItem } from '@strata/react';

export default function Example() {
  return (
    <div style={{ display: 'grid', gap: 24, inlineSize: '100%', maxInlineSize: 320 }}>
      <Combobox label="Department" placeholder="Search departments…" isRequired isInvalid errorMessage="Choose the department this request belongs to.">
        <ComboboxItem id="finance">Finance</ComboboxItem>
        <ComboboxItem id="legal">Legal</ComboboxItem>
        <ComboboxItem id="operations">Operations</ComboboxItem>
      </Combobox>
      <Combobox label="Office" defaultSelectedKey="remote" isDisabled>
        <ComboboxItem id="hq">Head office</ComboboxItem>
        <ComboboxItem id="remote">Remote</ComboboxItem>
      </Combobox>
    </div>
  );
}

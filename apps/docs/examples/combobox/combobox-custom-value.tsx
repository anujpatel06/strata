'use client';

import { useState } from 'react';
import { Combobox, ComboboxItem } from '@strata/react';

const titles = ['Account manager', 'Data analyst', 'Designer', 'Engineering manager', 'Product manager', 'Software engineer'];

export default function Example() {
  const [value, setValue] = useState('');
  return (
    <Combobox
      label="Job title"
      placeholder="Pick or type a title"
      description={value ? `Saved as “${value}”.` : 'Not in the list? Type your own.'}
      allowsCustomValue
      inputValue={value}
      onInputChange={setValue}
      style={{ inlineSize: '100%', maxInlineSize: 320 }}
    >
      {titles.map((t) => (
        <ComboboxItem key={t} id={t}>
          {t}
        </ComboboxItem>
      ))}
    </Combobox>
  );
}

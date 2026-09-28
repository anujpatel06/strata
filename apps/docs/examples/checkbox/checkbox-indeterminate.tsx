'use client';

import { useState } from 'react';
import { Checkbox, CheckboxGroup } from '@syntara/react';

const ACCOUNTS = ['Savings', 'Current', 'Joint'];

export default function Example() {
  const [selected, setSelected] = useState<string[]>(['Savings']);
  const all = selected.length === ACCOUNTS.length;
  return (
    <div style={{ display: 'grid', gap: 8 }}>
      <Checkbox
        isSelected={all}
        isIndeterminate={selected.length > 0 && !all}
        onChange={(on) => setSelected(on ? ACCOUNTS : [])}
      >
        All accounts
      </Checkbox>
      <CheckboxGroup aria-label="Accounts" value={selected} onChange={setSelected} style={{ paddingInlineStart: 'var(--syntara-space-6)' }}>
        {ACCOUNTS.map((a) => (
          <Checkbox key={a} value={a}>
            {a}
          </Checkbox>
        ))}
      </CheckboxGroup>
    </div>
  );
}

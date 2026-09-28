'use client';

import { Checkbox, CheckboxGroup } from '@syntara/react';

export default function Example() {
  return (
    <CheckboxGroup label="Show" orientation="horizontal" defaultValue={['income', 'expenses']}>
      <Checkbox value="income">Income</Checkbox>
      <Checkbox value="expenses">Expenses</Checkbox>
      <Checkbox value="transfers">Transfers</Checkbox>
      <Checkbox value="pending">Pending</Checkbox>
    </CheckboxGroup>
  );
}

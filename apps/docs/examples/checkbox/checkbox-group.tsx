'use client';

import { Checkbox, CheckboxGroup } from '@syntara/react';

export default function Example() {
  return (
    <CheckboxGroup label="Notify me by" description="Choose at least one." defaultValue={['email', 'push']}>
      <Checkbox value="email">Email</Checkbox>
      <Checkbox value="sms">SMS</Checkbox>
      <Checkbox value="push" description="On devices where you’re signed in.">
        Push notification
      </Checkbox>
    </CheckboxGroup>
  );
}

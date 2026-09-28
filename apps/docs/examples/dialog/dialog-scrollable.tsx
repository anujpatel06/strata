'use client';

import { Button, Dialog, DialogTrigger } from '@syntara/react';

const sections = [
  ['Eligibility', 'You must hold an active account in good standing to join the programme.'],
  ['Earning points', 'Points are added within two working days of each eligible purchase.'],
  ['Redemption', 'Points can be redeemed in multiples of 100 from the Rewards page.'],
  ['Expiry', 'Points expire 24 months after the month in which they were earned.'],
  ['Changes to these terms', 'We will give you 30 days’ notice before any change takes effect.'],
  ['Leaving the programme', 'You can leave at any time. Unredeemed points are forfeited.'],
];

export default function Example() {
  return (
    <DialogTrigger>
      <Button variant="outline">Read terms</Button>
      <Dialog
        title="Rewards programme terms"
        description="Last updated 1 March"
        footer={({ close }) => <Button onPress={close}>I agree</Button>}
      >
        {sections.map(([heading, body]) => (
          <section key={heading}>
            <h3 style={{ margin: 0, fontSize: 'var(--syntara-font-size-md)', fontWeight: 'var(--syntara-font-weight-semibold)' }}>{heading}</h3>
            <p style={{ margin: 'var(--syntara-space-1) 0 0', color: 'var(--syntara-color-text-subtle)' }}>{body}</p>
          </section>
        ))}
      </Dialog>
    </DialogTrigger>
  );
}

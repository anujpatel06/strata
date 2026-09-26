'use client';

import { useState } from 'react';
import { Button, Steps } from '@strata/react';

const steps = [
  { id: 'plan', label: 'Plan', description: 'Choose cover' },
  { id: 'members', label: 'Members', description: 'Who is covered' },
  { id: 'health', label: 'Health', description: 'A few questions' },
  { id: 'payment', label: 'Payment', description: 'Monthly or yearly' },
];

/** Completed steps are buttons: press one to go back to it. */
export default function Example() {
  const [current, setCurrent] = useState('health');
  const index = steps.findIndex((s) => s.id === current);
  const next = steps[index + 1];
  return (
    <div style={{ display: 'grid', gap: 24, inlineSize: '100%', justifyItems: 'start' }}>
      <Steps current={current} steps={steps} onStepPress={setCurrent} aria-label="Sign-up progress" />
      <Button variant="secondary" isDisabled={!next} onPress={() => next && setCurrent(next.id)}>
        Continue
      </Button>
    </div>
  );
}

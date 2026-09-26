'use client';

import { Radio, RadioGroup } from '@strata/react';

export default function Example() {
  return (
    <div style={{ display: 'grid', gap: 24 }}>
      <RadioGroup label="Preferred contact time" isRequired isInvalid errorMessage="Choose a time so we can call you back.">
        <Radio value="morning">Morning</Radio>
        <Radio value="afternoon">Afternoon</Radio>
      </RadioGroup>
      <RadioGroup label="Region" defaultValue="south" isDisabled description="Set by your employer.">
        <Radio value="north">North</Radio>
        <Radio value="south">South</Radio>
      </RadioGroup>
    </div>
  );
}

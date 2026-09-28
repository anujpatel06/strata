'use client';

import { Radio, RadioGroup } from '@syntara/react';

export default function Example() {
  return (
    <RadioGroup
      variant="card"
      label="How should we pay you?"
      defaultValue="bank"
      style={{ inlineSize: '100%', maxInlineSize: 420 }}
    >
      <Radio value="bank" description="Arrives in 1–2 working days. No fee.">
        Bank transfer
      </Radio>
      <Radio value="instant" description="Arrives in minutes. 1% fee, capped at ₹50.">
        Instant payout
      </Radio>
      <Radio value="cheque" description="Posted to your registered address." isDisabled>
        Cheque
      </Radio>
    </RadioGroup>
  );
}

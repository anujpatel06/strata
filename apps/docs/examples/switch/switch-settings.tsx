'use client';

import { Switch } from '@strata/react';

export default function Example() {
  return (
    <div style={{ display: 'grid', gap: 16, inlineSize: '100%', maxInlineSize: 420 }}>
      <Switch defaultSelected description="Get a push notification for every card payment.">
        Payment alerts
      </Switch>
      <Switch description="Blocks online and international card payments until you turn it off.">
        Freeze card
      </Switch>
      <Switch defaultSelected description="Round up purchases and save the change.">
        Round-ups
      </Switch>
    </div>
  );
}

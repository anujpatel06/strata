'use client';

import { AlertDialog, Button, DialogTrigger } from '@strata/react';

const cancelSubscription = () => new Promise((resolve) => setTimeout(resolve, 1500));

export default function Example() {
  return (
    <DialogTrigger>
      <Button variant="outline">Cancel subscription</Button>
      <AlertDialog
        title="Cancel your subscription?"
        actionLabel="Cancel subscription"
        cancelLabel="Keep subscription"
        tone="danger"
        onAction={cancelSubscription}
      >
        You’ll keep access until the end of the current billing period.
      </AlertDialog>
    </DialogTrigger>
  );
}

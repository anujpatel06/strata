'use client';

import { AlertDialog, Button, DialogTrigger } from '@strata/react';

export default function Example() {
  return (
    <DialogTrigger>
      <Button tone="danger">Delete card</Button>
      <AlertDialog title="Delete this card?" actionLabel="Delete card" tone="danger" onAction={() => {}}>
        Scheduled payments on this card will stop. This can’t be undone.
      </AlertDialog>
    </DialogTrigger>
  );
}

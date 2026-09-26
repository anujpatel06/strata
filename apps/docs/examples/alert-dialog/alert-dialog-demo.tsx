'use client';

import { AlertDialog, Button, DialogTrigger } from '@strata/react';

export default function Example() {
  return (
    <DialogTrigger>
      <Button>Publish changes</Button>
      <AlertDialog title="Publish changes?" actionLabel="Publish" onAction={() => {}}>
        Your edits will go live for all customers immediately.
      </AlertDialog>
    </DialogTrigger>
  );
}

'use client';

import { Button, Dialog, DialogTrigger, TextField } from '@syntara/react';

export default function Example() {
  return (
    <DialogTrigger>
      <Button variant="outline">Edit profile</Button>
      <Dialog
        title="Edit profile"
        description="Your name and email are visible to everyone in your workspace."
        footer={({ close }) => (
          <>
            <Button variant="outline" onPress={close}>
              Cancel
            </Button>
            <Button onPress={close}>Save changes</Button>
          </>
        )}
      >
        <TextField label="Full name" defaultValue="Priya Raman" autoFocus />
        <TextField label="Email" type="email" defaultValue="priya.raman@example.com" />
      </Dialog>
    </DialogTrigger>
  );
}

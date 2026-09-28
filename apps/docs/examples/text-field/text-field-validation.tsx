'use client';

import { Button, TextField } from '@syntara/react';

export default function Example() {
  return (
    <form
      onSubmit={(e) => e.preventDefault()}
      style={{ display: 'grid', gap: 16, inlineSize: '100%', maxInlineSize: 320 }}
    >
      <TextField label="Account holder" name="holder" isRequired />
      <TextField
        label="IFSC code"
        name="ifsc"
        isRequired
        description="11 characters, e.g. ABCD0123456."
        validate={(value) => (value && !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(value) ? 'That doesn’t look like an IFSC code.' : null)}
      />
      <Button type="submit" style={{ justifySelf: 'start' }}>
        Add account
      </Button>
    </form>
  );
}

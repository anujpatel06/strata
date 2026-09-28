'use client';

import { Button, Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle, TextField } from '@syntara/react';

export default function Example() {
  return (
    <Card style={{ inlineSize: '100%', maxInlineSize: 400 }}>
      <form onSubmit={(e) => e.preventDefault()} style={{ display: 'contents' }}>
        <CardHeader>
          <CardTitle>Add a bank account</CardTitle>
          <CardDescription>Approved claims are paid into this account.</CardDescription>
        </CardHeader>
        <CardContent style={{ display: 'grid', gap: 'var(--syntara-field-gap)' }}>
          <TextField label="Account holder" name="holder" autoComplete="name" isRequired />
          <TextField label="Account number" name="account" inputMode="numeric" isRequired />
          <TextField label="IFSC" name="ifsc" description="11 characters, printed on your cheque book." />
        </CardContent>
        <CardFooter style={{ justifyContent: 'flex-end' }}>
          <Button variant="ghost">Cancel</Button>
          <Button type="submit">Save account</Button>
        </CardFooter>
      </form>
    </Card>
  );
}

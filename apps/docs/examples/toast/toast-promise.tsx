'use client';

import { Button, ToastRegion, toast } from '@syntara/react';

export default function Example() {
  function exportStatement() {
    // A toast that stays until you dismiss it by key.
    const key = toast({ title: 'Preparing your statement…', description: 'This usually takes a few seconds.' }, { timeout: null });
    setTimeout(() => {
      toast.dismiss(key);
      toast({ title: 'Statement ready', description: 'statement-sep-2026.pdf was downloaded.', tone: 'success' });
    }, 2500);
  }
  return (
    <>
      <ToastRegion />
      <Button variant="outline" onPress={exportStatement}>Export statement</Button>
    </>
  );
}

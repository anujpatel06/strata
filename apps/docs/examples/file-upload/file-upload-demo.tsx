'use client';

import { FileUpload } from '@strata/react';

export default function Example() {
  return (
    <FileUpload
      label="Receipts"
      description="Attach the receipts for this expense claim."
      acceptedFileTypes={['image/png', 'image/jpeg', 'application/pdf']}
      maxSize={10 * 1024 * 1024}
      allowsMultiple
      onChange={(files) => console.log(files.map((f) => f.name))}
      style={{ inlineSize: '100%', maxInlineSize: 480 }}
    />
  );
}

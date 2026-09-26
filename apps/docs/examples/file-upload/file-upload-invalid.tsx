'use client';

import { FileUpload } from '@strata/react';

export default function Example() {
  return (
    <div style={{ display: 'grid', gap: 24, inlineSize: '100%', maxInlineSize: 480 }}>
      <FileUpload label="Identity document" acceptedFileTypes={['.pdf']} isInvalid errorMessage="Upload a document to continue." />
      <FileUpload label="Contract" description="Uploads are closed for this case." isDisabled />
    </div>
  );
}

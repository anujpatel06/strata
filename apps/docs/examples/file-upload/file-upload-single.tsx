'use client';

import { FileUpload } from '@syntara/react';

export default function Example() {
  return (
    <FileUpload
      label="Profile photo"
      acceptedFileTypes={['image/png', 'image/jpeg']}
      maxSize={2 * 1024 * 1024}
      dropLabel="Drop a photo here or"
      browseLabel="choose a file"
      style={{ inlineSize: '100%', maxInlineSize: 480 }}
    />
  );
}

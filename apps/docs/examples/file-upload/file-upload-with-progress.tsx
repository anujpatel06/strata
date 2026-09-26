'use client';

import { useState } from 'react';
import { FileUpload, type FileUploadEntry } from '@strata/react';

const sample = (name: string, kb: number, type: string) => new File([new Uint8Array(kb * 1024)], name, { type });

export default function Example() {
  const [entries, setEntries] = useState<FileUploadEntry[]>(() => [
    { file: sample('invoice-march.pdf', 842, 'application/pdf'), progress: 100 },
    { file: sample('site-photo-01.jpg', 2310, 'image/jpeg'), progress: 64 },
    { file: sample('site-photo-02.jpg', 1980, 'image/jpeg'), error: 'Upload failed. Check your connection and try again.' },
  ]);
  return (
    <FileUpload
      label="Supporting documents"
      acceptedFileTypes={['image/*', '.pdf']}
      maxSize={20 * 1024 * 1024}
      allowsMultiple
      files={entries}
      onChange={(files) => setEntries(files.map((file) => entries.find((e) => e.file === file) ?? { file, progress: 0 }))}
      style={{ inlineSize: '100%', maxInlineSize: 480 }}
    />
  );
}

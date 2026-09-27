'use client';

import { useState } from 'react';
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  FileUpload,
  Steps,
  type FileUploadEntry,
} from '@strata/react';
import { IconChevronLeft } from '@strata/icons';
import styles from './Screen.module.css';

const MAX_FILES = 5;

const sample = (name: string, kb: number, type: string) => new File([new Uint8Array(kb * 1024)], name, { type });

const initialEntries: FileUploadEntry[] = [
  { file: sample('accident-front.jpg', 2380, 'image/jpeg'), progress: 100 },
  { file: sample('accident-side.jpg', 1840, 'image/jpeg'), progress: 100 },
  { file: sample('repair-estimate.pdf', 640, 'application/pdf'), progress: 100 },
  {
    file: sample('accident-rear.jpg', 3120, 'image/jpeg'),
    error: 'Upload failed. Check your connection and try again.',
  },
];

const steps = [
  { id: 'details', label: 'Details' },
  { id: 'evidence', label: 'Upload evidence' },
  { id: 'review', label: 'Review' },
];

export default function Screen() {
  const [entries, setEntries] = useState<FileUploadEntry[]>(initialEntries);

  const onFilesChange = (files: File[]) => {
    const existing = new Map(entries.map((e) => [e.file, e]));
    const merged = files.map((file) => existing.get(file) ?? { file, progress: 100 });
    setEntries(merged.slice(0, MAX_FILES));
  };

  const hasUploaded = entries.some((e) => !e.error && (e.progress ?? 0) === 100);

  return (
    <div className={styles.page}>
      <div className={styles.flow}>
        <Steps aria-label="Claim progress" current="evidence" steps={steps} />

        <Card className={styles.card}>
          <CardHeader>
            <CardTitle level={2}>Upload evidence</CardTitle>
            <CardDescription>
              Add photos of the damage or documents that support your claim.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <FileUpload
              label="Evidence"
              description={`${entries.length} of ${MAX_FILES} files added`}
              hint="JPG, PNG or PDF, up to 5 files, 10 MB each"
              acceptedFileTypes={['image/*', '.pdf']}
              maxSize={10 * 1024 * 1024}
              allowsMultiple
              files={entries}
              onChange={onFilesChange}
            />
          </CardContent>

          <CardFooter divider className={styles.actions}>
            <Button variant="outline">
              <IconChevronLeft aria-hidden />
              Back
            </Button>
            <Button variant="primary" isDisabled={!hasUploaded}>
              Continue
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

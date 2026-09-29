'use client';

import { useId, useState } from 'react';
import {
  Button,
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  Eyebrow,
  FileUpload,
  Steps,
  type FileUploadEntry,
} from '@syntara/react';
import { IconChevronLeft } from '@syntara/icons';
import styles from './Screen.module.css';

const MAX_FILES = 5;

const sample = (name: string, kb: number, type: string): File => new File([new Uint8Array(kb * 1024)], name, { type });

const INITIAL_FILES: FileUploadEntry[] = [
  { file: sample('site-photo-01.jpg', 2310, 'image/jpeg'), progress: 100 },
  { file: sample('site-photo-02.jpg', 1980, 'image/jpeg'), progress: 100 },
  { file: sample('police-report.pdf', 842, 'application/pdf'), progress: 100 },
  { file: sample('site-photo-03.jpg', 3120, 'image/jpeg'), error: 'Upload failed. Check your connection and try again.' },
];

const steps = [
  { id: 'details', label: 'Details' },
  { id: 'evidence', label: 'Evidence' },
  { id: 'review', label: 'Review' },
];

export default function Screen() {
  const uid = useId();
  const [entries, setEntries] = useState<FileUploadEntry[]>(INITIAL_FILES);

  const onFiles = (files: File[]) => {
    const existing = new Map(entries.map((e) => [e.file, e]));
    setEntries(files.slice(0, MAX_FILES).map((file) => existing.get(file) ?? { file, progress: 100 }));
  };

  const hasUploaded = entries.some((e) => (e.progress ?? 0) === 100 && !e.error);

  return (
    <div className={styles.page}>
      <div className={styles.intro}>
        <Eyebrow lead="rule" tone="brand">
          Step 2 of 3
        </Eyebrow>
        <h1 className={styles.title}>Upload evidence</h1>
        <p className={styles.subtitle}>Add photos or documents that support your claim.</p>
      </div>

      <Steps aria-label="Claim progress" current="evidence" steps={steps} />

      <Card className={styles.card}>
        <CardHeader>
          <CardTitle level={2} id={`${uid}-heading`}>
            Supporting files
          </CardTitle>
        </CardHeader>
        <CardContent>
          <FileUpload
            label="Photos or documents"
            description="Add up to five photos or PDFs of the damage or loss."
            hint="JPG, PNG or PDF, up to 10 MB each, up to 5 files"
            acceptedFileTypes={['image/*', '.pdf']}
            maxSize={10 * 1024 * 1024}
            allowsMultiple
            files={entries}
            onChange={onFiles}
          />
        </CardContent>
        <CardFooter divider className={styles.actions}>
          <Button variant="outline">
            <IconChevronLeft aria-hidden className={styles.directional} />
            Back
          </Button>
          <Button type="button" variant="primary" isDisabled={!hasUploaded}>
            Continue
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

import { useState } from 'react';
import {
  Button,
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
  Eyebrow,
  FileUpload,
  Steps,
  type FileUploadEntry,
} from '@syntara/react';
import { IconChevronLeft, IconChevronRight } from '@syntara/icons';
import styles from './Screen.module.css';

const MAX_FILES = 5;

/** Builds a File of a given size (KiB) without reading real bytes, for mock data. */
const mockFile = (name: string, kib: number, type: string) => new File([new Uint8Array(kib * 1024)], name, { type });

const initialEntries: FileUploadEntry[] = [
  { file: mockFile('front-bumper-damage.jpg', 2380, 'image/jpeg'), progress: 100 },
  { file: mockFile('side-panel-scratch.jpg', 1745, 'image/jpeg'), progress: 100 },
  {
    file: mockFile('repair-estimate.pdf', 612, 'application/pdf'),
    error: 'Upload failed — the connection was lost. Remove the file and try again.',
  },
];

const claimSteps = [
  { id: 'details', label: 'Claim details' },
  { id: 'evidence', label: 'Upload evidence' },
  { id: 'review', label: 'Review & submit' },
];

export default function Screen() {
  const [entries, setEntries] = useState<FileUploadEntry[]>(initialEntries);
  const [limitMessage, setLimitMessage] = useState<string | null>(null);

  const handleChange = (files: File[]) => {
    const existing = new Map(entries.map((entry) => [entry.file, entry]));
    const overLimit = files.length > MAX_FILES;
    setLimitMessage(overLimit ? `You can add up to ${MAX_FILES} files. Remove one to add another.` : null);
    const kept = overLimit ? files.slice(0, MAX_FILES) : files;
    setEntries(kept.map((file) => existing.get(file) ?? { file, progress: 100 }));
  };

  const hasUploadedFile = entries.some((entry) => !entry.error && (entry.progress ?? 0) === 100);

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.intro}>
          <Eyebrow>Auto claim · #CLM-48213</Eyebrow>
          <h1 className={styles.title}>File a claim</h1>
        </div>

        <Steps aria-label="Claim progress" current="evidence" steps={claimSteps} />

        <Card className={styles.card}>
          <CardHeader>
            <CardTitle level={2}>Upload evidence</CardTitle>
            <CardDescription>
              Add photos of the damage or supporting documents. Up to {MAX_FILES} files, JPG, PNG or PDF, 10 MB each.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FileUpload
              label="Evidence"
              acceptedFileTypes={['image/*', '.pdf']}
              maxSize={10 * 1024 * 1024}
              allowsMultiple
              files={entries}
              onChange={handleChange}
              isInvalid={!!limitMessage}
              errorMessage={limitMessage ?? undefined}
            />
          </CardContent>
          <CardFooter divider className={styles.actions}>
            <Button variant="outline">
              <IconChevronLeft aria-hidden className={styles.directional} />
              Back
            </Button>
            <Button variant="primary" isDisabled={!hasUploadedFile}>
              Continue
              <IconChevronRight aria-hidden className={styles.directional} />
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

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
  { file: sample('front-of-vehicle.jpg', 2380, 'image/jpeg'), progress: 100 },
  { file: sample('rear-bumper-damage.jpg', 1840, 'image/jpeg'), progress: 100 },
  { file: sample('repair-estimate.pdf', 512, 'application/pdf'), progress: 100 },
  {
    file: sample('dashboard-warning-light.jpg', 1975, 'image/jpeg'),
    error: 'Upload failed. Check your connection and try again.',
  },
];

const steps = [
  { id: 'details', label: 'Details' },
  { id: 'evidence', label: 'Evidence' },
  { id: 'review', label: 'Review' },
];

export default function Screen() {
  const [entries, setEntries] = useState<FileUploadEntry[]>(initialEntries);

  const hasUploaded = entries.some((entry) => !entry.error && (entry.progress ?? 100) === 100);
  const atLimit = entries.length >= MAX_FILES;

  const onFilesChange = (files: File[]) => {
    setEntries((prev) => {
      const existing = new Map(prev.map((entry) => [entry.file, entry]));
      return files.slice(0, MAX_FILES).map((file) => existing.get(file) ?? { file, progress: 100 });
    });
  };

  return (
    <div className={styles.page}>
      <Steps aria-label="Claim progress" current="evidence" steps={steps} />

      <Card className={styles.card}>
        <CardHeader>
          <CardTitle level={1}>Upload evidence</CardTitle>
          <CardDescription>
            Add photos of the damage, or PDFs of related documents such as a repair estimate. You can add up to {MAX_FILES} files.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <FileUpload
            label="Evidence"
            description={`${entries.length} of ${MAX_FILES} files added`}
            acceptedFileTypes={['image/*', '.pdf']}
            maxSize={20 * 1024 * 1024}
            allowsMultiple
            isDisabled={atLimit}
            files={entries}
            onChange={onFilesChange}
          />
        </CardContent>

        <CardFooter divider className={styles.actions}>
          <Button variant="outline">
            <IconChevronLeft aria-hidden className={styles.directional} />
            Back
          </Button>
          <Button isDisabled={!hasUploaded}>Continue</Button>
        </CardFooter>
      </Card>
    </div>
  );
}

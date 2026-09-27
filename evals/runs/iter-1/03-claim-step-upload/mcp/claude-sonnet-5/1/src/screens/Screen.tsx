import { useMemo, useState } from 'react';
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
  type FileRejection,
  type FileUploadEntry,
} from '@strata/react';
import styles from './Screen.module.css';

const MAX_FILES = 5;

const steps = [
  { id: 'details', label: 'Claim details' },
  { id: 'upload', label: 'Upload evidence' },
  { id: 'review', label: 'Review & submit' },
];

const mockFile = (name: string, bytes: number, type: string) => new File([new Uint8Array(bytes)], name, { type });

const initialEntries: FileUploadEntry[] = [
  { file: mockFile('front-bumper-damage.jpg', 2_412_000, 'image/jpeg'), progress: 100 },
  { file: mockFile('dashboard-warning-light.jpg', 1_180_000, 'image/jpeg'), progress: 100 },
  { file: mockFile('repair-estimate.pdf', 654_000, 'application/pdf'), progress: 100 },
  {
    file: mockFile('police-report.pdf', 512_000, 'application/pdf'),
    error: 'Upload failed — connection lost. Remove the file and try again.',
  },
];

export default function Screen() {
  const [entries, setEntries] = useState<FileUploadEntry[]>(initialEntries);
  const [rejection, setRejection] = useState<string | null>(null);

  const hasUploaded = useMemo(() => entries.some((entry) => !entry.error && (entry.progress ?? 0) >= 100), [entries]);
  const atMax = entries.length >= MAX_FILES;

  const handleChange = (files: File[]) => {
    setRejection(null);
    const capped = files.slice(0, MAX_FILES);
    setEntries((prev) => capped.map((file) => prev.find((entry) => entry.file === file) ?? { file, progress: 100 }));
  };

  const handleReject = (rejections: FileRejection[]) => {
    setRejection(rejections[0]?.message ?? null);
  };

  const errorMessage =
    rejection ?? (atMax ? `You've reached the ${MAX_FILES}-file limit. Remove a file to add another.` : undefined);

  return (
    <div className={styles.page}>
      <Steps current="upload" steps={steps} aria-label="Claim progress" />

      <Card>
        <CardHeader>
          <CardTitle>Upload evidence</CardTitle>
          <CardDescription>
            Add clear photos of the damage or supporting PDFs, such as repair estimates and reports.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <FileUpload
            label="Evidence"
            description="Photos of the damage, receipts or reports."
            hint={`JPG, PNG or PDF, up to 20 MB each — up to ${MAX_FILES} files`}
            acceptedFileTypes={['image/*', '.pdf']}
            maxSize={20 * 1024 * 1024}
            allowsMultiple
            files={entries}
            onChange={handleChange}
            onReject={handleReject}
            isInvalid={!!errorMessage}
            errorMessage={errorMessage}
          />
        </CardContent>

        <CardFooter divider className={styles.footer}>
          <Button variant="outline">Back</Button>
          <Button isDisabled={!hasUploaded}>Continue</Button>
        </CardFooter>
      </Card>
    </div>
  );
}

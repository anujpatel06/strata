import { useState } from 'react';
import {
  Button,
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
  FileUpload,
  Steps,
  type FileUploadEntry,
} from '@strata/react';
import { IconArrowLeft, IconArrowRight } from '@strata/icons';
import styles from './Screen.module.css';

const MAX_FILES = 5;

function mockFile(name: string, type: string, size: number, lastModified: number): File {
  return new File([new Uint8Array(size)], name, { type, lastModified });
}

const initialEntries: FileUploadEntry[] = [
  {
    file: mockFile('front-bumper-damage.jpg', 'image/jpeg', 2_400_000, 1_732_000_000_000),
    progress: 100,
  },
  {
    file: mockFile('rear-view.jpg', 'image/jpeg', 1_800_000, 1_732_000_060_000),
    progress: 100,
  },
  {
    file: mockFile('police-report.pdf', 'application/pdf', 640_000, 1_732_000_120_000),
    progress: 100,
  },
  {
    file: mockFile('dashboard-photo.jpg', 'image/jpeg', 3_600_000, 1_732_000_180_000),
    error: 'Upload failed — connection lost. Remove it and try again.',
  },
];

const steps = [
  { id: 'details', label: 'Claim details' },
  { id: 'evidence', label: 'Upload evidence' },
  { id: 'review', label: 'Review & submit' },
];

export default function Screen() {
  const [entries, setEntries] = useState<FileUploadEntry[]>(initialEntries);

  const handleChange = (nextFiles: File[]) => {
    setEntries((prev) => {
      const known = new Map(prev.map((entry) => [entry.file, entry]));
      return nextFiles.map((file) => known.get(file) ?? { file, progress: 100 });
    });
  };

  const canContinue = entries.some((entry) => !entry.error && (entry.progress ?? 0) >= 100);
  const atLimit = entries.length >= MAX_FILES;

  return (
    <Card className={styles.card}>
      <CardHeader divider>
        <Steps
          steps={steps}
          current="evidence"
          aria-label="Claim progress"
          className={styles.steps}
        />
        <CardTitle level={1} className={styles.title}>
          Upload evidence
        </CardTitle>
        <CardDescription>
          Add photos of the damage or any supporting documents, like a police report or repair
          estimate. You can add up to {MAX_FILES} files.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <FileUpload
          label="Evidence"
          description="Photos or PDFs, up to 10 MB each."
          acceptedFileTypes={['image/*', '.pdf']}
          allowsMultiple
          maxSize={10 * 1024 * 1024}
          isDisabled={atLimit}
          files={entries}
          onChange={handleChange}
        />
        {atLimit && (
          <p className={styles.limitNote}>
            You&rsquo;ve reached the {MAX_FILES}-file limit. Remove a file to add another.
          </p>
        )}
      </CardContent>
      <CardFooter divider className={styles.footer}>
        <Button variant="outline">
          <IconArrowLeft aria-hidden="true" />
          Back
        </Button>
        <Button variant="primary" isDisabled={!canContinue}>
          Continue
          <IconArrowRight aria-hidden="true" />
        </Button>
      </CardFooter>
    </Card>
  );
}

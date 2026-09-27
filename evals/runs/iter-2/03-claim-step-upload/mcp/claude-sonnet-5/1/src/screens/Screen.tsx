import { useState } from 'react';
import { Button, Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle, Eyebrow, FileUpload, Steps, type FileUploadEntry } from '@strata/react';
import styles from './Screen.module.css';

const MAX_FILES = 5;

const claimSteps = [
  { id: 'details', label: 'Details' },
  { id: 'evidence', label: 'Evidence' },
  { id: 'review', label: 'Review' },
];

const sampleFile = (name: string, kb: number, type: string) => new File([new Uint8Array(kb * 1024)], name, { type });

const initialEntries: FileUploadEntry[] = [
  { file: sampleFile('front-bumper-damage.jpg', 2148, 'image/jpeg'), progress: 100 },
  { file: sampleFile('dashboard-warning-light.jpg', 1392, 'image/jpeg'), progress: 100 },
  { file: sampleFile('repair-estimate.pdf', 640, 'application/pdf'), progress: 100 },
  {
    file: sampleFile('police-report.pdf', 3276, 'application/pdf'),
    error: 'Upload failed — the connection was interrupted. Remove it and try again.',
  },
];

export default function Screen() {
  const [entries, setEntries] = useState<FileUploadEntry[]>(initialEntries);

  const hasUploaded = entries.some((entry) => !entry.error && (entry.progress ?? 100) >= 100);
  const atLimit = entries.length >= MAX_FILES;

  const onFiles = (files: File[]) => {
    const existing = new Map(entries.map((entry) => [entry.file, entry]));
    setEntries(files.slice(0, MAX_FILES).map((file) => existing.get(file) ?? { file, progress: 100 }));
  };

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <Eyebrow lead="rule" tone="brand">
          Claim #CLM-48213
        </Eyebrow>

        <Steps aria-label="Claim progress" current="evidence" steps={claimSteps} className={styles.steps} />

        <Card>
          <CardHeader>
            <CardTitle level={1} className={styles.title}>
              Upload evidence
            </CardTitle>
            <CardDescription>Add photos or documents that support your claim, such as damage photos, a repair estimate or a police report.</CardDescription>
          </CardHeader>

          <CardContent>
            <FileUpload
              label="Evidence"
              description={`Add up to ${MAX_FILES} files.`}
              acceptedFileTypes={['image/png', 'image/jpeg', 'application/pdf']}
              maxSize={10 * 1024 * 1024}
              allowsMultiple
              isDisabled={atLimit}
              files={entries}
              onChange={onFiles}
            />
          </CardContent>

          <CardFooter divider className={styles.actions}>
            <Button variant="outline">Back</Button>
            <Button variant="primary" isDisabled={!hasUploaded}>
              Continue
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

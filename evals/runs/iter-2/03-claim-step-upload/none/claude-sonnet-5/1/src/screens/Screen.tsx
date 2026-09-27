import { useState } from 'react';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
  FileUpload,
  Steps,
  type FileRejection,
  type FileUploadEntry,
  type StepItem,
} from '@strata/react';
import { IconArrowLeft, IconArrowRight } from '@strata/icons';
import styles from './Screen.module.css';

const MAX_FILES = 5;

function mockFile(name: string, sizeInBytes: number, type: string): File {
  return new File([new Uint8Array(sizeInBytes)], name, { type });
}

// Mock data: three files already uploaded, one that failed and is still visible with its reason.
const initialFiles: FileUploadEntry[] = [
  { file: mockFile('front-bumper-damage.jpg', 2_400_000, 'image/jpeg'), progress: 100 },
  { file: mockFile('driver-side-door.jpg', 1_800_000, 'image/jpeg'), progress: 100 },
  { file: mockFile('police-report.pdf', 640_000, 'application/pdf'), progress: 100 },
  {
    file: mockFile('dashboard-warning-light.jpg', 3_100_000, 'image/jpeg'),
    error: 'Upload failed — the connection was interrupted. Remove it and try again.',
  },
];

const steps: StepItem[] = [
  { id: 'details', label: 'Claim details' },
  { id: 'evidence', label: 'Upload evidence' },
  { id: 'review', label: 'Review & submit' },
];

export default function Screen() {
  const [files, setFiles] = useState<FileUploadEntry[]>(initialFiles);
  const [rejection, setRejection] = useState<string | null>(null);

  const uploadedCount = files.filter((entry) => !entry.error).length;
  const canContinue = uploadedCount > 0;

  function handleChange(nextFiles: File[]) {
    let capped = nextFiles;
    if (nextFiles.length > MAX_FILES) {
      capped = nextFiles.slice(0, MAX_FILES);
      setRejection(`You can add up to ${MAX_FILES} files. Remove one to add another.`);
    } else {
      setRejection(null);
    }
    setFiles((prev) => capped.map((file) => prev.find((entry) => entry.file === file) ?? { file, progress: 100 }));
  }

  function handleReject(rejections: FileRejection[]) {
    setRejection(rejections[0]?.message ?? null);
  }

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <Steps steps={steps} current="evidence" aria-label="Claim progress" className={styles.steps} />

        <Card className={styles.card}>
          <CardHeader>
            <CardTitle level={1}>Upload evidence</CardTitle>
            <CardDescription>
              Add photos of the damage and any supporting documents, like a police report or repair estimate.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <FileUpload
              label="Photos and documents"
              description={
                <>
                  Add up to {MAX_FILES} files. <Badge size="sm">{files.length} of {MAX_FILES} added</Badge>
                </>
              }
              acceptedFileTypes={['image/*', '.pdf']}
              allowsMultiple
              maxSize={10 * 1024 * 1024}
              files={files}
              onChange={handleChange}
              onReject={handleReject}
              errorMessage={rejection}
              isInvalid={rejection != null}
            />
          </CardContent>

          <CardFooter divider className={styles.footer}>
            <Button variant="outline">
              <IconArrowLeft />
              Back
            </Button>
            <Button variant="primary" isDisabled={!canContinue}>
              Continue
              <IconArrowRight />
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

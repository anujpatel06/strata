'use client';

import { useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import {
  Alert,
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Eyebrow,
  FileUpload,
  IconTile,
  ProgressBar,
} from '@syntara/react';
import type { FileUploadEntry, IconTileTint } from '@syntara/react';
import {
  IconBuildingBank,
  IconCircleCheck,
  IconCircleX,
  IconClock,
  IconFingerprint,
  IconMapPin,
  IconPhoto,
  IconUpload,
} from '@syntara/icons';
import styles from './Screen.module.css';

type DocumentStatus = 'not-uploaded' | 'under-review' | 'approved' | 'rejected';

interface DocumentRecord {
  id: string;
  title: string;
  description: string;
  icon: ReactNode;
  status: DocumentStatus;
  fileName?: string;
  fileSize?: number;
  rejectionReason?: string;
}

const initialDocuments: DocumentRecord[] = [
  {
    id: 'id-proof',
    title: 'ID proof',
    description: 'A government-issued passport, driving licence or national ID.',
    icon: <IconFingerprint aria-hidden />,
    status: 'approved',
    fileName: 'passport-anuj.pdf',
    fileSize: 1_258_000,
  },
  {
    id: 'address-proof',
    title: 'Address proof',
    description: 'A utility bill or bank letter dated within the last 3 months.',
    icon: <IconMapPin aria-hidden />,
    status: 'under-review',
    fileName: 'utility-bill-august.pdf',
    fileSize: 642_000,
  },
  {
    id: 'bank-statement',
    title: 'Bank statement',
    description: 'A statement covering the last 3 months, showing your name and account number.',
    icon: <IconBuildingBank aria-hidden />,
    status: 'rejected',
    fileName: 'bank-statement-jan.pdf',
    fileSize: 890_000,
    rejectionReason: 'The statement is dated more than 3 months ago. Upload one dated within the last 90 days.',
  },
  {
    id: 'photo',
    title: 'Photo',
    description: 'A clear, recent photo of your face against a plain background.',
    icon: <IconPhoto aria-hidden />,
    status: 'not-uploaded',
  },
];

const statusCopy: Record<DocumentStatus, { label: string; tone: 'neutral' | 'info' | 'success' | 'danger'; icon: ReactNode; tint: IconTileTint }> = {
  'not-uploaded': { label: 'Not uploaded', tone: 'neutral', icon: <IconUpload aria-hidden />, tint: 'none' },
  'under-review': { label: 'Under review', tone: 'info', icon: <IconClock aria-hidden />, tint: 'info' },
  approved: { label: 'Approved', tone: 'success', icon: <IconCircleCheck aria-hidden />, tint: 'success' },
  rejected: { label: 'Rejected', tone: 'danger', icon: <IconCircleX aria-hidden />, tint: 'danger' },
};

export default function Screen() {
  const [documents, setDocuments] = useState<DocumentRecord[]>(initialDocuments);
  const uploadTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const [uploadingProgress, setUploadingProgress] = useState<Record<string, number>>({});

  const approvedCount = useMemo(() => documents.filter((d) => d.status === 'approved').length, [documents]);
  const total = documents.length;
  const progressPercent = Math.round((approvedCount / total) * 100);

  const rejectedDocs = documents.filter((d) => d.status === 'rejected');
  const allApproved = approvedCount === total;

  function handleFileSelected(id: string, files: File[]) {
    const file = files[files.length - 1];
    if (!file) return;

    setDocuments((prev) =>
      prev.map((doc) =>
        doc.id === id
          ? { ...doc, status: 'under-review', fileName: file.name, fileSize: file.size, rejectionReason: undefined }
          : doc,
      ),
    );

    const existing = uploadTimers.current.get(id);
    if (existing) clearInterval(existing);

    setUploadingProgress((prev) => ({ ...prev, [id]: 0 }));
    const timer = setInterval(() => {
      setUploadingProgress((prev) => {
        const next = Math.min((prev[id] ?? 0) + 20, 100);
        if (next >= 100) {
          clearInterval(timer);
          uploadTimers.current.delete(id);
        }
        return { ...prev, [id]: next };
      });
    }, 200);
    uploadTimers.current.set(id, timer);
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Eyebrow>Account setup</Eyebrow>
        <h1 className={styles.title}>Document verification</h1>
        <p className={styles.subtitle}>
          Upload these four documents so we can verify your identity. You can replace any document at any time.
        </p>
      </header>

      <Card className={styles.progressCard}>
        <CardContent className={styles.progressContent}>
          <ProgressBar
            label="Verification progress"
            value={progressPercent}
            showValue
            tone={allApproved ? 'success' : 'default'}
          />
          <p className={styles.progressSummary}>
            {approvedCount} of {total} documents approved
          </p>
        </CardContent>
      </Card>

      {allApproved ? (
        <Alert tone="success" title="Verification complete">
          All four documents have been approved. There is nothing else to do.
        </Alert>
      ) : rejectedDocs.length > 0 ? (
        <Alert tone="danger" title="Action needed">
          {rejectedDocs.length === 1
            ? `${rejectedDocs[0].title} was rejected. Upload a replacement below.`
            : `${rejectedDocs.length} documents were rejected. Upload replacements below.`}
        </Alert>
      ) : null}

      <div className={styles.grid}>
        {documents.map((doc) => {
          const status = statusCopy[doc.status];
          const progress = uploadingProgress[doc.id];
          const entries: FileUploadEntry[] =
            doc.fileName && doc.status !== 'not-uploaded'
              ? [
                  {
                    file: new File([], doc.fileName, { type: 'application/octet-stream' }),
                    progress: progress ?? 100,
                    error: undefined,
                  },
                ]
              : [];

          return (
            <Card key={doc.id} className={styles.docCard}>
              <CardHeader className={styles.docHeader}>
                <div className={styles.docHeaderRow}>
                  <IconTile tint={status.tint}>{doc.icon}</IconTile>
                  <div className={styles.docHeaderText}>
                    <CardTitle level={2}>{doc.title}</CardTitle>
                    <CardDescription>{doc.description}</CardDescription>
                  </div>
                </div>
                <Badge tone={status.tone} icon={status.icon}>
                  {status.label}
                </Badge>
              </CardHeader>
              <CardContent className={styles.docContent}>
                {doc.status === 'rejected' && doc.rejectionReason ? (
                  <Alert tone="danger" title="Why this was rejected">
                    {doc.rejectionReason}
                  </Alert>
                ) : null}
                <FileUpload
                  label={doc.status === 'not-uploaded' ? `Upload ${doc.title.toLowerCase()}` : `Replace ${doc.title.toLowerCase()}`}
                  acceptedFileTypes={doc.id === 'photo' ? ['image/png', 'image/jpeg'] : ['image/*', '.pdf']}
                  maxSize={10 * 1024 * 1024}
                  files={entries}
                  onChange={(files) => handleFileSelected(doc.id, files)}
                  className={styles.fileUpload}
                />
              </CardContent>
              {doc.fileName ? (
                <CardFooter divider className={styles.docFooter}>
                  {formatFileSize(doc.fileSize)}
                </CardFooter>
              ) : null}
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function formatFileSize(bytes?: number): string {
  if (!bytes) return '';
  const mb = bytes / (1024 * 1024);
  if (mb >= 1) return `${mb.toFixed(1)} MB`;
  const kb = bytes / 1024;
  return `${Math.round(kb)} KB`;
}

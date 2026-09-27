'use client';

import { useState } from 'react';
import {
  Badge,
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  FileUpload,
  ProgressBar,
  type FileUploadEntry,
} from '@strata/react';
import styles from './Screen.module.css';

type DocId = 'id' | 'address' | 'bank' | 'photo';
type Status = 'not_uploaded' | 'under_review' | 'approved' | 'rejected';

interface DocRecord {
  status: Status;
  file?: File;
  reason?: string;
  updatedOn?: string;
}

const DOCUMENT_TYPES: ReadonlyArray<{ id: DocId; title: string; description: string }> = [
  { id: 'id', title: 'ID proof', description: 'Passport, national ID or driving licence' },
  { id: 'address', title: 'Address proof', description: 'Utility bill or bank letter dated within 3 months' },
  { id: 'bank', title: 'Bank statement', description: 'Latest statement showing your name and account number' },
  { id: 'photo', title: 'Photo', description: 'A clear, recent photo of your face' },
];

const STATUS_META: Record<Status, { label: string; tone: 'neutral' | 'info' | 'success' | 'danger' }> = {
  not_uploaded: { label: 'Not uploaded', tone: 'neutral' },
  under_review: { label: 'Under review', tone: 'info' },
  approved: { label: 'Approved', tone: 'success' },
  rejected: { label: 'Rejected', tone: 'danger' },
};

const sampleFile = (name: string, kb: number, type: string) => new File([new Uint8Array(kb * 1024)], name, { type });

const INITIAL: Record<DocId, DocRecord> = {
  id: { status: 'approved', file: sampleFile('passport.pdf', 2380, 'application/pdf'), updatedOn: '18 Sep 2026' },
  address: { status: 'under_review', file: sampleFile('utility-bill.pdf', 860, 'application/pdf'), updatedOn: '24 Sep 2026' },
  bank: {
    status: 'rejected',
    file: sampleFile('bank-statement.pdf', 1120, 'application/pdf'),
    reason: 'Statement is dated more than 3 months ago. Upload one from the last 90 days.',
    updatedOn: '22 Sep 2026',
  },
  photo: { status: 'not_uploaded' },
};

const captionFor = (record: DocRecord): string | null => {
  switch (record.status) {
    case 'approved':
      return `Approved on ${record.updatedOn}`;
    case 'under_review':
      return `Submitted on ${record.updatedOn} · awaiting review`;
    case 'rejected':
      return `Reviewed on ${record.updatedOn}`;
    case 'not_uploaded':
      return null;
  }
};

const today = () => new Date().toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });

export default function Screen() {
  const [docs, setDocs] = useState<Record<DocId, DocRecord>>(INITIAL);

  const total = DOCUMENT_TYPES.length;
  const approvedCount = DOCUMENT_TYPES.filter((d) => docs[d.id].status === 'approved').length;
  const underReviewCount = DOCUMENT_TYPES.filter((d) => docs[d.id].status === 'under_review').length;
  const rejectedCount = DOCUMENT_TYPES.filter((d) => docs[d.id].status === 'rejected').length;
  const notUploadedCount = DOCUMENT_TYPES.filter((d) => docs[d.id].status === 'not_uploaded').length;
  const percent = Math.round((approvedCount / total) * 100);

  const summary = [
    `${approvedCount} of ${total} approved`,
    underReviewCount > 0 ? `${underReviewCount} under review` : null,
    rejectedCount > 0 ? `${rejectedCount} rejected` : null,
    notUploadedCount > 0 ? `${notUploadedCount} not uploaded` : null,
  ]
    .filter(Boolean)
    .join(' · ');

  const handleFilesChange = (id: DocId, files: File[]) => {
    setDocs((prev) => ({
      ...prev,
      [id]: files.length === 0 ? { status: 'not_uploaded' } : { status: 'under_review', file: files[0], updatedOn: today() },
    }));
  };

  return (
    <div className={styles.page}>
      <div className={styles.intro}>
        <h1 className={styles.title}>Document verification</h1>
        <p className={styles.subtitle}>Upload the documents below so we can verify your identity. Each one is reviewed separately.</p>
      </div>

      <Card className={styles.progressCard}>
        <CardHeader>
          <CardTitle level={2}>Verification progress</CardTitle>
          <CardDescription>{summary}</CardDescription>
        </CardHeader>
        <CardContent>
          <ProgressBar label="Documents approved" value={percent} showValue valueLabel={`${approvedCount} of ${total}`} />
        </CardContent>
      </Card>

      <div className={styles.grid}>
        {DOCUMENT_TYPES.map((doc) => {
          const record = docs[doc.id];
          const meta = STATUS_META[record.status];
          const entries: FileUploadEntry[] = record.file
            ? [{ file: record.file, progress: 100, error: record.status === 'rejected' ? record.reason : undefined }]
            : [];
          const caption = captionFor(record);

          return (
            <Card key={doc.id} className={styles.docCard}>
              <CardHeader>
                <CardTitle level={2}>{doc.title}</CardTitle>
                <CardDescription>{doc.description}</CardDescription>
                <CardAction>
                  <Badge variant="status" tone={meta.tone}>
                    {meta.label}
                  </Badge>
                </CardAction>
              </CardHeader>
              <CardContent className={styles.docContent}>
                <FileUpload
                  label={record.status === 'not_uploaded' ? `Upload ${doc.title.toLowerCase()}` : `Replace ${doc.title.toLowerCase()}`}
                  acceptedFileTypes={['image/*', '.pdf']}
                  maxSize={10 * 1024 * 1024}
                  files={entries}
                  onChange={(files) => handleFilesChange(doc.id, files)}
                />
                {caption && <p className={styles.caption}>{caption}</p>}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

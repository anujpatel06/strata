'use client';

import { useId, useState, type ReactNode } from 'react';
import {
  Alert,
  Badge,
  Button,
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  Eyebrow,
  FileUpload,
  IconTile,
  ProgressBar,
} from '@syntara/react';
import {
  IconBuildingBank,
  IconCircleCheck,
  IconClock,
  IconCircleX,
  IconFingerprint,
  IconMapPin,
  IconPhoto,
} from '@syntara/icons';
import styles from './Screen.module.css';

type DocStatus = 'not-uploaded' | 'review' | 'approved' | 'rejected';

interface DocumentItem {
  id: string;
  title: string;
  description: string;
  icon: ReactNode;
  status: DocStatus;
  fileName?: string;
  submittedOn?: string;
  rejectionReason?: string;
}

const INITIAL_DOCUMENTS: DocumentItem[] = [
  {
    id: 'id-proof',
    title: 'ID proof',
    description: 'A government-issued photo ID, such as a passport or driving licence.',
    icon: <IconFingerprint aria-hidden />,
    status: 'approved',
    fileName: 'aadhaar-card.pdf',
    submittedOn: '12 Sep 2026',
  },
  {
    id: 'address-proof',
    title: 'Address proof',
    description: 'A utility bill or bank letter dated within the last 3 months.',
    icon: <IconMapPin aria-hidden />,
    status: 'review',
    fileName: 'electricity-bill.pdf',
    submittedOn: '24 Sep 2026',
  },
  {
    id: 'bank-statement',
    title: 'Bank statement',
    description: 'Your most recent statement showing name and account number.',
    icon: <IconBuildingBank aria-hidden />,
    status: 'rejected',
    fileName: 'bank-statement-aug.pdf',
    submittedOn: '18 Sep 2026',
    rejectionReason: 'Statement is dated more than 3 months ago. Upload one dated within the last 90 days.',
  },
  {
    id: 'photo',
    title: 'Photo',
    description: 'A recent, clear photo of your face against a plain background.',
    icon: <IconPhoto aria-hidden />,
    status: 'not-uploaded',
  },
];

const STATUS_META: Record<DocStatus, { label: string; tone: 'neutral' | 'info' | 'success' | 'danger' }> = {
  'not-uploaded': { label: 'Not uploaded', tone: 'neutral' },
  review: { label: 'Under review', tone: 'info' },
  approved: { label: 'Approved', tone: 'success' },
  rejected: { label: 'Rejected', tone: 'danger' },
};

function StatusIcon({ status }: { status: DocStatus }) {
  switch (status) {
    case 'approved':
      return <IconCircleCheck aria-hidden className={styles.approvedIcon} />;
    case 'review':
      return <IconClock aria-hidden className={styles.reviewIcon} />;
    case 'rejected':
      return <IconCircleX aria-hidden className={styles.rejectedIcon} />;
    default:
      return null;
  }
}

export default function Screen() {
  const [documents, setDocuments] = useState<DocumentItem[]>(INITIAL_DOCUMENTS);
  const [replacingId, setReplacingId] = useState<string | null>(null);
  const headingId = useId();

  const total = documents.length;
  const approvedCount = documents.filter((d) => d.status === 'approved').length;
  const reviewCount = documents.filter((d) => d.status === 'review').length;
  const rejectedCount = documents.filter((d) => d.status === 'rejected').length;
  const notUploadedCount = documents.filter((d) => d.status === 'not-uploaded').length;

  const handleUpload = (id: string, files: File[]) => {
    const file = files[0];
    if (!file) return;
    setDocuments((prev) =>
      prev.map((doc) =>
        doc.id === id
          ? {
              ...doc,
              status: 'review',
              fileName: file.name,
              submittedOn: 'Today',
              rejectionReason: undefined,
            }
          : doc,
      ),
    );
    setReplacingId(null);
  };

  return (
    <div className={styles.page} aria-labelledby={headingId}>
      <div className={styles.intro}>
        <Eyebrow lead="rule">Account verification</Eyebrow>
        <h1 id={headingId} className={styles.title}>
          Document verification
        </h1>
        <p className={styles.subtitle}>Upload the documents below to verify your account. Each is reviewed within 2 business days.</p>
      </div>

      <Card className={styles.progressCard}>
        <CardHeader>
          <CardTitle level={2}>Overall progress</CardTitle>
        </CardHeader>
        <CardContent className={styles.progressContent}>
          <ProgressBar
            label="Documents approved"
            value={approvedCount}
            minValue={0}
            maxValue={total}
            valueLabel={`${approvedCount} of ${total}`}
            showValue
            tone={rejectedCount > 0 ? 'warning' : 'default'}
          />
          <div className={styles.statusCounts}>
            <Badge variant="status" tone="success">
              {approvedCount} approved
            </Badge>
            <Badge variant="status" tone="info">
              {reviewCount} under review
            </Badge>
            <Badge variant="status" tone="danger">
              {rejectedCount} rejected
            </Badge>
            <Badge variant="status" tone="neutral">
              {notUploadedCount} not uploaded
            </Badge>
          </div>
        </CardContent>
      </Card>

      <div className={styles.grid}>
        {documents.map((doc) => {
          const meta = STATUS_META[doc.status];
          const isReplacing = replacingId === doc.id;
          const needsUpload = doc.status === 'not-uploaded' || isReplacing;

          return (
            <Card key={doc.id} className={styles.docCard}>
              <CardHeader className={styles.docHeader}>
                <div className={styles.docHeaderMain}>
                  <IconTile tint="none" size="md">
                    {doc.icon}
                  </IconTile>
                  <div>
                    <CardTitle level={3}>{doc.title}</CardTitle>
                    <p className={styles.docDescription}>{doc.description}</p>
                  </div>
                </div>
                <Badge variant="status" tone={meta.tone} icon={<StatusIcon status={doc.status} />}>
                  {meta.label}
                </Badge>
              </CardHeader>

              <CardContent className={styles.docContent}>
                {doc.status === 'rejected' && doc.rejectionReason && (
                  <Alert tone="danger" title="Rejected">
                    {doc.rejectionReason}
                  </Alert>
                )}

                {doc.fileName && !isReplacing && (
                  <div className={styles.fileRow}>
                    <span className={styles.fileName}>{doc.fileName}</span>
                    {doc.submittedOn && <span className={styles.fileMeta}>Submitted {doc.submittedOn}</span>}
                  </div>
                )}

                {needsUpload && (
                  <FileUpload
                    key={`${doc.id}-${doc.status}-${isReplacing}`}
                    label={doc.fileName ? `Replace ${doc.title.toLowerCase()}` : `Upload ${doc.title.toLowerCase()}`}
                    acceptedFileTypes={['image/*', '.pdf']}
                    maxSize={10 * 1024 * 1024}
                    onChange={(files) => handleUpload(doc.id, files)}
                    style={{ inlineSize: '100%' }}
                  />
                )}
              </CardContent>

              {doc.fileName && !needsUpload && (
                <CardFooter divider className={styles.docFooter}>
                  <Button variant="outline" size="sm" onPress={() => setReplacingId(doc.id)}>
                    Replace document
                  </Button>
                </CardFooter>
              )}

              {isReplacing && (
                <CardFooter divider className={styles.docFooter}>
                  <Button variant="ghost" size="sm" onPress={() => setReplacingId(null)}>
                    Cancel
                  </Button>
                </CardFooter>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}

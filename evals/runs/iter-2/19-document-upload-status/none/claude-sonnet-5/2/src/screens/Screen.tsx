import { useMemo, useState, type ReactNode } from 'react';
import {
  Alert,
  Badge,
  type BadgeTone,
  Button,
  Card,
  CardContent,
  CardHeader,
  FileUpload,
  IconTile,
  ProgressBar,
} from '@strata/react';
import {
  IconBuildingBank,
  IconCamera,
  IconCircleCheck,
  IconCircleX,
  IconClock,
  IconFingerprint,
  IconHome,
} from '@strata/icons';
import styles from './Screen.module.css';

type DocumentStatus = 'not_uploaded' | 'under_review' | 'approved' | 'rejected';

interface DocumentItem {
  id: string;
  title: string;
  description: string;
  icon: ReactNode;
  status: DocumentStatus;
  fileName?: string;
  fileSize?: number;
  uploadedAt?: string;
  reason?: string;
}

const initialDocuments: DocumentItem[] = [
  {
    id: 'id-proof',
    title: 'ID proof',
    description: 'A government-issued photo ID, such as a passport, Aadhaar or driving licence.',
    icon: <IconFingerprint />,
    status: 'approved',
    fileName: 'passport-anuj.pdf',
    fileSize: 2_355_000,
    uploadedAt: '2026-09-12T10:30:00Z',
  },
  {
    id: 'address-proof',
    title: 'Address proof',
    description: 'A utility bill, rent agreement or bank letter showing your current address.',
    icon: <IconHome />,
    status: 'rejected',
    fileName: 'utility-bill.jpg',
    fileSize: 1_120_000,
    uploadedAt: '2026-09-20T09:12:00Z',
    reason: 'The document is more than 3 months old. Upload a bill dated within the last 90 days.',
  },
  {
    id: 'bank-statement',
    title: 'Bank statement',
    description: 'Your latest bank statement covering the last 3 months, showing your name and account number.',
    icon: <IconBuildingBank />,
    status: 'under_review',
    fileName: 'statement-aug-2026.pdf',
    fileSize: 3_050_000,
    uploadedAt: '2026-09-25T14:05:00Z',
  },
  {
    id: 'photo',
    title: 'Photo',
    description: 'A clear, recent photo of yourself against a plain background.',
    icon: <IconCamera />,
    status: 'not_uploaded',
  },
];

const statusMeta: Record<DocumentStatus, { label: string; tone: BadgeTone; icon: ReactNode }> = {
  not_uploaded: { label: 'Not uploaded', tone: 'neutral', icon: undefined },
  under_review: { label: 'Under review', tone: 'info', icon: <IconClock /> },
  approved: { label: 'Approved', tone: 'success', icon: <IconCircleCheck /> },
  rejected: { label: 'Rejected', tone: 'danger', icon: <IconCircleX /> },
};

function formatFileSize(bytes: number): string {
  if (bytes >= 1_000_000) return `${(bytes / 1_000_000).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1000))} KB`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function Screen() {
  const [documents, setDocuments] = useState<DocumentItem[]>(initialDocuments);
  const [uploadingId, setUploadingId] = useState<string | null>(null);

  const approvedCount = useMemo(() => documents.filter((d) => d.status === 'approved').length, [documents]);
  const total = documents.length;
  const progressPercent = Math.round((approvedCount / total) * 100);
  const allApproved = approvedCount === total;

  function handleFilesChange(id: string, files: File[]) {
    const file = files[files.length - 1];
    if (!file) return;
    setDocuments((prev) =>
      prev.map((doc) =>
        doc.id === id
          ? {
              ...doc,
              status: 'under_review',
              fileName: file.name,
              fileSize: file.size,
              uploadedAt: new Date().toISOString(),
              reason: undefined,
            }
          : doc,
      ),
    );
    setUploadingId(null);
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Document verification</h1>
        <p className={styles.description}>
          Upload the documents below so we can verify your identity. Each document is reviewed within 1–2 business
          days.
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
          <p className={styles.progressMeta}>
            {approvedCount} of {total} documents approved
          </p>
        </CardContent>
      </Card>

      {allApproved && (
        <Alert tone="success" title="All documents verified" className={styles.summaryAlert}>
          You're all set. There's nothing left for you to upload.
        </Alert>
      )}

      <div className={styles.grid}>
        {documents.map((doc) => {
          const meta = statusMeta[doc.status];
          const isUploading = uploadingId === doc.id;
          const showUploader = doc.status === 'not_uploaded' || doc.status === 'rejected' || isUploading;

          return (
            <Card key={doc.id} className={styles.card}>
              <CardHeader className={styles.cardHeader}>
                <div className={styles.cardHeaderMain}>
                  <IconTile size="md">{doc.icon}</IconTile>
                  <div>
                    <div className={styles.cardTitleRow}>
                      <h2 className={styles.cardTitle}>{doc.title}</h2>
                      <Badge tone={meta.tone} variant="soft" size="sm" icon={meta.icon}>
                        {meta.label}
                      </Badge>
                    </div>
                    <p className={styles.cardDescription}>{doc.description}</p>
                  </div>
                </div>
              </CardHeader>

              <CardContent className={styles.cardContent}>
                {doc.status === 'rejected' && doc.reason && (
                  <Alert tone="danger" title="Rejected" className={styles.reasonAlert}>
                    {doc.reason}
                  </Alert>
                )}

                {doc.fileName && (
                  <div className={styles.fileRow}>
                    <div className={styles.fileInfo}>
                      <span className={styles.fileName}>{doc.fileName}</span>
                      <span className={styles.fileMeta}>
                        {doc.fileSize ? formatFileSize(doc.fileSize) : null}
                        {doc.fileSize && doc.uploadedAt ? ' · ' : null}
                        {doc.uploadedAt ? `Uploaded ${formatDate(doc.uploadedAt)}` : null}
                      </span>
                    </div>
                    {(doc.status === 'approved' || doc.status === 'under_review') && !isUploading && (
                      <Button variant="outline" size="sm" onPress={() => setUploadingId(doc.id)}>
                        Replace
                      </Button>
                    )}
                  </div>
                )}

                {showUploader && (
                  <FileUpload
                    className={styles.uploader}
                    label={doc.fileName ? `Replace ${doc.title.toLowerCase()}` : `Upload ${doc.title.toLowerCase()}`}
                    acceptedFileTypes={['image/*', '.pdf']}
                    maxSize={10 * 1024 * 1024}
                    browseLabel="browse"
                    dropLabel="Drag a file here or"
                    onChange={(files) => handleFilesChange(doc.id, files)}
                  />
                )}

                {isUploading && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className={styles.cancelReplace}
                    onPress={() => setUploadingId(null)}
                  >
                    Cancel
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

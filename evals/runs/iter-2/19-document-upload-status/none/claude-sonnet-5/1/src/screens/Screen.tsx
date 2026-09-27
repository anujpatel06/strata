import { useMemo, useState, type ReactNode } from 'react';
import {
  Alert,
  Badge,
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  FileUpload,
  IconTile,
  ProgressBar,
  type BadgeTone,
} from '@strata/react';
import {
  IconBuildingBank,
  IconCamera,
  IconCircleCheck,
  IconClock,
  IconCircleX,
  IconFileText,
  IconHome,
} from '@strata/icons';
import styles from './Screen.module.css';

type DocumentStatus = 'not_uploaded' | 'under_review' | 'approved' | 'rejected';

interface DocumentState {
  id: string;
  label: string;
  description: string;
  icon: ReactNode;
  acceptedFileTypes: string[];
  status: DocumentStatus;
  file?: File;
  rejectionReason?: string;
  reviewedOn?: string;
}

function mockFile(name: string, type: string, kilobytes: number): File {
  return new File([new Uint8Array(kilobytes * 1024)], name, { type });
}

const initialDocuments: DocumentState[] = [
  {
    id: 'id-proof',
    label: 'ID proof',
    description: 'A government-issued photo ID, such as a passport or driving licence.',
    icon: <IconFileText />,
    acceptedFileTypes: ['application/pdf', 'image/*'],
    status: 'approved',
    file: mockFile('aadhaar-card.pdf', 'application/pdf', 420),
    reviewedOn: '22 Sep 2026',
  },
  {
    id: 'address-proof',
    label: 'Address proof',
    description: 'A utility bill or bank letter from the last 3 months showing your address.',
    icon: <IconHome />,
    acceptedFileTypes: ['application/pdf', 'image/*'],
    status: 'under_review',
    file: mockFile('utility-bill.pdf', 'application/pdf', 260),
  },
  {
    id: 'bank-statement',
    label: 'Bank statement',
    description: 'A statement from the last 3 months showing your name and account number.',
    icon: <IconBuildingBank />,
    acceptedFileTypes: ['application/pdf'],
    status: 'rejected',
    file: mockFile('bank-statement-jan.pdf', 'application/pdf', 540),
    rejectionReason: 'This statement is dated more than 90 days ago. Upload one from the last 3 months.',
    reviewedOn: '24 Sep 2026',
  },
  {
    id: 'photo',
    label: 'Photo',
    description: 'A clear, recent photo of your face against a plain background.',
    icon: <IconCamera />,
    acceptedFileTypes: ['image/*'],
    status: 'not_uploaded',
  },
];

const statusMeta: Record<DocumentStatus, { label: string; tone: BadgeTone; icon: ReactNode }> = {
  not_uploaded: { label: 'Not uploaded', tone: 'neutral', icon: undefined },
  under_review: { label: 'Under review', tone: 'info', icon: <IconClock /> },
  approved: { label: 'Approved', tone: 'success', icon: <IconCircleCheck /> },
  rejected: { label: 'Rejected', tone: 'danger', icon: <IconCircleX /> },
};

export default function Screen() {
  const [documents, setDocuments] = useState<DocumentState[]>(initialDocuments);

  const approvedCount = useMemo(
    () => documents.filter((doc) => doc.status === 'approved').length,
    [documents],
  );
  const allApproved = approvedCount === documents.length;

  function handleFilesChange(id: string, files: File[]) {
    setDocuments((prev) =>
      prev.map((doc) => {
        if (doc.id !== id) return doc;
        const file = files[0];
        if (!file) {
          return { ...doc, file: undefined, status: 'not_uploaded', rejectionReason: undefined, reviewedOn: undefined };
        }
        return { ...doc, file, status: 'under_review', rejectionReason: undefined, reviewedOn: undefined };
      }),
    );
  }

  return (
    <div className={styles.screen}>
      <header className={styles.header}>
        <h1 className={styles.title}>
          Document verification
        </h1>
        <p className={styles.subtitle}>
          Upload the documents below so we can verify your identity. Each document is reviewed
          separately, so you can continue while others are being checked.
        </p>
      </header>

      <Card>
        <CardContent className={styles.progressContent}>
          <ProgressBar
            label="Verification progress"
            value={approvedCount}
            maxValue={documents.length}
            showValue
            tone={allApproved ? 'success' : 'default'}
          />
          <p className={styles.progressCaption}>
            {allApproved
              ? 'All documents are approved.'
              : `${approvedCount} of ${documents.length} documents approved.`}
          </p>
        </CardContent>
      </Card>

      <ul className={styles.grid}>
        {documents.map((doc) => {
          const meta = statusMeta[doc.status];
          return (
            <li key={doc.id}>
              <Card className={styles.docCard}>
                <CardHeader>
                  <div className={styles.docHeaderMain}>
                    <IconTile tint="brand" size="md">
                      {doc.icon}
                    </IconTile>
                    <div className={styles.docHeaderText}>
                      <CardTitle level={2} className={styles.docTitle}>
                        {doc.label}
                      </CardTitle>
                      <CardDescription>{doc.description}</CardDescription>
                    </div>
                  </div>
                  <CardAction>
                    <Badge tone={meta.tone} variant="soft" icon={meta.icon}>
                      {meta.label}
                    </Badge>
                  </CardAction>
                </CardHeader>

                <CardContent className={styles.docContent}>
                  {doc.status === 'rejected' && doc.rejectionReason ? (
                    <Alert tone="danger" title="Rejected" className={styles.docAlert}>
                      {doc.rejectionReason}
                    </Alert>
                  ) : null}

                  {doc.reviewedOn ? (
                    <p className={styles.reviewedOn}>Reviewed on {doc.reviewedOn}</p>
                  ) : null}

                  <FileUpload
                    label={doc.file ? 'Replace document' : 'Upload document'}
                    acceptedFileTypes={doc.acceptedFileTypes}
                    files={doc.file ? [doc.file] : []}
                    onChange={(files) => handleFilesChange(doc.id, files)}
                    maxSize={10 * 1024 * 1024}
                  />
                </CardContent>
              </Card>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

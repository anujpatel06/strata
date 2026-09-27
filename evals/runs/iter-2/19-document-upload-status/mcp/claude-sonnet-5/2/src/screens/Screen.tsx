import { useState, type ReactNode } from 'react';
import {
  Alert,
  Badge,
  Button,
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
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
  IconFileText,
  IconFingerprint,
  IconHome,
} from '@strata/icons';
import styles from './Screen.module.css';

type DocStatus = 'not_uploaded' | 'under_review' | 'approved' | 'rejected';

interface DocumentType {
  id: string;
  title: string;
  description: string;
  icon: ReactNode;
  acceptedFileTypes: string[];
  hint: string;
}

interface DocumentState {
  status: DocStatus;
  fileName: string | null;
  submittedOn: string | null;
  rejectionReason: string | null;
}

const DOCUMENT_TYPES: DocumentType[] = [
  {
    id: 'id-proof',
    title: 'ID proof',
    description: 'A government-issued photo ID: passport, driving licence or national ID card.',
    icon: <IconFingerprint aria-hidden />,
    acceptedFileTypes: ['image/*', '.pdf'],
    hint: 'JPG, PNG or PDF, up to 10 MB',
  },
  {
    id: 'address-proof',
    title: 'Address proof',
    description: 'A utility bill or bank letter dated within the last 3 months.',
    icon: <IconHome aria-hidden />,
    acceptedFileTypes: ['image/*', '.pdf'],
    hint: 'JPG, PNG or PDF, up to 10 MB',
  },
  {
    id: 'bank-statement',
    title: 'Bank statement',
    description: 'Your most recent statement, showing your name and account number.',
    icon: <IconBuildingBank aria-hidden />,
    acceptedFileTypes: ['.pdf'],
    hint: 'PDF, up to 10 MB',
  },
  {
    id: 'photo',
    title: 'Photo',
    description: 'A recent, clear photo of your face for identity matching.',
    icon: <IconCamera aria-hidden />,
    acceptedFileTypes: ['image/*'],
    hint: 'JPG or PNG, up to 5 MB',
  },
];

const INITIAL_STATE: Record<string, DocumentState> = {
  'id-proof': {
    status: 'approved',
    fileName: 'passport-anuj-patel.pdf',
    submittedOn: '12 Sep 2026',
    rejectionReason: null,
  },
  'address-proof': {
    status: 'under_review',
    fileName: 'electricity-bill-august.pdf',
    submittedOn: '24 Sep 2026',
    rejectionReason: null,
  },
  'bank-statement': {
    status: 'rejected',
    fileName: 'bank-statement-june.pdf',
    submittedOn: '18 Sep 2026',
    rejectionReason: 'The statement is dated more than 3 months ago. Upload one dated within the last 90 days.',
  },
  photo: {
    status: 'not_uploaded',
    fileName: null,
    submittedOn: null,
    rejectionReason: null,
  },
};

const STATUS_META: Record<DocStatus, { label: string; tone: 'neutral' | 'info' | 'success' | 'danger'; icon?: ReactNode }> = {
  not_uploaded: { label: 'Not uploaded', tone: 'neutral' },
  under_review: { label: 'Under review', tone: 'info', icon: <IconClock aria-hidden /> },
  approved: { label: 'Approved', tone: 'success', icon: <IconCircleCheck aria-hidden /> },
  rejected: { label: 'Rejected', tone: 'danger', icon: <IconCircleX aria-hidden /> },
};

function todayLabel(): string {
  return new Intl.DateTimeFormat('en', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date());
}

export default function Screen() {
  const [documents, setDocuments] = useState(INITIAL_STATE);

  const approvedCount = DOCUMENT_TYPES.filter((doc) => documents[doc.id].status === 'approved').length;
  const total = DOCUMENT_TYPES.length;

  const handleUpload = (id: string, files: File[]) => {
    const file = files[0];
    if (!file) return;
    setDocuments((prev) => ({
      ...prev,
      [id]: { status: 'under_review', fileName: file.name, submittedOn: todayLabel(), rejectionReason: null },
    }));
  };

  return (
    <div className={styles.page}>
      <header className={styles.intro}>
        <h1 className={styles.title}>Document verification</h1>
        <p className={styles.subtitle}>
          Upload the documents below so we can verify your identity. Each one is reviewed separately, and you can
          replace a document at any time.
        </p>
      </header>

      <Card className={styles.progressCard}>
        <CardHeader>
          <CardTitle level={2}>Verification progress</CardTitle>
          <CardDescription>{`${approvedCount} of ${total} documents approved`}</CardDescription>
        </CardHeader>
        <CardContent className={styles.progressContent}>
          <ProgressBar
            label="Documents approved"
            value={approvedCount}
            minValue={0}
            maxValue={total}
            valueLabel={`${approvedCount} of ${total}`}
            showValue
            tone={approvedCount === total ? 'success' : 'default'}
          />
          <ul className={styles.summaryList}>
            {DOCUMENT_TYPES.map((doc) => {
              const meta = STATUS_META[documents[doc.id].status];
              return (
                <li key={doc.id} className={styles.summaryItem}>
                  <span className={styles.summaryLabel}>{doc.title}</span>
                  <Badge variant="status" tone={meta.tone}>
                    {meta.label}
                  </Badge>
                </li>
              );
            })}
          </ul>
        </CardContent>
      </Card>

      <div className={styles.grid}>
        {DOCUMENT_TYPES.map((doc) => (
          <DocumentCard key={doc.id} doc={doc} state={documents[doc.id]} onUpload={(files) => handleUpload(doc.id, files)} />
        ))}
      </div>
    </div>
  );
}

function DocumentCard({
  doc,
  state,
  onUpload,
}: {
  doc: DocumentType;
  state: DocumentState;
  onUpload: (files: File[]) => void;
}) {
  const [picking, setPicking] = useState(state.status === 'not_uploaded');
  const meta = STATUS_META[state.status];
  const hasFile = state.status !== 'not_uploaded';
  const showPicker = picking || !hasFile;

  return (
    <Card className={styles.docCard}>
      <CardHeader>
        <div className={styles.docHeading}>
          <IconTile tint="auto" name={doc.title} size="sm">
            {doc.icon}
          </IconTile>
          <div className={styles.docHeadingText}>
            <CardTitle level={3}>{doc.title}</CardTitle>
            <CardDescription>{doc.description}</CardDescription>
          </div>
        </div>
        <CardAction>
          <Badge tone={meta.tone} icon={meta.icon}>
            {meta.label}
          </Badge>
        </CardAction>
      </CardHeader>
      <CardContent className={styles.docContent}>
        {state.status === 'rejected' && state.rejectionReason && (
          <Alert tone="danger" title="Resubmission needed">
            {state.rejectionReason}
          </Alert>
        )}

        {hasFile && !picking && (
          <div className={styles.fileSummary}>
            <IconFileText aria-hidden className={styles.fileIcon} />
            <div className={styles.fileMeta}>
              <p className={styles.fileName}>{state.fileName}</p>
              <p className={styles.fileDate}>{`Submitted ${state.submittedOn}`}</p>
            </div>
          </div>
        )}

        {showPicker && (
          <FileUpload
            label={hasFile ? `Replace ${doc.title.toLowerCase()}` : `Upload ${doc.title.toLowerCase()}`}
            hint={doc.hint}
            acceptedFileTypes={doc.acceptedFileTypes}
            maxSize={10 * 1024 * 1024}
            onChange={(files) => {
              onUpload(files);
              setPicking(false);
            }}
          />
        )}
      </CardContent>
      {hasFile && (
        <CardFooter divider className={styles.docFooter}>
          {picking ? (
            <Button variant="outline" size="sm" onPress={() => setPicking(false)}>
              Cancel
            </Button>
          ) : (
            <Button variant="outline" size="sm" onPress={() => setPicking(true)}>
              Replace document
            </Button>
          )}
        </CardFooter>
      )}
    </Card>
  );
}

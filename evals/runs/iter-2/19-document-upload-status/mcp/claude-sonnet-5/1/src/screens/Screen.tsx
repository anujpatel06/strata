import { useState, type ReactNode } from 'react';
import {
  Alert,
  Badge,
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Eyebrow,
  FileUpload,
  IconTile,
  ProgressBar,
} from '@strata/react';
import { IconBuildingBank, IconCamera, IconFileText, IconHome } from '@strata/icons';
import styles from './Screen.module.css';

type DocStatus = 'not-uploaded' | 'under-review' | 'approved' | 'rejected';

interface DocumentConfig {
  id: string;
  title: string;
  description: string;
  icon: ReactNode;
  acceptedFileTypes: string[];
}

interface DocumentState {
  status: DocStatus;
  file: File | null;
  note: string | null;
  reason: string | null;
}

const DOCUMENTS: DocumentConfig[] = [
  {
    id: 'id-proof',
    title: 'ID proof',
    description: 'A government-issued photo ID, such as a passport or driving licence.',
    icon: <IconFileText />,
    acceptedFileTypes: ['image/*', '.pdf'],
  },
  {
    id: 'address-proof',
    title: 'Address proof',
    description: 'A utility bill or bank letter from the last 3 months.',
    icon: <IconHome />,
    acceptedFileTypes: ['image/*', '.pdf'],
  },
  {
    id: 'bank-statement',
    title: 'Bank statement',
    description: 'Your most recent statement, showing your name and account number.',
    icon: <IconBuildingBank />,
    acceptedFileTypes: ['image/*', '.pdf'],
  },
  {
    id: 'photo',
    title: 'Photo',
    description: 'A recent, clearly lit photo of your face.',
    icon: <IconCamera />,
    acceptedFileTypes: ['image/*'],
  },
];

const STATUS_META: Record<DocStatus, { label: string; tone: 'neutral' | 'info' | 'success' | 'danger' }> = {
  'not-uploaded': { label: 'Not uploaded', tone: 'neutral' },
  'under-review': { label: 'Under review', tone: 'info' },
  approved: { label: 'Approved', tone: 'success' },
  rejected: { label: 'Rejected', tone: 'danger' },
};

function mockFile(name: string, type: string): File {
  return new File([new Uint8Array(64 * 1024)], name, { type });
}

const INITIAL_STATE: Record<string, DocumentState> = {
  'id-proof': {
    status: 'approved',
    file: mockFile('passport.pdf', 'application/pdf'),
    note: 'Verified on 12 Sep 2026',
    reason: null,
  },
  'address-proof': {
    status: 'under-review',
    file: mockFile('electricity-bill.pdf', 'application/pdf'),
    note: 'Submitted on 25 Sep 2026',
    reason: null,
  },
  'bank-statement': {
    status: 'rejected',
    file: mockFile('bank-statement-jan.pdf', 'application/pdf'),
    note: 'Reviewed on 20 Sep 2026',
    reason: 'The statement is dated more than 3 months ago. Upload one issued within the last 90 days.',
  },
  photo: {
    status: 'not-uploaded',
    file: null,
    note: null,
    reason: null,
  },
};

export default function Screen() {
  const [documents, setDocuments] = useState(INITIAL_STATE);

  const approvedCount = DOCUMENTS.filter((doc) => documents[doc.id].status === 'approved').length;

  const handleFilesChange = (id: string, files: File[]) => {
    const file = files[0] ?? null;
    setDocuments((prev) => ({
      ...prev,
      [id]: file
        ? { status: 'under-review', file, note: 'Submitted just now', reason: null }
        : { status: 'not-uploaded', file: null, note: null, reason: null },
    }));
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Eyebrow lead="rule">Onboarding</Eyebrow>
        <h1 className={styles.title}>Document verification</h1>
        <p className={styles.intro}>
          Upload the documents below so we can verify your identity. Each one is reviewed within 1–2 business
          days.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle level={2}>Verification progress</CardTitle>
          <CardDescription>{approvedCount} of {DOCUMENTS.length} documents approved</CardDescription>
        </CardHeader>
        <CardContent className={styles.progressContent}>
          <ProgressBar
            label="Documents approved"
            value={approvedCount}
            maxValue={DOCUMENTS.length}
            valueLabel={`${approvedCount} of ${DOCUMENTS.length}`}
            showValue
            tone={approvedCount === DOCUMENTS.length ? 'success' : 'default'}
          />
          <div className={styles.summary}>
            {DOCUMENTS.map((doc) => {
              const meta = STATUS_META[documents[doc.id].status];
              return (
                <Badge key={doc.id} variant="status" tone={meta.tone}>
                  {doc.title}: {meta.label}
                </Badge>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className={styles.grid}>
        {DOCUMENTS.map((doc) => {
          const state = documents[doc.id];
          const meta = STATUS_META[state.status];
          return (
            <Card key={doc.id}>
              <CardHeader>
                <div className={styles.cardHeading}>
                  <IconTile tint="auto" name={doc.title}>{doc.icon}</IconTile>
                  <div>
                    <CardTitle level={3}>{doc.title}</CardTitle>
                    <CardDescription>{doc.description}</CardDescription>
                  </div>
                </div>
                <CardAction>
                  <Badge variant="status" tone={meta.tone}>{meta.label}</Badge>
                </CardAction>
              </CardHeader>
              <CardContent className={styles.cardContent}>
                {state.reason ? (
                  <Alert tone="danger" title="Why this was rejected">
                    {state.reason}
                  </Alert>
                ) : null}
                <p className={styles.meta}>
                  {state.file ? `${state.file.name} · ${state.note}` : 'No file uploaded yet'}
                </p>
                <FileUpload
                  label={state.file ? 'Replace document' : 'Upload document'}
                  acceptedFileTypes={doc.acceptedFileTypes}
                  maxSize={10 * 1024 * 1024}
                  files={state.file ? [{ file: state.file, progress: 100 }] : []}
                  onChange={(files) => handleFilesChange(doc.id, files)}
                />
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

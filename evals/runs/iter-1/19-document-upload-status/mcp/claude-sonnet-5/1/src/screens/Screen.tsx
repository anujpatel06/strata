import { useState } from 'react';
import {
  Alert,
  Badge,
  Button,
  Card,
  CardAction,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  FileUpload,
  IconTile,
  ProgressBar,
} from '@strata/react';
import {
  IconAlertCircle,
  IconBuildingBank,
  IconCamera,
  IconCircleCheck,
  IconClock,
  IconFileText,
  IconId,
} from '@strata/icons';
import styles from './Screen.module.css';

type DocStatus = 'not_uploaded' | 'pending' | 'approved' | 'rejected';

interface DocumentItem {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  status: DocStatus;
  fileName?: string;
  reason?: string;
}

const initialDocuments: DocumentItem[] = [
  {
    id: 'id-proof',
    title: 'ID proof',
    description: 'A government-issued photo ID: passport, driving licence or national ID card.',
    icon: <IconId />,
    status: 'approved',
    fileName: 'passport-anuj.pdf',
  },
  {
    id: 'address-proof',
    title: 'Address proof',
    description: 'A recent utility bill, bank letter or rental agreement showing your current address.',
    icon: <IconFileText />,
    status: 'pending',
    fileName: 'utility-bill-aug.pdf',
  },
  {
    id: 'bank-statement',
    title: 'Bank statement',
    description: 'Your most recent bank statement, dated within the last 3 months.',
    icon: <IconBuildingBank />,
    status: 'rejected',
    fileName: 'bank-statement-jan.pdf',
    reason: 'Statement is dated more than 3 months ago. Upload one from the last 90 days.',
  },
  {
    id: 'photo',
    title: 'Photo',
    description: 'A clear, recent photo of your face, used to match against your ID proof.',
    icon: <IconCamera />,
    status: 'not_uploaded',
  },
];

const statusMeta: Record<DocStatus, { label: string; tone: 'neutral' | 'info' | 'success' | 'danger' }> = {
  not_uploaded: { label: 'Not uploaded', tone: 'neutral' },
  pending: { label: 'Under review', tone: 'info' },
  approved: { label: 'Approved', tone: 'success' },
  rejected: { label: 'Rejected', tone: 'danger' },
};

export default function Screen() {
  const [documents, setDocuments] = useState(initialDocuments);
  const [replacingId, setReplacingId] = useState<string | null>(null);

  const approvedCount = documents.filter((doc) => doc.status === 'approved').length;
  const total = documents.length;

  const handleFileChange = (docId: string) => (files: File[]) => {
    const file = files[0];
    if (!file) return;
    setDocuments((prev) =>
      prev.map((doc) =>
        doc.id === docId ? { ...doc, status: 'pending', fileName: file.name, reason: undefined } : doc,
      ),
    );
    setReplacingId(null);
  };

  return (
    <div className={styles.page}>
      <div className={styles.heading}>
        <h1>Document verification</h1>
        <p className={styles.helpText}>
          Upload the documents below to verify your identity. Each is reviewed by our team, usually within
          1–2 business days.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle level={2}>Overall progress</CardTitle>
        </CardHeader>
        <CardContent>
          <ProgressBar
            label="Documents approved"
            value={approvedCount}
            minValue={0}
            maxValue={total}
            valueLabel={`${approvedCount} of ${total} approved`}
            showValue
            tone={approvedCount === total ? 'success' : 'default'}
          />
          <div className={styles.summaryRow}>
            {(['approved', 'pending', 'rejected', 'not_uploaded'] as DocStatus[]).map((status) => {
              const count = documents.filter((doc) => doc.status === status).length;
              if (count === 0) return null;
              return (
                <Badge key={status} variant="status" tone={statusMeta[status].tone}>
                  {count} {statusMeta[status].label.toLowerCase()}
                </Badge>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className={styles.grid}>
        {documents.map((doc) => {
          const meta = statusMeta[doc.status];
          const isReplacing = replacingId === doc.id;
          const showUpload = doc.status === 'not_uploaded' || isReplacing;

          return (
            <Card key={doc.id}>
              <CardHeader divider>
                <div className={styles.cardHeaderInner}>
                  <IconTile tint="auto" name={doc.title}>
                    {doc.icon}
                  </IconTile>
                  <div className={styles.cardHeaderText}>
                    <CardTitle level={3}>{doc.title}</CardTitle>
                    <p className={styles.helpText}>{doc.description}</p>
                  </div>
                </div>
                <CardAction>
                  <Badge variant="status" tone={meta.tone}>
                    {meta.label}
                  </Badge>
                </CardAction>
              </CardHeader>

              <CardContent className={styles.cardBody}>
                {doc.status === 'rejected' && doc.reason && (
                  <Alert tone="danger" title="Resubmission needed" icon={<IconAlertCircle aria-hidden />}>
                    {doc.reason}
                  </Alert>
                )}

                {doc.status === 'pending' && (
                  <Alert tone="info" title="Being reviewed" icon={<IconClock aria-hidden />}>
                    Our team is checking this document. We'll update its status once it's done.
                  </Alert>
                )}

                {doc.status === 'approved' && (
                  <Alert tone="success" title="Verified" icon={<IconCircleCheck aria-hidden />}>
                    This document has been approved.
                  </Alert>
                )}

                {doc.fileName && !showUpload && (
                  <div className={styles.fileRow}>
                    <IconFileText aria-hidden />
                    <span className={styles.fileName}>{doc.fileName}</span>
                  </div>
                )}

                {showUpload && (
                  <FileUpload
                    label={`Upload ${doc.title.toLowerCase()}`}
                    acceptedFileTypes={['image/png', 'image/jpeg', 'application/pdf']}
                    maxSize={10 * 1024 * 1024}
                    onChange={handleFileChange(doc.id)}
                  />
                )}
              </CardContent>

              <CardFooter divider>
                {showUpload ? (
                  isReplacing && (
                    <Button variant="ghost" size="sm" onPress={() => setReplacingId(null)}>
                      Cancel
                    </Button>
                  )
                ) : (
                  <Button variant="outline" size="sm" onPress={() => setReplacingId(doc.id)}>
                    Replace document
                  </Button>
                )}
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

import { useMemo, useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import styles from './Screen.module.css';

type DocStatus = 'not_uploaded' | 'under_review' | 'approved' | 'rejected';

interface DocumentItem {
  id: string;
  title: string;
  description: string;
  status: DocStatus;
  fileName?: string;
  updatedAt?: string;
  reason?: string;
}

const INITIAL_DOCUMENTS: DocumentItem[] = [
  {
    id: 'id-proof',
    title: 'ID proof',
    description: 'A government-issued ID such as a passport, driving licence or national ID card.',
    status: 'approved',
    fileName: 'aadhaar-card.pdf',
    updatedAt: '2 days ago',
  },
  {
    id: 'address-proof',
    title: 'Address proof',
    description: 'A recent utility bill, rental agreement or bank letter showing your current address.',
    status: 'rejected',
    fileName: 'electricity-bill.jpg',
    updatedAt: '1 day ago',
    reason: 'The document is blurry and the address is not clearly legible. Please upload a sharper copy.',
  },
  {
    id: 'bank-statement',
    title: 'Bank statement',
    description: 'A bank statement from the last 3 months showing your name and account number.',
    status: 'under_review',
    fileName: 'bank-statement-aug.pdf',
    updatedAt: '3 hours ago',
  },
  {
    id: 'photo',
    title: 'Photo',
    description: 'A clear, recent photo of yourself, taken against a plain background.',
    status: 'not_uploaded',
  },
];

const STATUS_META: Record<DocStatus, { label: string; tone: string }> = {
  not_uploaded: { label: 'Not uploaded', tone: styles.toneNeutral },
  under_review: { label: 'Under review', tone: styles.toneReview },
  approved: { label: 'Approved', tone: styles.toneApproved },
  rejected: { label: 'Rejected', tone: styles.toneRejected },
};

function StatusIcon({ status }: { status: DocStatus }) {
  switch (status) {
    case 'approved':
      return (
        <svg viewBox="0 0 20 20" width="14" height="14" aria-hidden="true">
          <path
            d="M4 10.5l3.5 3.5L16 5.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case 'rejected':
      return (
        <svg viewBox="0 0 20 20" width="14" height="14" aria-hidden="true">
          <path
            d="M5.5 5.5l9 9m0-9l-9 9"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      );
    case 'under_review':
      return (
        <svg viewBox="0 0 20 20" width="14" height="14" aria-hidden="true">
          <circle cx="10" cy="10" r="7" fill="none" stroke="currentColor" strokeWidth="1.6" />
          <path d="M10 6.2V10l2.6 1.6" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 20 20" width="14" height="14" aria-hidden="true">
          <circle cx="10" cy="10" r="7" fill="none" stroke="currentColor" strokeWidth="1.6" strokeDasharray="2.5 2.5" />
        </svg>
      );
  }
}

function DocGlyph({ id }: { id: string }) {
  const common = {
    width: 22,
    height: 22,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.6,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true as const,
  };
  switch (id) {
    case 'id-proof':
      return (
        <svg {...common}>
          <rect x="2.5" y="5" width="19" height="14" rx="2" />
          <circle cx="8.5" cy="11" r="2" />
          <path d="M5.5 16c.6-1.6 2-2.4 3-2.4s2.4.8 3 2.4" />
          <path d="M14.5 9.5h5M14.5 13h5" />
        </svg>
      );
    case 'address-proof':
      return (
        <svg {...common}>
          <path d="M4 11.5L12 4l8 7.5" />
          <path d="M6 10v9h12v-9" />
          <path d="M10 19v-5h4v5" />
        </svg>
      );
    case 'bank-statement':
      return (
        <svg {...common}>
          <path d="M4 10l8-5 8 5" />
          <path d="M5 10v8M9.5 10v8M14.5 10v8M19 10v8" />
          <path d="M4 18h16" />
        </svg>
      );
    case 'photo':
      return (
        <svg {...common}>
          <rect x="3" y="6" width="18" height="13" rx="2" />
          <path d="M8 6l1.4-2h5.2L16 6" />
          <circle cx="12" cy="12.5" r="3.3" />
        </svg>
      );
    default:
      return null;
  }
}

function UploadIcon() {
  return (
    <svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true">
      <path
        d="M10 13V4m0 0L6.5 7.5M10 4l3.5 3.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M4 14v1.5A1.5 1.5 0 005.5 17h9a1.5 1.5 0 001.5-1.5V14" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

export default function Screen() {
  const [documents, setDocuments] = useState<DocumentItem[]>(INITIAL_DOCUMENTS);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const { approvedCount, total, progressPercent, reviewCount, rejectedCount } = useMemo(() => {
    const total = documents.length;
    const approvedCount = documents.filter((d) => d.status === 'approved').length;
    const reviewCount = documents.filter((d) => d.status === 'under_review').length;
    const rejectedCount = documents.filter((d) => d.status === 'rejected').length;
    const progressPercent = total === 0 ? 0 : Math.round((approvedCount / total) * 100);
    return { approvedCount, total, progressPercent, reviewCount, rejectedCount };
  }, [documents]);

  const allApproved = approvedCount === total;

  const handleChooseFile = (id: string) => {
    fileInputRefs.current[id]?.click();
  };

  const handleFileSelected = (id: string, event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setDocuments((docs) =>
      docs.map((doc) =>
        doc.id === id
          ? { ...doc, status: 'under_review', fileName: file.name, updatedAt: 'Just now', reason: undefined }
          : doc,
      ),
    );
    event.target.value = '';
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.heading}>Document verification</h1>
        <p className={styles.subheading}>
          Upload the documents below so we can verify your identity. Approved documents are marked complete;
          rejected documents can be re-uploaded.
        </p>
      </header>

      <section className={styles.progressCard} aria-label="Overall verification progress">
        <div className={styles.progressTop}>
          <span className={styles.progressLabel}>
            {allApproved ? 'All documents verified' : `${approvedCount} of ${total} documents verified`}
          </span>
          <span className={styles.progressPercent}>{progressPercent}%</span>
        </div>
        <div
          className={styles.progressTrack}
          role="progressbar"
          aria-valuenow={progressPercent}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div className={styles.progressFill} style={{ inlineSize: `${progressPercent}%` }} />
        </div>
        <div className={styles.progressStats}>
          <span className={`${styles.statChip} ${styles.toneApproved}`}>{approvedCount} approved</span>
          <span className={`${styles.statChip} ${styles.toneReview}`}>{reviewCount} under review</span>
          <span className={`${styles.statChip} ${styles.toneRejected}`}>{rejectedCount} rejected</span>
        </div>
      </section>

      <ul className={styles.list}>
        {documents.map((doc) => {
          const meta = STATUS_META[doc.status];
          const actionLabel = doc.status === 'not_uploaded' ? 'Upload document' : 'Replace document';
          return (
            <li key={doc.id} className={styles.card}>
              <div className={styles.cardIcon} aria-hidden="true">
                <DocGlyph id={doc.id} />
              </div>

              <div className={styles.cardBody}>
                <div className={styles.cardTop}>
                  <h2 className={styles.cardTitle}>{doc.title}</h2>
                  <span className={`${styles.badge} ${meta.tone}`}>
                    <StatusIcon status={doc.status} />
                    {meta.label}
                  </span>
                </div>

                <p className={styles.cardDescription}>{doc.description}</p>

                {doc.fileName && (
                  <p className={styles.fileMeta}>
                    <span className={styles.fileName}>{doc.fileName}</span>
                    {doc.updatedAt && <span className={styles.fileUpdated}> · updated {doc.updatedAt}</span>}
                  </p>
                )}

                {doc.status === 'rejected' && doc.reason && (
                  <p className={styles.reason} role="alert">
                    <strong className={styles.reasonLabel}>Reason for rejection: </strong>
                    {doc.reason}
                  </p>
                )}

                <div className={styles.cardActions}>
                  <button
                    type="button"
                    className={styles.uploadButton}
                    onClick={() => handleChooseFile(doc.id)}
                  >
                    <UploadIcon />
                    {actionLabel}
                  </button>
                  <input
                    ref={(el) => {
                      fileInputRefs.current[doc.id] = el;
                    }}
                    className={styles.hiddenInput}
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={(event) => handleFileSelected(doc.id, event)}
                    aria-label={`${actionLabel} for ${doc.title}`}
                  />
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

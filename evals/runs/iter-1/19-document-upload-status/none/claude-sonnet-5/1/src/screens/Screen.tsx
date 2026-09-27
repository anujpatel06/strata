import { useEffect, useRef, useState } from 'react';
import styles from './Screen.module.css';

type DocStatus = 'not_uploaded' | 'pending' | 'approved' | 'rejected';

interface DocumentItem {
  id: string;
  title: string;
  description: string;
  accept: string;
  status: DocStatus;
  fileName?: string;
  reason?: string;
}

const REJECTION_REASONS = [
  'The image is blurry. Please upload a sharper copy.',
  "The document has expired. Please upload a valid one.",
  "We couldn't make out the details on this document.",
  'This file does not match the document type requested.',
];

const INITIAL_DOCUMENTS: DocumentItem[] = [
  {
    id: 'id_proof',
    title: 'ID proof',
    description: 'Passport, driving licence or national ID card',
    accept: 'image/*,.pdf',
    status: 'rejected',
    fileName: 'id_scan.jpg',
    reason: 'The ID number is not readable. Please upload a clearer photo.',
  },
  {
    id: 'address_proof',
    title: 'Address proof',
    description: 'Utility bill or bank letter from the last 3 months',
    accept: 'image/*,.pdf',
    status: 'approved',
    fileName: 'address_proof.pdf',
  },
  {
    id: 'bank_statement',
    title: 'Bank statement',
    description: 'Statement covering the last 3 months',
    accept: 'image/*,.pdf',
    status: 'pending',
    fileName: 'bank_statement_mar.pdf',
  },
  {
    id: 'photo',
    title: 'Photo',
    description: 'A recent passport-style photo of yourself',
    accept: 'image/*',
    status: 'not_uploaded',
  },
];

const STATUS_LABEL: Record<DocStatus, string> = {
  not_uploaded: 'Not uploaded',
  pending: 'Under review',
  approved: 'Approved',
  rejected: 'Rejected',
};

function DocIcon({ id }: { id: string }) {
  switch (id) {
    case 'id_proof':
      return (
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <rect x="2.5" y="4.5" width="19" height="15" rx="2" stroke="currentColor" strokeWidth="1.5" />
          <circle cx="8" cy="10.5" r="1.8" stroke="currentColor" strokeWidth="1.5" />
          <path d="M5 16c0-1.7 1.3-3 3-3s3 1.3 3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M13.5 9.5h6M13.5 12.5h6M13.5 15.5h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );
    case 'address_proof':
      return (
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M3.5 11 12 4l8.5 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M5.5 9.5V19a1 1 0 0 0 1 1H17.5a1 1 0 0 0 1-1V9.5" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
          <path d="M10 20v-5h4v5" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
        </svg>
      );
    case 'bank_statement':
      return (
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M3 9.5 12 4l9 5.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M4.5 9.5h15V19a1 1 0 0 1-1 1H5.5a1 1 0 0 1-1-1V9.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
          <path d="M8 13v4M12 13v4M16 13v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <rect x="2.5" y="5.5" width="19" height="13" rx="2" stroke="currentColor" strokeWidth="1.5" />
          <circle cx="12" cy="12" r="3.2" stroke="currentColor" strokeWidth="1.5" />
          <path d="M8 5.5 9.2 3.5h5.6L16 5.5" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
        </svg>
      );
  }
}

export default function Screen() {
  const [documents, setDocuments] = useState<DocumentItem[]>(INITIAL_DOCUMENTS);
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const timers = useRef<number[]>([]);

  useEffect(() => {
    return () => {
      timers.current.forEach((t) => window.clearTimeout(t));
    };
  }, []);

  const total = documents.length;
  const approvedCount = documents.filter((d) => d.status === 'approved').length;
  const pendingCount = documents.filter((d) => d.status === 'pending').length;
  const rejectedCount = documents.filter((d) => d.status === 'rejected').length;
  const progressPercent = Math.round((approvedCount / total) * 100);

  function handleFileSelected(id: string, files: FileList | null) {
    const file = files?.[0];
    if (!file) return;

    setDocuments((prev) =>
      prev.map((doc) =>
        doc.id === id ? { ...doc, status: 'pending', fileName: file.name, reason: undefined } : doc,
      ),
    );

    const timer = window.setTimeout(() => {
      setDocuments((prev) =>
        prev.map((doc) => {
          if (doc.id !== id) return doc;
          const approved = Math.random() > 0.35;
          return approved
            ? { ...doc, status: 'approved', reason: undefined }
            : {
                ...doc,
                status: 'rejected',
                reason: REJECTION_REASONS[Math.floor(Math.random() * REJECTION_REASONS.length)],
              };
        }),
      );
    }, 2200);
    timers.current.push(timer);
  }

  return (
    <div className={styles.screen}>
      <header className={styles.header}>
        <h1 className={styles.title}>Document verification</h1>
        <p className={styles.subtitle}>
          Upload the documents below so we can verify your identity. This usually takes a few minutes per document.
        </p>
      </header>

      <section className={styles.progressCard} aria-label="Overall progress">
        <div className={styles.progressHeaderRow}>
          <span className={styles.progressLabel}>Overall progress</span>
          <span className={styles.progressCount}>
            {approvedCount} of {total} verified
          </span>
        </div>
        <div
          className={styles.progressTrack}
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progressPercent}
        >
          <div className={styles.progressFill} style={{ inlineSize: `${progressPercent}%` }} />
        </div>
        <div className={styles.progressSummary}>
          {approvedCount > 0 && <span className={`${styles.summaryChip} ${styles.chipApproved}`}>{approvedCount} approved</span>}
          {pendingCount > 0 && <span className={`${styles.summaryChip} ${styles.chipPending}`}>{pendingCount} under review</span>}
          {rejectedCount > 0 && <span className={`${styles.summaryChip} ${styles.chipRejected}`}>{rejectedCount} rejected</span>}
        </div>
      </section>

      <ul className={styles.grid}>
        {documents.map((doc) => (
          <li key={doc.id} className={styles.card}>
            <div className={styles.cardTop}>
              <div className={`${styles.iconWrap} ${styles[`icon_${doc.status}`]}`}>
                <DocIcon id={doc.id} />
              </div>
              <div className={styles.cardHeading}>
                <h2 className={styles.cardTitle}>{doc.title}</h2>
                <p className={styles.cardDescription}>{doc.description}</p>
              </div>
              <span className={`${styles.badge} ${styles[`badge_${doc.status}`]}`}>{STATUS_LABEL[doc.status]}</span>
            </div>

            {doc.fileName && (
              <p className={styles.fileName}>
                <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={styles.fileIcon}>
                  <path
                    d="M8 3.5h5.5L18 8v11a1.5 1.5 0 0 1-1.5 1.5h-8A1.5 1.5 0 0 1 7 19V5A1.5 1.5 0 0 1 8 3.5Z"
                    stroke="currentColor"
                    strokeWidth="1.4"
                    strokeLinejoin="round"
                  />
                  <path d="M13.5 3.5V8H18" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
                </svg>
                {doc.fileName}
              </p>
            )}

            {doc.status === 'rejected' && doc.reason && (
              <p className={styles.reason} role="alert">
                {doc.reason}
              </p>
            )}

            {doc.status === 'pending' && <p className={styles.pendingNote}>We're reviewing this document. It won't take long.</p>}

            <input
              ref={(el) => {
                inputRefs.current[doc.id] = el;
              }}
              type="file"
              accept={doc.accept}
              className={styles.hiddenInput}
              onChange={(e) => handleFileSelected(doc.id, e.target.files)}
            />
            <button
              type="button"
              className={doc.status === 'not_uploaded' ? styles.uploadButton : styles.replaceButton}
              onClick={() => inputRefs.current[doc.id]?.click()}
              disabled={doc.status === 'pending'}
            >
              {doc.status === 'not_uploaded' ? 'Upload' : 'Replace'}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

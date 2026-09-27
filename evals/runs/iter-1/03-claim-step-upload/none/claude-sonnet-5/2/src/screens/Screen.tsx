import { useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import styles from './Screen.module.css';

type UploadStatus = 'uploaded' | 'failed';

interface EvidenceFile {
  id: string;
  name: string;
  sizeBytes: number;
  status: UploadStatus;
  errorMessage?: string;
}

const MAX_FILES = 5;

const STEPS = ['Claim details', 'Upload evidence', 'Review & submit'];
const CURRENT_STEP = 1;

const initialFiles: EvidenceFile[] = [
  { id: 'f1', name: 'front-bumper-damage.jpg', sizeBytes: 2_400_000, status: 'uploaded' },
  { id: 'f2', name: 'side-panel-scratch.png', sizeBytes: 1_150_000, status: 'uploaded' },
  { id: 'f3', name: 'repair-estimate.pdf', sizeBytes: 860_000, status: 'uploaded' },
  {
    id: 'f4',
    name: 'rear-view-wide.heic',
    sizeBytes: 14_800_000,
    status: 'failed',
    errorMessage: 'File exceeds the 10 MB size limit.',
  },
];

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const units = ['KB', 'MB', 'GB'];
  let value = bytes / 1024;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  return `${value.toFixed(value < 10 ? 1 : 0)} ${units[unitIndex]}`;
}

function isPdf(name: string): boolean {
  return name.toLowerCase().endsWith('.pdf');
}

function createId(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `file-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function PdfIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
      <path
        d="M6 2h8l4 4v16H6z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path d="M14 2v4h4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <text x="8" y="17" fontSize="6" fill="currentColor" fontWeight="700">
        PDF
      </text>
    </svg>
  );
}

function ImageIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
      <rect
        x="3"
        y="4"
        width="18"
        height="16"
        rx="2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <circle cx="9" cy="10" r="1.6" fill="currentColor" />
      <path
        d="m5 17 5-5 3 3 3-4 3 6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ErrorIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
      <path
        d="M12 3 2 20h20L12 3Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path d="M12 9.5v4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="12" cy="16.7" r="0.9" fill="currentColor" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
      <path
        d="M6 6l12 12M18 6 6 18"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
      <path
        d="m4 12 6 6L20 6"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
      <path
        d="M12 5v14M5 12h14"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function Screen() {
  const [files, setFiles] = useState<EvidenceFile[]>(initialFiles);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const successCount = files.filter((file) => file.status === 'uploaded').length;
  const canContinue = successCount > 0;
  const roomLeft = MAX_FILES - files.length;
  const canAddMore = roomLeft > 0;

  function handleFilesSelected(event: ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(event.target.files ?? []);
    event.target.value = '';
    if (selected.length === 0) return;

    const additions: EvidenceFile[] = selected.slice(0, roomLeft).map((file) => ({
      id: createId(),
      name: file.name,
      sizeBytes: file.size,
      status: 'uploaded',
    }));

    setFiles((prev) => [...prev, ...additions]);
  }

  function handleRemove(id: string) {
    setFiles((prev) => prev.filter((file) => file.id !== id));
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <p className={styles.eyebrow}>File a claim</p>
        <h1 className={styles.title}>Upload evidence</h1>

        <ol className={styles.stepper}>
          {STEPS.map((label, index) => {
            const status = index < CURRENT_STEP ? 'done' : index === CURRENT_STEP ? 'active' : 'upcoming';
            return (
              <li key={label} className={styles.step}>
                <span
                  className={`${styles.stepCircle} ${styles[`stepCircle_${status}`]}`}
                  aria-current={status === 'active' ? 'step' : undefined}
                >
                  {status === 'done' ? <CheckIcon /> : index + 1}
                </span>
                <span className={styles.stepLabel}>{label}</span>
                {index < STEPS.length - 1 && <span className={styles.stepConnector} aria-hidden="true" />}
              </li>
            );
          })}
        </ol>
      </header>

      <section className={styles.card} aria-labelledby="evidence-heading">
        <h2 id="evidence-heading" className={styles.sectionTitle}>
          Photos and documents
        </h2>
        <p className={styles.sectionDescription}>
          Add photos of the damage or supporting documents such as a repair estimate. You can upload up
          to {MAX_FILES} files (JPG, PNG or PDF).
        </p>

        <ul className={styles.fileList}>
          {files.map((file) => {
            const failed = file.status === 'failed';
            return (
              <li
                key={file.id}
                className={failed ? `${styles.fileRow} ${styles.fileRowFailed}` : styles.fileRow}
              >
                <span className={styles.fileIcon}>{isPdf(file.name) ? <PdfIcon /> : <ImageIcon />}</span>
                <span className={styles.fileInfo}>
                  <span className={styles.fileName}>{file.name}</span>
                  {failed ? (
                    <span className={styles.fileError}>
                      <ErrorIcon />
                      {file.errorMessage ?? 'Upload failed.'}
                    </span>
                  ) : (
                    <span className={styles.fileMeta}>{formatFileSize(file.sizeBytes)}</span>
                  )}
                </span>
                <button
                  type="button"
                  className={styles.removeButton}
                  aria-label={`Remove ${file.name}`}
                  onClick={() => handleRemove(file.id)}
                >
                  <CloseIcon />
                </button>
              </li>
            );
          })}
        </ul>

        {canAddMore ? (
          <div className={styles.addRow}>
            <button
              type="button"
              className={styles.addButton}
              onClick={() => fileInputRef.current?.click()}
            >
              <PlusIcon />
              Add photo or PDF
            </button>
            <input
              ref={fileInputRef}
              type="file"
              className={styles.hiddenInput}
              accept="image/*,application/pdf"
              multiple
              onChange={handleFilesSelected}
              tabIndex={-1}
              aria-hidden="true"
            />
            <span className={styles.hint}>{roomLeft} of {MAX_FILES} slots left</span>
          </div>
        ) : (
          <p className={styles.hint}>You've reached the {MAX_FILES}-file limit.</p>
        )}
      </section>

      <footer className={styles.footer}>
        <button type="button" className={styles.backButton}>
          Back
        </button>
        <button type="button" className={styles.continueButton} disabled={!canContinue}>
          Continue
        </button>
      </footer>
    </div>
  );
}

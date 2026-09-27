import { useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import styles from './Screen.module.css';

type FileKind = 'photo' | 'pdf';
type UploadStatus = 'uploaded' | 'failed';

interface EvidenceFile {
  id: string;
  name: string;
  size: number;
  kind: FileKind;
  status: UploadStatus;
  error?: string;
}

const MAX_FILES = 5;

const STEPS = ['Policy details', 'Upload evidence', 'Review & submit'];
const CURRENT_STEP = 2;

const initialFiles: EvidenceFile[] = [
  { id: 'f1', name: 'front-bumper-damage.jpg', size: 2_400_000, kind: 'photo', status: 'uploaded' },
  { id: 'f2', name: 'rear-view-scratch.jpg', size: 1_150_000, kind: 'photo', status: 'uploaded' },
  { id: 'f3', name: 'police-report.pdf', size: 480_000, kind: 'pdf', status: 'uploaded' },
  {
    id: 'f4',
    name: 'dashboard-cam-footage.jpg',
    size: 8_900_000,
    kind: 'photo',
    status: 'failed',
    error: 'File exceeds the 5 MB size limit',
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

function kindFromFile(file: File): FileKind {
  if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) return 'pdf';
  return 'photo';
}

function PhotoIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false">
      <rect x="3" y="5" width="18" height="14" rx="2" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="8.5" cy="10" r="1.6" fill="currentColor" />
      <path d="M4 17l5-5 3.5 3.5L16 12l4 5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

function PdfIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false">
      <path
        d="M6 3.5h8L18.5 8v12a.5.5 0 0 1-.5.5H6a.5.5 0 0 1-.5-.5v-16a.5.5 0 0 1 .5-.5z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="M14 3.5V8h4.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <text x="12" y="16.5" fontSize="6.5" textAnchor="middle" fill="currentColor" fontFamily="sans-serif">
        PDF
      </text>
    </svg>
  );
}

function WarningIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">
      <path
        d="M12 3.5 21 19.5H3L12 3.5z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <line x1="12" y1="9.5" x2="12" y2="14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="12" cy="16.7" r="1" fill="currentColor" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true" focusable="false">
      <path d="M4 12l5.5 5.5L20 6" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function RemoveIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false">
      <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export default function Screen() {
  const [files, setFiles] = useState<EvidenceFile[]>(initialFiles);
  const nextId = useRef(initialFiles.length + 1);
  const inputRef = useRef<HTMLInputElement>(null);

  const uploadedCount = files.filter((file) => file.status === 'uploaded').length;
  const canContinue = uploadedCount > 0;
  const slotsRemaining = MAX_FILES - files.length;

  function removeFile(id: string) {
    setFiles((current) => current.filter((file) => file.id !== id));
  }

  function handleFilesSelected(event: ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(event.target.files ?? []).slice(0, slotsRemaining);
    if (picked.length > 0) {
      const additions: EvidenceFile[] = picked.map((file) => ({
        id: `upload-${nextId.current++}`,
        name: file.name,
        size: file.size,
        kind: kindFromFile(file),
        status: 'uploaded',
      }));
      setFiles((current) => [...current, ...additions]);
    }
    event.target.value = '';
  }

  return (
    <div className={styles.page}>
      <ol className={styles.stepper} aria-label="Claim progress">
        {STEPS.map((label, index) => {
          const stepNumber = index + 1;
          const status = stepNumber < CURRENT_STEP ? 'done' : stepNumber === CURRENT_STEP ? 'current' : 'upcoming';
          return (
            <li key={label} className={styles.step} data-status={status}>
              <span className={styles.stepMarker} aria-hidden="true">
                {status === 'done' ? <CheckIcon /> : stepNumber}
              </span>
              <span className={styles.stepLabel} aria-current={status === 'current' ? 'step' : undefined}>
                {label}
              </span>
            </li>
          );
        })}
      </ol>

      <header className={styles.header}>
        <p className={styles.eyebrow}>
          Step {CURRENT_STEP} of {STEPS.length}
        </p>
        <h1 className={styles.title}>Upload evidence</h1>
        <p className={styles.subtitle}>
          Add photos of the damage or supporting documents. You can upload up to {MAX_FILES} files.
        </p>
      </header>

      <section className={styles.uploadSection} aria-label="Uploaded files">
        <ul className={styles.fileList}>
          {files.map((file) => (
            <li key={file.id} className={styles.fileRow} data-status={file.status}>
              <span className={styles.fileIcon} data-status={file.status}>
                {file.status === 'failed' ? <WarningIcon /> : file.kind === 'pdf' ? <PdfIcon /> : <PhotoIcon />}
              </span>
              <span className={styles.fileInfo}>
                <span className={styles.fileName}>{file.name}</span>
                {file.status === 'uploaded' ? (
                  <span className={styles.fileMeta}>{formatFileSize(file.size)}</span>
                ) : (
                  <span className={styles.fileError}>
                    Upload failed &mdash; {file.error}
                  </span>
                )}
              </span>
              <button
                type="button"
                className={styles.removeButton}
                onClick={() => removeFile(file.id)}
                aria-label={`Remove ${file.name}`}
              >
                <RemoveIcon />
              </button>
            </li>
          ))}
          {files.length === 0 && <li className={styles.emptyState}>No files added yet.</li>}
        </ul>

        <div className={styles.addRow}>
          <label className={styles.addButton} data-disabled={slotsRemaining <= 0 || undefined}>
            <input
              ref={inputRef}
              type="file"
              accept="image/*,application/pdf,.pdf"
              multiple
              disabled={slotsRemaining <= 0}
              onChange={handleFilesSelected}
              className={styles.hiddenInput}
            />
            + Add photos or PDFs
          </label>
          <span className={styles.fileCount}>
            {files.length} of {MAX_FILES} files added
          </span>
        </div>
      </section>

      <footer className={styles.actions}>
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

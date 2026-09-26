'use client';

import { useId, useMemo, useState, type HTMLAttributes, type JSX, type ReactNode, type Ref } from 'react';
import {
  DropZone,
  FieldErrorContext,
  FileTrigger,
  ProgressBar,
  isFileDropItem,
  useLocale,
  type DropZoneProps,
  type ValidationResult,
} from 'react-aria-components';
import { IconAlertCircle, IconCircleCheck, IconFile, IconUpload, IconX } from '@tabler/icons-react';
import { Button } from './button';
import { Description, FieldError, Label } from './text-field';
import styles from './file-upload.module.css';

const cx = (...c: Array<string | false | null | undefined>) => c.filter(Boolean).join(' ');

/** A selected file plus optional upload state, for showing progress or a per-file error. */
export interface FileUploadEntry {
  file: File;
  /** Upload progress 0–100. Shows a bar while below 100 and "Uploaded" at 100. */
  progress?: number;
  /** Per-file error, e.g. "Upload failed. Try again." */
  error?: string;
}

export interface FileUploadProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onChange' | 'children' | 'defaultValue'> {
  ref?: Ref<HTMLDivElement>;
  /** Visible label, e.g. "Attachments". */
  label?: ReactNode;
  /** Help text under the label. */
  description?: ReactNode;
  /** Field-level error, shown under the list when `isInvalid` is true. */
  errorMessage?: ReactNode;
  isInvalid?: boolean;
  isDisabled?: boolean;
  /** MIME types or extensions, e.g. `['image/*', '.pdf']`. Files that don't match are rejected with a message. */
  acceptedFileTypes?: string[];
  /** Allow more than one file. Without it, a new file replaces the current one. */
  allowsMultiple?: boolean;
  /** Maximum size per file in bytes. Larger files are rejected with a message. */
  maxSize?: number;
  /** Controlled list. Pass `File`s, or `FileUploadEntry`s to show progress or errors. */
  files?: ReadonlyArray<File | FileUploadEntry>;
  /** Initial list when uncontrolled. */
  defaultFiles?: File[];
  /** Called with the full list of accepted files whenever it changes (add or remove). */
  onChange?: (files: File[]) => void;
  /** Called with files that were rejected (wrong type, too large, over the limit). */
  onReject?: (rejections: FileRejection[]) => void;
  /** Text under the prompt. Defaults to the accepted types and max size, e.g. "PNG, PDF, up to 10 MB". */
  hint?: ReactNode;
  /** Prompt text before the browse link. */
  dropLabel?: ReactNode;
  /** Text of the browse link. */
  browseLabel?: ReactNode;
}

export interface FileRejection {
  file: File;
  reason: 'type' | 'size' | 'count';
  message: string;
}

const isEntry = (f: File | FileUploadEntry): f is FileUploadEntry => 'file' in f && typeof f.file === 'object';
const sameFile = (a: File, b: File) => a.name === b.name && a.size === b.size && a.lastModified === b.lastModified;

function matchesAccept(file: File, accepted: readonly string[]): boolean {
  if (accepted.length === 0) return true;
  const name = file.name.toLowerCase();
  const type = file.type.toLowerCase();
  return accepted.some((raw) => {
    const a = raw.trim().toLowerCase();
    if (a.startsWith('.')) return name.endsWith(a);
    if (a.endsWith('/*')) return type.startsWith(a.slice(0, -1));
    return type === a;
  });
}

const SUBTYPE_NAMES: Record<string, string> = {
  jpeg: 'JPG',
  'svg+xml': 'SVG',
  plain: 'TXT',
  msword: 'DOC',
  'vnd.openxmlformats-officedocument.wordprocessingml.document': 'DOCX',
  'vnd.ms-excel': 'XLS',
  'vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'XLSX',
  'vnd.openxmlformats-officedocument.presentationml.presentation': 'PPTX',
};
const WILDCARD_NAMES: Record<string, string> = { image: 'Images', video: 'Videos', audio: 'Audio', text: 'Text files' };

function typeName(raw: string): string {
  const a = raw.trim().toLowerCase();
  if (a.startsWith('.')) return a.slice(1).toUpperCase();
  const [major = '', sub = ''] = a.split('/');
  if (sub === '*') return WILDCARD_NAMES[major] ?? 'Files';
  return SUBTYPE_NAMES[sub] ?? sub.toUpperCase();
}

/** Bytes → "2.4 MB" (1024-based, locale-formatted). */
function formatFileSize(bytes: number, locale = 'en-US'): string {
  const units = ['byte', 'kilobyte', 'megabyte', 'gigabyte'] as const;
  let value = bytes;
  let i = 0;
  while (value >= 1024 && i < units.length - 1) {
    value /= 1024;
    i++;
  }
  return new Intl.NumberFormat(locale, {
    style: 'unit',
    unit: units[i],
    unitDisplay: i === 0 ? 'long' : 'short',
    maximumFractionDigits: i > 0 && value < 10 ? 1 : 0,
  }).format(value);
}

const INVALID: ValidationResult = {
  isInvalid: true,
  validationErrors: [],
  validationDetails: {
    badInput: false,
    customError: true,
    patternMismatch: false,
    rangeOverflow: false,
    rangeUnderflow: false,
    stepMismatch: false,
    tooLong: false,
    tooShort: false,
    typeMismatch: false,
    valid: false,
    valueMissing: false,
  },
};

/**
 * A drop zone with a browse button, and the list of chosen files underneath. Files can also be pasted
 * while the drop zone has focus. Validates type and size on the way in; progress and per-file errors
 * come from you through `files`.
 */
export function FileUpload({
  label,
  description,
  errorMessage,
  isInvalid = false,
  isDisabled = false,
  acceptedFileTypes,
  allowsMultiple = false,
  maxSize,
  files,
  defaultFiles,
  onChange,
  onReject,
  hint,
  dropLabel = 'Drag files here or',
  browseLabel = 'browse',
  className,
  ...rest
}: FileUploadProps): JSX.Element {
  const { locale } = useLocale();
  const id = useId();
  const labelId = `${id}-label`;
  const descriptionId = `${id}-description`;
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const [internal, setInternal] = useState<File[]>(defaultFiles ?? []);
  const [rejected, setRejected] = useState<FileRejection[]>([]);

  const entries: FileUploadEntry[] = useMemo(
    () => (files ?? internal).map((f) => (isEntry(f) ? f : { file: f })),
    [files, internal],
  );
  const accepted = acceptedFileTypes ?? [];

  let autoHint = '';
  if (hint === undefined) {
    const parts: string[] = [];
    if (accepted.length) {
      const names = [...new Set(accepted.map(typeName))];
      parts.push(new Intl.ListFormat(locale, { type: 'unit', style: 'short' }).format(names));
    }
    if (maxSize != null) parts.push(`up to ${formatFileSize(maxSize, locale)}`);
    const text = parts.join(', ');
    autoHint = text ? text.charAt(0).toUpperCase() + text.slice(1) : '';
  }
  const hintContent = hint ?? autoHint;

  const commit = (next: File[]) => {
    if (files === undefined) setInternal(next);
    onChange?.(next);
  };

  const addFiles = (incoming: File[]) => {
    if (isDisabled || incoming.length === 0) return;
    const current = entries.map((e) => e.file);
    const ok: File[] = [];
    const bad: FileRejection[] = [];
    for (const file of incoming) {
      if (!matchesAccept(file, accepted)) {
        bad.push({ file, reason: 'type', message: `This file type isn't accepted.` });
      } else if (maxSize != null && file.size > maxSize) {
        bad.push({ file, reason: 'size', message: `Larger than ${formatFileSize(maxSize, locale)}.` });
      } else if (!allowsMultiple && ok.length > 0) {
        bad.push({ file, reason: 'count', message: 'Only one file can be added.' });
      } else if (!current.some((c) => sameFile(c, file)) && !ok.some((c) => sameFile(c, file))) {
        ok.push(file);
      }
    }
    setRejected(bad);
    if (bad.length) onReject?.(bad);
    if (ok.length) commit(allowsMultiple ? [...current, ...ok] : ok.slice(0, 1));
  };

  const onDrop: DropZoneProps['onDrop'] = async (e) => {
    const dropped = await Promise.all(e.items.filter(isFileDropItem).map((item) => item.getFile()));
    addFiles(dropped);
  };

  const remove = (file: File) => commit(entries.map((e) => e.file).filter((f) => f !== file));

  const showError = isInvalid && errorMessage != null;
  const describedBy =
    [hintContent && hintId, description != null && descriptionId, showError && errorId].filter(Boolean).join(' ') || undefined;

  return (
    <div
      {...rest}
      className={cx(styles.field, className)}
      data-disabled={isDisabled || undefined}
      data-invalid={isInvalid || undefined}
    >
      {label != null && (
        <Label id={labelId} elementType="span">
          {label}
        </Label>
      )}
      <DropZone
        className={styles.zone}
        isDisabled={isDisabled}
        onDrop={onDrop}
        aria-labelledby={label != null ? labelId : undefined}
      >
        <span className={styles.zoneIcon} aria-hidden>
          <IconUpload />
        </span>
        {/* aria-disabled lets checkers treat the dimmed prompt as disabled text (WCAG 1.4.3 exempts it). */}
        <span className={styles.prompt} aria-disabled={isDisabled || undefined}>
          {dropLabel}{' '}
          <FileTrigger
            acceptedFileTypes={acceptedFileTypes}
            allowsMultiple={allowsMultiple}
            onSelect={(list) => addFiles(list ? Array.from(list) : [])}
          >
            <Button variant="link" isDisabled={isDisabled} aria-describedby={describedBy} className={styles.browse}>
              {browseLabel}
            </Button>
          </FileTrigger>
        </span>
        {hintContent ? (
          <span id={hintId} className={styles.hint} aria-disabled={isDisabled || undefined}>
            {hintContent}
          </span>
        ) : null}
      </DropZone>
      {description != null && <Description id={descriptionId}>{description}</Description>}
      {showError && (
        <FieldErrorContext.Provider value={INVALID}>
          <FieldError id={errorId}>{errorMessage}</FieldError>
        </FieldErrorContext.Provider>
      )}

      {entries.length + rejected.length > 0 && (
        <ul className={styles.list} aria-labelledby={label != null ? labelId : undefined}>
          {entries.map(({ file, progress, error }, i) => (
            <FileRow
              key={`${file.name}-${file.size}-${file.lastModified}-${i}`}
              file={file}
              progress={progress}
              error={error}
              locale={locale}
              isDisabled={isDisabled}
              onRemove={() => remove(file)}
            />
          ))}
          {rejected.map((r, i) => (
            <FileRow
              key={`rejected-${r.file.name}-${i}`}
              file={r.file}
              error={r.message}
              locale={locale}
              isDisabled={isDisabled}
              isRejected
              onRemove={() => setRejected((all) => all.filter((x) => x !== r))}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function FileRow({
  file,
  progress,
  error,
  locale,
  isDisabled,
  isRejected = false,
  onRemove,
}: {
  file: File;
  progress?: number;
  error?: string;
  locale: string;
  isDisabled: boolean;
  isRejected?: boolean;
  onRemove: () => void;
}): JSX.Element {
  const uploading = progress != null && progress < 100 && !error;
  const done = progress != null && progress >= 100 && !error;
  return (
    <li className={styles.row} data-error={error ? true : undefined}>
      <span className={styles.fileIcon} aria-hidden>
        {error ? <IconAlertCircle /> : <IconFile />}
      </span>
      <div className={styles.fileBody}>
        <div className={styles.fileLine}>
          <span className={styles.fileName} title={file.name}>
            {file.name}
          </span>
          <span className={styles.fileSize}>{formatFileSize(file.size, locale)}</span>
        </div>
        {uploading && (
          <ProgressBar value={progress} aria-label={`Uploading ${file.name}`} className={styles.progress}>
            {({ percentage, valueText }) => (
              <>
                <span className={styles.track}>
                  <span className={styles.fill} style={{ inlineSize: `${percentage ?? 0}%` }} />
                </span>
                <span className={styles.percent}>{valueText}</span>
              </>
            )}
          </ProgressBar>
        )}
        {done && (
          <span className={styles.status}>
            <IconCircleCheck aria-hidden />
            Uploaded
          </span>
        )}
        {error && (
          <span className={styles.error} role={isRejected ? 'alert' : undefined}>
            {error}
          </span>
        )}
      </div>
      <Button
        variant="ghost"
        size="icon"
        aria-label={isRejected ? `Dismiss ${file.name}` : `Remove ${file.name}`}
        isDisabled={isDisabled}
        onPress={onRemove}
        className={styles.remove}
      >
        <IconX />
      </Button>
    </li>
  );
}

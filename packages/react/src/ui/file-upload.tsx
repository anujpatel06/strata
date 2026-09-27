'use client';

import { useId, useMemo, useRef, useState, type CSSProperties, type HTMLAttributes, type JSX, type ReactNode, type Ref } from 'react';
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
import { IconAlertCircle, IconCircleCheck, IconFile, IconUpload, IconX } from '@strata/icons';
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
  /** Text under the prompt, replacing the generated one (accepted types and max size, e.g. "PNG, PDF, up to 10 MB"). */
  hint?: ReactNode;
  /** Prompt text before the browse link. Shorthand for `strings.dropLabel`; wins over it. */
  dropLabel?: ReactNode;
  /** Text of the browse link. Shorthand for `strings.browseLabel`; wins over it. */
  browseLabel?: ReactNode;
  /**
   * Every piece of copy the component writes itself, for translation. Pass only what you override; templates
   * are functions. Sizes, type lists and percentages are formatted in `strings.locale` so they match the copy.
   */
  strings?: FileUploadStrings;
}

/** Copy used by FileUpload. All fields are optional; English defaults fill the gaps. */
export interface FileUploadStrings {
  /**
   * Locale for the sizes, type lists and percentages that appear in this copy, e.g. "ar-AE".
   * Defaults to "en-US" while you use the built-in English copy, and to the app's React Aria locale once you
   * pass `strings` — so translated copy gets matching units and list punctuation, and English copy never
   * mixes in another language's units.
   */
  locale?: string;
  /** Prompt before the browse link. Default: "Drag files here or". */
  dropLabel?: string;
  /** Browse link text. Default: "browse". */
  browseLabel?: string;
  /**
   * Builds the hint under the prompt. `types` is the accepted types joined for `locale` (null when any type is
   * accepted); `maxSize` is the formatted limit (null when unlimited). Return "" for no hint.
   * Default: "PNG, PDF, up to 10 MB".
   */
  hint?: (parts: { types: string | null; maxSize: string | null }) => string;
  /** Name for a wildcard type such as `image/*`; receives "image", "video", "audio", "text"… Default: "Images", "Videos"… */
  typeGroup?: (group: string) => string;
  /** Status of a file whose progress reached 100. Default: "Uploaded". */
  uploaded?: string;
  /** Accessible name of a file's progress bar. Default: "Uploading {fileName}". */
  uploading?: (fileName: string) => string;
  /** Accessible name of a file's remove button. Default: "Remove {fileName}". */
  remove?: (fileName: string) => string;
  /** Accessible name of the button that dismisses a rejected file. Default: "Dismiss {fileName}". */
  dismiss?: (fileName: string) => string;
  /** Rejection for a file whose type isn't accepted. Default: "This file type isn't accepted." */
  rejectedType?: (fileName: string) => string;
  /** Rejection for a file over `maxSize` (already formatted). Default: "Larger than {maxSize}." */
  rejectedSize?: (maxSize: string, fileName: string) => string;
  /** Rejection for extra files when `allowsMultiple` is off. Default: "Only one file can be added." */
  rejectedCount?: (fileName: string) => string;
}

const TYPE_GROUPS: Record<string, string> = { image: 'Images', video: 'Videos', audio: 'Audio', text: 'Text files' };

const EN: Required<Omit<FileUploadStrings, 'locale'>> = {
  dropLabel: 'Drag files here or',
  browseLabel: 'browse',
  hint: ({ types, maxSize }) => {
    const size = maxSize ? `up to ${maxSize}` : null;
    const text = [types, size].filter(Boolean).join(', ');
    return text.charAt(0).toUpperCase() + text.slice(1);
  },
  typeGroup: (group) => TYPE_GROUPS[group] ?? 'Files',
  uploaded: 'Uploaded',
  uploading: (fileName) => `Uploading ${fileName}`,
  remove: (fileName) => `Remove ${fileName}`,
  dismiss: (fileName) => `Dismiss ${fileName}`,
  rejectedType: () => "This file type isn't accepted.",
  rejectedSize: (maxSize) => `Larger than ${maxSize}.`,
  rejectedCount: () => 'Only one file can be added.',
};

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
function typeName(raw: string, typeGroup: (group: string) => string): string {
  const a = raw.trim().toLowerCase();
  if (a.startsWith('.')) return a.slice(1).toUpperCase();
  const [major = '', sub = ''] = a.split('/');
  if (sub === '*') return typeGroup(major);
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
  dropLabel,
  browseLabel,
  strings,
  className,
  ...rest
}: FileUploadProps): JSX.Element {
  const { locale: appLocale } = useLocale();
  const t = { ...EN, ...strings };
  // One locale for everything the component formats, so units and lists always match the copy's language.
  const locale = strings?.locale ?? (strings ? appLocale : 'en-US');
  const id = useId();
  const labelId = `${id}-label`;
  const descriptionId = `${id}-description`;
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const [internal, setInternal] = useState<File[]>(defaultFiles ?? []);
  const [rejected, setRejected] = useState<FileRejection[]>([]);
  // Each file's position within the batch it arrived in, so rows fade in one after another per drop/browse
  // instead of the fifth file of a later drop waiting behind four rows that are already on screen.
  const staggerRef = useRef(new WeakMap<File, number>());

  const entries: FileUploadEntry[] = useMemo(
    () => (files ?? internal).map((f) => (isEntry(f) ? f : { file: f })),
    [files, internal],
  );
  const accepted = acceptedFileTypes ?? [];

  let hintContent: ReactNode = hint;
  if (hint === undefined && (accepted.length > 0 || maxSize != null)) {
    const names = [...new Set(accepted.map((a) => typeName(a, t.typeGroup)))];
    hintContent = t.hint({
      types: names.length ? new Intl.ListFormat(locale, { type: 'unit', style: 'short' }).format(names) : null,
      maxSize: maxSize != null ? formatFileSize(maxSize, locale) : null,
    });
  }

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
        bad.push({ file, reason: 'type', message: t.rejectedType(file.name) });
      } else if (maxSize != null && file.size > maxSize) {
        bad.push({ file, reason: 'size', message: t.rejectedSize(formatFileSize(maxSize, locale), file.name) });
      } else if (!allowsMultiple && ok.length > 0) {
        bad.push({ file, reason: 'count', message: t.rejectedCount(file.name) });
      } else if (!current.some((c) => sameFile(c, file)) && !ok.some((c) => sameFile(c, file))) {
        ok.push(file);
      }
    }
    ok.forEach((file, i) => staggerRef.current.set(file, i));
    bad.forEach((r, i) => staggerRef.current.set(r.file, ok.length + i));
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
          {dropLabel ?? t.dropLabel}{' '}
          <FileTrigger
            acceptedFileTypes={acceptedFileTypes}
            allowsMultiple={allowsMultiple}
            onSelect={(list) => addFiles(list ? Array.from(list) : [])}
          >
            <Button variant="link" isDisabled={isDisabled} aria-describedby={describedBy} className={styles.browse}>
              {browseLabel ?? t.browseLabel}
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
              stagger={staggerRef.current.get(file) ?? 0}
              progress={progress}
              error={error}
              locale={locale}
              strings={t}
              isDisabled={isDisabled}
              onRemove={() => remove(file)}
            />
          ))}
          {rejected.map((r, i) => (
            <FileRow
              key={`rejected-${r.file.name}-${i}`}
              file={r.file}
              stagger={staggerRef.current.get(r.file) ?? 0}
              error={r.message}
              locale={locale}
              strings={t}
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
  stagger,
  progress,
  error,
  locale,
  strings: t,
  isDisabled,
  isRejected = false,
  onRemove,
}: {
  file: File;
  /** Position in the batch this file arrived with; delays its entrance a beat per step. */
  stagger: number;
  progress?: number;
  error?: string;
  locale: string;
  strings: typeof EN;
  isDisabled: boolean;
  isRejected?: boolean;
  onRemove: () => void;
}): JSX.Element {
  const uploading = progress != null && progress < 100 && !error;
  const done = progress != null && progress >= 100 && !error;
  const percentText = uploading
    ? new Intl.NumberFormat(locale, { style: 'percent', maximumFractionDigits: 0 }).format(Math.max(0, progress) / 100)
    : undefined;
  return (
    <li
      className={styles.row}
      data-error={error ? true : undefined}
      style={{ '--row-stagger': Math.min(stagger, 8) } as CSSProperties}
    >
      <span className={styles.fileIcon} aria-hidden>
        {error ? <IconAlertCircle /> : <IconFile />}
      </span>
      <div className={styles.fileBody}>
        <div className={styles.fileLine}>
          {/* dir="auto" isolates the name, so a Latin name in an RTL layout (or the reverse) keeps its own order and
              is truncated at its own end. */}
          <span className={styles.fileName} dir="auto" title={file.name}>
            {file.name}
          </span>
          <span className={styles.fileSize}>{formatFileSize(file.size, locale)}</span>
        </div>
        {uploading && (
          <ProgressBar
            value={progress}
            valueLabel={percentText}
            aria-label={t.uploading(file.name)}
            className={styles.progress}
          >
            {({ percentage }) => (
              <>
                <span className={styles.track}>
                  {/* Full-width fill slid along the track (translate, not width, so it animates off the layout path). */}
                  <span className={styles.fill} style={{ '--progress': (percentage ?? 0) / 100 } as CSSProperties} />
                </span>
                <span className={styles.percent}>{percentText}</span>
              </>
            )}
          </ProgressBar>
        )}
        {done && (
          <span className={styles.status}>
            <IconCircleCheck aria-hidden />
            {t.uploaded}
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
        aria-label={isRejected ? t.dismiss(file.name) : t.remove(file.name)}
        isDisabled={isDisabled}
        onPress={onRemove}
        className={styles.remove}
      >
        <IconX />
      </Button>
    </li>
  );
}

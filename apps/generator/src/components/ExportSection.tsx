import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { IconCheck, IconCopy, IconDownload, IconFileCode } from '@strata/icons';
import { toCSS, toDTCG, toFigmaFiles, type Theme } from '@strata/theme-engine';
import type { TenantId } from '../tenants';
import type { ExportFormat } from '../url-state';
import { Segmented, type SegmentedOption } from './Segmented';
import styles from './ExportSection.module.css';
import ui from './ui.module.css';

export const EXPORT_SECTION_ID = 'export';

interface ExportFile {
  name: string;
  content: string;
  mime: string;
}

const FORMAT_OPTIONS: ReadonlyArray<SegmentedOption<ExportFormat>> = [
  { value: 'css', label: 'CSS' },
  { value: 'dtcg', label: 'DTCG 2025.10' },
  { value: 'figma', label: 'Figma' },
];

const NOTE = 'DTCG 2025.10 uses colour objects; the Figma files use hex strings for plugin compatibility.';

function buildFiles(theme: Theme, format: ExportFormat, tenant: TenantId): ExportFile[] {
  switch (format) {
    case 'css':
      return [{ name: `${tenant}.css`, content: toCSS(theme), mime: 'text/css' }];
    case 'dtcg':
      return [{ name: `${tenant}.tokens.json`, content: JSON.stringify(toDTCG(theme), null, 2), mime: 'application/json' }];
    case 'figma':
      return Object.entries(toFigmaFiles(theme)).map(([name, doc]) => ({
        name,
        content: JSON.stringify(doc, null, 2),
        mime: 'application/json',
      }));
    default:
      return [];
  }
}

function formatBytes(bytes: number): string {
  return bytes < 1024 ? `${bytes} B` : `${(bytes / 1024).toFixed(1)} KB`;
}

const prefersReducedMotion = () => {
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
};

interface ExportSectionProps {
  theme: Theme;
  tenant: TenantId;
  format: ExportFormat;
  onFormatChange: (format: ExportFormat) => void;
  focusExport: boolean;
  onExportFocused: () => void;
}

export function ExportSection({ theme, tenant, format, onFormatChange, focusExport, onExportFocused }: ExportSectionProps) {
  const headingId = useId();
  const fileListId = useId();
  const sectionRef = useRef<HTMLElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const codeRef = useRef<HTMLElement>(null);
  const [selectedName, setSelectedName] = useState<string | null>(null);
  const [status, setStatus] = useState('');
  const [copied, setCopied] = useState(false);

  const files = useMemo(() => buildFiles(theme, format, tenant), [theme, format, tenant]);
  const file = files.find((f) => f.name === selectedName) ?? files[0];
  const stats = useMemo(() => {
    if (!file) return '';
    const lines = file.content.split('\n').length;
    const bytes = new Blob([file.content]).size;
    return `${lines.toLocaleString('en')} lines · ${formatBytes(bytes)}`;
  }, [file]);

  // "Export" in the toolbar switches to this tab and asks for focus here.
  useEffect(() => {
    if (!focusExport) return;
    sectionRef.current?.scrollIntoView({ block: 'start', behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
    headingRef.current?.focus({ preventScroll: true });
    onExportFocused();
  }, [focusExport, onExportFocused]);

  useEffect(() => {
    if (!copied) return;
    const t = window.setTimeout(() => setCopied(false), 1600);
    return () => window.clearTimeout(t);
  }, [copied]);

  const announce = (message: string) => {
    setStatus('');
    window.setTimeout(() => setStatus(message), 30);
  };

  const selectCode = () => {
    const el = codeRef.current;
    const selection = window.getSelection();
    if (!el || !selection) return;
    const range = document.createRange();
    range.selectNodeContents(el);
    selection.removeAllRanges();
    selection.addRange(range);
  };

  const onCopy = async () => {
    if (!file) return;
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard API unavailable');
      await navigator.clipboard.writeText(file.content);
      setCopied(true);
      announce(`Copied ${file.name}`);
    } catch {
      selectCode();
      announce(`Clipboard is blocked here. ${file.name} is selected — press Control C or Command C to copy.`);
    }
  };

  /** Hosted single-file demos run in a sandbox that blocks page-started downloads, so offer Copy only. */
  const canDownload = import.meta.env.MODE !== 'single';

  const onDownload = () => {
    if (!file) return;
    try {
      const url = URL.createObjectURL(new Blob([file.content], { type: `${file.mime};charset=utf-8` }));
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      a.rel = 'noopener';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      announce(`Downloading ${file.name}`);
    } catch {
      announce('Download is blocked here. Use Copy instead.');
    }
  };

  return (
    <section ref={sectionRef} id={EXPORT_SECTION_ID} aria-labelledby={headingId} className={styles.section}>
      <div className={ui.sectionHead}>
        <h2 ref={headingRef} id={headingId} className={ui.h2} tabIndex={-1}>
          Export
        </h2>
        <p className={ui.sub}>Every token for this brand, in light and dark, both densities.</p>
      </div>

      <div className={`${ui.card} ${styles.card}`}>
        <div className={styles.toolbar}>
          <Segmented
            legend="Export format"
            legendHidden
            size="sm"
            options={FORMAT_OPTIONS}
            value={format}
            onChange={onFormatChange}
            className={styles.formats}
          />
          <div className={styles.actions}>
            <button
              type="button"
              className={`${ui.btn} ${canDownload ? ui.btnOutline : ui.btnInk}`}
              onClick={onCopy}
              disabled={!file}
            >
              {copied ? (
                <IconCheck size={16} stroke={2} aria-hidden="true" />
              ) : (
                <IconCopy size={16} aria-hidden="true" />
              )}
              {copied ? 'Copied' : 'Copy'}
            </button>
            {canDownload && (
              <button type="button" className={`${ui.btn} ${ui.btnInk}`} onClick={onDownload} disabled={!file}>
                <IconDownload size={16} aria-hidden="true" />
                Download
              </button>
            )}
          </div>
        </div>

        <div className={format === 'figma' ? styles.bodySplit : styles.body}>
          {format === 'figma' && (
            <fieldset className={`${ui.fieldset} ${styles.fileList}`}>
              <legend className={ui.srOnly}>Figma variable files</legend>
              <p className={styles.fileListHint} aria-hidden="true">
                One file per collection mode
              </p>
              {files.map((f) => {
                const id = `${fileListId}-${f.name}`;
                return (
                  <div key={f.name} className={styles.fileItem}>
                    <input
                      id={id}
                      className={styles.fileInput}
                      type="radio"
                      name={fileListId}
                      checked={f.name === file?.name}
                      onChange={() => setSelectedName(f.name)}
                    />
                    <label htmlFor={id} className={styles.fileLabel}>
                      <IconFileCode size={14} aria-hidden="true" />
                      <span className={ui.mono}>{f.name}</span>
                    </label>
                  </div>
                );
              })}
            </fieldset>
          )}

          {file && (
            <div className={styles.viewer}>
              <div className={styles.fileBar}>
                <span className={`${ui.mono} ${styles.fileName}`}>{file.name}</span>
                <span className={`${ui.mono} ${styles.fileStats}`}>{stats}</span>
              </div>
              <pre className={styles.code} tabIndex={0} aria-label={`${file.name} contents`}>
                <code ref={codeRef}>{file.content}</code>
              </pre>
            </div>
          )}
        </div>
      </div>

      <p className={styles.note}>{NOTE}</p>

      <p className={ui.srOnly} aria-live="polite" role="status">
        {status}
      </p>
    </section>
  );
}

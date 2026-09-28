'use client';

import { IconCheck, IconCopy, IconDownload, IconFileCode } from '@syntara/icons';
import { Button } from '@syntara/react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { formatBytes } from './format';
import { highlight, type CodeLang } from './highlight';
import styles from './code-viewer.module.css';

export interface ExportFile {
  name: string;
  content: string;
  mime: string;
  lang: CodeLang;
}

/** Read-only code view with Copy (clipboard, falling back to selecting the text) and Download (a Blob). */
export function CodeViewer({ file }: { file: ExportFile }) {
  const codeRef = useRef<HTMLElement>(null);
  const [copied, setCopied] = useState(false);
  const [status, setStatus] = useState('');

  const highlighted = useMemo(() => highlight(file.content, file.lang), [file.content, file.lang]);
  const stats = useMemo(() => {
    const lines = file.content.split('\n').length;
    const bytes = new Blob([file.content]).size;
    return `${lines.toLocaleString('en')} lines · ${formatBytes(bytes)}`;
  }, [file.content]);

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
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard API unavailable');
      await navigator.clipboard.writeText(file.content);
      setCopied(true);
      announce(`Copied ${file.name} to the clipboard.`);
    } catch {
      selectCode();
      announce(`The clipboard is blocked here, so ${file.name} is selected. Press Control C or Command C to copy it.`);
    }
  };

  const onDownload = () => {
    try {
      const url = URL.createObjectURL(new Blob([file.content], { type: `${file.mime};charset=utf-8` }));
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      a.rel = 'noopener';
      document.body.append(a);
      a.click();
      a.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      announce(`Downloading ${file.name}.`);
    } catch {
      announce('Downloads are blocked here. Use Copy instead.');
    }
  };

  return (
    <figure className={styles.frame}>
      <figcaption className={styles.bar}>
        <IconFileCode className={styles.fileIcon} aria-hidden />
        <span className={styles.name}>{file.name}</span>
        <span className={styles.stats}>{stats}</span>
        <span className={styles.actions}>
          <Button variant="ghost" size="sm" onPress={onCopy}>
            {copied ? <IconCheck aria-hidden stroke={2} /> : <IconCopy aria-hidden />}
            {copied ? 'Copied' : 'Copy'}
          </Button>
          <Button variant="outline" size="sm" onPress={onDownload}>
            <IconDownload aria-hidden />
            Download
          </Button>
        </span>
      </figcaption>
      <pre className={styles.pre} tabIndex={0} aria-label={`${file.name} contents`}>
        <code ref={codeRef}>{highlighted}</code>
      </pre>
      <p className="visually-hidden" role="status" aria-live="polite">
        {status}
      </p>
    </figure>
  );
}

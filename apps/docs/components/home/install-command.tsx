'use client';

import type { ReactNode } from 'react';
import { CopyButton } from '@/components/mdx/code-frame';
import styles from './install-command.module.css';

/** A one-line shell command with a copy button. The command reads left to right on any page. */
export function InstallCommand({
  command,
  label = 'Copy command',
  block = false,
  note,
}: {
  command: string;
  label?: string;
  /** Fill the container's width instead of hugging the command. */
  block?: boolean;
  /**
   * Shown under the command. Say so here when the command does not work yet: a copy button on a command that
   * fails is worse than no command, because the reader finds out in their terminal.
   */
  note?: ReactNode;
}) {
  const box = (
    <div className={styles.command} data-block={block || undefined}>
      <code className={styles.code}>
        <span className={styles.prompt} aria-hidden>
          $
        </span>
        {/* Breaks only between words, never inside a package name. */}
        <span className={styles.words}>
          {command.split(' ').map((word, i) => (
            <span key={i} className={styles.word}>
              {word}
            </span>
          ))}
        </span>
      </code>
      <CopyButton getText={() => command} label={label} className={styles.copy} />
    </div>
  );
  if (!note) return box;
  return (
    <div className={styles.withNote} data-block={block || undefined}>
      {box}
      <p className={styles.note}>{note}</p>
    </div>
  );
}

'use client';

import { CopyButton } from '@/components/mdx/code-frame';
import styles from './install-command.module.css';

/** A one-line shell command with a copy button. The command reads left to right on any page. */
export function InstallCommand({
  command,
  label = 'Copy command',
  block = false,
}: {
  command: string;
  label?: string;
  /** Fill the container's width instead of hugging the command. */
  block?: boolean;
}) {
  return (
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
}

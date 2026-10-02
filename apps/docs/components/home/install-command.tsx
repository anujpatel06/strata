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
  html,
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
  /**
   * Shiki's HTML for the same command, highlighted at build time by the caller (a server component — the
   * highlighter never ships to the browser). Given it, the command is coloured with the same palette as every
   * other code block on the site instead of being one flat grey line. `command` is still what the copy button
   * puts on the clipboard, so the two cannot drift.
   */
  html?: string;
}) {
  const box = (
    <div className={styles.command} data-block={block || undefined}>
      <code className={styles.code}>
        <span className={styles.prompt} aria-hidden>
          $
        </span>
        {html ? (
          /* Shiki's own markup. It wraps between words like the plain version below, rather than scrolling:
             a scroll box would need to be focusable, and a tab stop in the middle of a hero is a cost with no
             benefit on one line of text. */
          <span className={styles.highlighted} dangerouslySetInnerHTML={{ __html: html }} />
        ) : (
          /* Breaks only between words, never inside a package name. */
          <span className={styles.words}>
            {command.split(' ').map((word, i) => (
              <span key={i} className={styles.word}>
                {word}
              </span>
            ))}
          </span>
        )}
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

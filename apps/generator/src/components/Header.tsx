import type { ThemeSummary } from '@syntara/theme-engine';
import { SyntaraMark } from './Glyphs';
import styles from './Header.module.css';
import ui from './ui.module.css';

export function Header({ summary }: { summary: ThemeSummary }) {
  return (
    <header className={styles.header}>
      <div className={styles.lockup}>
        <span className={styles.mark}>
          <SyntaraMark size={20} />
        </span>
        <h1 className={styles.title}>
          <span className={styles.name}>Syntara</span>
          <span className={styles.divider} aria-hidden="true" />
          <span className={styles.product}>
            <span className={ui.srOnly}> </span>Brand Generator
          </span>
        </h1>
        <span className={styles.version}>
          <span className={ui.srOnly}>version </span>v0.1
        </span>
      </div>
      <p className={styles.stats}>
        6 inputs <span aria-hidden="true">→</span>
        <span className={ui.srOnly}>generate</span> {summary.tokenCount} tokens · {summary.generationMs.toFixed(1)} ms
      </p>
    </header>
  );
}

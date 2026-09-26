import { GITHUB_URL } from '@/lib/site';
import styles from './site-footer.module.css';

export function SiteFooter() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <p>
          Designed by Anuj Patel, engineering paired with Claude. Every decision is recorded with who made it. Source on{' '}
          <a href={GITHUB_URL} className={styles.link}>
            GitHub
          </a>
          .
        </p>
      </div>
    </footer>
  );
}

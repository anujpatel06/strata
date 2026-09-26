'use client';

/**
 * ShowcaseGrid — a dense, masonry-like grid of small product surfaces built only from @strata/react.
 * Used live on the homepage and in the /themes preview.
 *
 *   <ThemeScope theme="vela" scheme="dark">
 *     <ShowcaseGrid />
 *   </ThemeScope>
 *
 * It does not theme itself: render it inside a ThemeScope (or any element carrying the --strata-* variables).
 * Columns come from the width of its own box (container queries), not the viewport: 3 columns from 960px,
 * 2 from 600px, otherwise 1 — so it also fits a narrow preview panel. On 3 columns the last card of each
 * column stretches, so the grid ends on one straight line.
 *
 * Content is English and domain-agnostic. `locale` makes the grid locale-aware without translating it:
 * React Aria's locale (calendar, keyboard direction, number formats) and the text direction, so an Arabic
 * locale mirrors the layout. Setting `locale` on the surrounding ThemeScope instead works too; the prop wins.
 */

import type { CSSProperties, JSX } from 'react';
import { I18nProvider } from 'react-aria-components';
import {
  CookieCard,
  CreateAccountCard,
  NotificationsCard,
  PaymentMethodCard,
  QuickActionsCard,
  RenewalsCard,
  ReportIssueCard,
  RevenueCard,
  SendMoneyCard,
  TeamCard,
  TimeOffCard,
  UploadCard,
} from './cards';
import styles from './showcase-grid.module.css';

const RTL_LANGUAGES = new Set(['ar', 'he', 'fa', 'ur', 'ps', 'yi', 'dv', 'ku', 'sd', 'ug']);

export interface ShowcaseGridProps {
  /**
   * BCP 47 locale for the grid, e.g. "ar-AE". Sets React Aria's locale and `dir` for the subtree. Omit to
   * inherit both from the surrounding ThemeScope. The copy stays English either way (the grid sets lang="en").
   */
  locale?: string;
  /** Heading level of each card title. Default 3 (the grid usually sits under a page's h2). */
  headingLevel?: 2 | 3 | 4;
  className?: string;
  style?: CSSProperties;
}

export function ShowcaseGrid({ locale, headingLevel = 3, className, style }: ShowcaseGridProps): JSX.Element {
  const level = headingLevel;
  const language = locale?.split('-')[0]?.toLowerCase();
  const dir = language ? (RTL_LANGUAGES.has(language) ? 'rtl' : 'ltr') : undefined;

  const grid = (
    <div
      className={[styles.root, className].filter(Boolean).join(' ')}
      style={style}
      dir={dir}
      // The copy is English whatever the locale, so screen readers pronounce it as English.
      lang="en"
    >
      <div className={styles.grid}>
        {/* Three columns, balanced by measured card heights (±30px in every tenant). DOM order = reading order:
            on two columns or one, the cards reflow top to bottom in this order. */}
        <div className={styles.column}>
          <div className={styles.item}>
            <RevenueCard level={level} />
          </div>
          <div className={styles.item}>
            <TeamCard level={level} />
          </div>
          <div className={styles.item}>
            <SendMoneyCard level={level} />
          </div>
          <div className={styles.item}>
            <PaymentMethodCard level={level} />
          </div>
        </div>
        <div className={styles.column}>
          <div className={styles.item}>
            <TimeOffCard level={level} />
          </div>
          <div className={styles.item}>
            <QuickActionsCard level={level} />
          </div>
          <div className={styles.item}>
            <RenewalsCard level={level} />
          </div>
          <div className={styles.item}>
            <ReportIssueCard level={level} />
          </div>
        </div>
        <div className={styles.column}>
          <div className={styles.item}>
            <CreateAccountCard level={level} />
          </div>
          <div className={styles.item}>
            <NotificationsCard level={level} />
          </div>
          <div className={styles.item}>
            <UploadCard level={level} />
          </div>
          <div className={styles.item}>
            <CookieCard level={level} />
          </div>
        </div>
      </div>
    </div>
  );
  return locale ? <I18nProvider locale={locale}>{grid}</I18nProvider> : grid;
}

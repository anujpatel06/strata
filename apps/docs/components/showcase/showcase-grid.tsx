'use client';

/**
 * ShowcaseGrid — a bento of product moments from one small business-money app (a revenue chart with a period
 * toggle, balances with trends, a card limit, a payout waiting on approval, a payment calendar), built only from
 * @strata/react and @strata/icons. Used live on the homepage and in the /themes preview.
 *
 *   <ThemeScope theme="vela" scheme="dark">
 *     <ShowcaseGrid />
 *   </ThemeScope>
 *
 * It does not theme itself: render it inside a ThemeScope (or any element carrying the --strata-* variables).
 * Columns come from the width of its own box (container queries), not the viewport: 3 columns from 960px,
 * 2 from 600px, otherwise 1, so it also fits a narrow preview panel. Cards stretch to their area, so every row
 * ends on one straight line.
 *
 * Content is English and every name in it is invented (showcase-data.ts). `locale` makes the grid locale-aware
 * without translating it: React Aria's locale (calendar, keyboard direction, chart direction) and the text
 * direction, so an Arabic locale mirrors the layout. Money stays en-US, to match the English copy around it.
 * Setting `locale` on the surrounding ThemeScope instead works too; the prop wins.
 */

import type { CSSProperties, JSX } from 'react';
import { I18nProvider } from 'react-aria-components';
import {
  AccountsCard,
  ActivityCard,
  AlertsCard,
  ApprovalsCard,
  LimitsCard,
  PromoCard,
  RevenueCard,
  ScheduleCard,
  TransferCard,
} from './cards';
import styles from './showcase-grid.module.css';

/** Grid areas, in reading order. The area names are the hooks the layout in showcase-grid.module.css places. */
const CARDS = [
  { area: 'revenue', Card: RevenueCard },
  { area: 'promo', Card: PromoCard },
  { area: 'accounts', Card: AccountsCard },
  { area: 'limits', Card: LimitsCard },
  { area: 'approvals', Card: ApprovalsCard },
  { area: 'schedule', Card: ScheduleCard },
  { area: 'transfer', Card: TransferCard },
  { area: 'activity', Card: ActivityCard },
  { area: 'alerts', Card: AlertsCard },
] as const;

const RTL_LANGUAGES = new Set(['ar', 'he', 'fa', 'ur', 'ps', 'yi', 'dv', 'ku', 'sd', 'ug']);

export interface ShowcaseGridProps {
  /**
   * BCP 47 locale for the grid, e.g. "ar-AE". Sets React Aria's locale and `dir` for the subtree. Omit to
   * inherit both from the surrounding ThemeScope. The copy stays English either way (the grid sets lang="en").
   */
  locale?: string;
  /** Heading level of each card title. Default 3 (the grid usually sits under a page's h2). */
  headingLevel?: 2 | 3 | 4;
  /**
   * Page motion for the homepage: cards rise in as they scroll into view and lift on hover. Off by default,
   * because the /themes preview is a fixed panel where cards shouldn't move. Styles: showcase-grid.module.css.
   */
  motion?: boolean;
  className?: string;
  style?: CSSProperties;
}

export function ShowcaseGrid({ locale, headingLevel = 3, motion = false, className, style }: ShowcaseGridProps): JSX.Element {
  const level = headingLevel;
  const language = locale?.split('-')[0]?.toLowerCase();
  const dir = language ? (RTL_LANGUAGES.has(language) ? 'rtl' : 'ltr') : undefined;

  const grid = (
    <div
      className={[styles.root, className].filter(Boolean).join(' ')}
      style={style}
      data-motion={motion || undefined}
      dir={dir}
      // The copy is English whatever the locale, so screen readers pronounce it as English.
      lang="en"
    >
      <div className={styles.grid}>
        {/* A bento of named areas (showcase-grid.module.css). DOM order = reading order: on one column the cards
            stack in this order, and the hero chart and the feature card come first on every layout. */}
        {CARDS.map(({ area, Card }) => (
          <div key={area} className={styles.item} data-area={area}>
            <Card level={level} />
          </div>
        ))}
      </div>
    </div>
  );
  return locale ? <I18nProvider locale={locale}>{grid}</I18nProvider> : grid;
}

'use client';

import { IconChevronLeft, IconChevronRight, IconDots } from '@syntara/icons';
import { useMemo, type HTMLAttributes, type JSX } from 'react';
import { Button as RACButton, useLocale } from 'react-aria-components';
import styles from './pagination.module.css';

const cx = (...c: Array<string | false | null | undefined>) => c.filter(Boolean).join(' ');

type PageItem = number | 'start-ellipsis' | 'end-ellipsis';

const range = (start: number, end: number): number[] =>
  Array.from({ length: Math.max(end - start + 1, 0) }, (_, i) => start + i);

/**
 * Pages to show: boundary pages at each end, siblings around the current page, ellipses for the gaps.
 * With enough pages the item count is constant (2 × boundary + 2 × siblings + 3), so the control never changes width.
 */
function getPageItems(page: number, pageCount: number, siblingCount: number, boundaryCount: number): PageItem[] {
  const startPages = range(1, Math.min(boundaryCount, pageCount));
  const endPages = range(Math.max(pageCount - boundaryCount + 1, boundaryCount + 1), pageCount);
  const siblingsStart = Math.max(
    Math.min(page - siblingCount, pageCount - boundaryCount - siblingCount * 2 - 1),
    boundaryCount + 2,
  );
  const siblingsEnd = Math.min(
    Math.max(page + siblingCount, boundaryCount + siblingCount * 2 + 2),
    endPages.length > 0 ? (endPages[0] as number) - 2 : pageCount - 1,
  );
  const items: PageItem[] = [...startPages];
  if (siblingsStart > boundaryCount + 2) items.push('start-ellipsis');
  else if (boundaryCount + 1 < pageCount - boundaryCount) items.push(boundaryCount + 1);
  items.push(...range(siblingsStart, siblingsEnd));
  if (siblingsEnd < pageCount - boundaryCount - 1) items.push('end-ellipsis');
  else if (pageCount - boundaryCount > boundaryCount) items.push(pageCount - boundaryCount);
  items.push(...endPages);
  return items;
}

export interface PaginationProps extends Omit<HTMLAttributes<HTMLElement>, 'children' | 'onChange'> {
  /** Current page, 1-based. */
  page: number;
  /** Total number of pages. */
  pageCount: number;
  onPageChange?: (page: number) => void;
  /** Pages shown on each side of the current page. */
  siblingCount?: number;
  /** Pages always shown at the start and end. */
  boundaryCount?: number;
  /** `default` shows page buttons; `compact` shows "Page 3 of 12" between previous and next. */
  variant?: 'default' | 'compact';
  /**
   * Accessible name. Landmarks must be unique on a page, so when a page has more than one pagination
   * (or other navigation), name each for what it pages: "Search results pages", "Orders pages".
   */
  label?: string;
  /**
   * Render as a navigation landmark (`<nav>`). Set false for paging that belongs to a component rather than the
   * page (DataTablePagination does), which renders a labelled group instead and never collides with other landmarks.
   */
  landmark?: boolean;
  /** Text of the previous button; also its accessible name when the text is visually hidden. */
  previousLabel?: string;
  /** Text of the next button; also its accessible name when the text is visually hidden. */
  nextLabel?: string;
  /** Word used in "Page 3 of 12" and in each page button's accessible name ("Page 3"). */
  pageLabel?: string;
  /** Word used in "Page 3 of 12". */
  ofLabel?: string;
  isDisabled?: boolean;
}

/**
 * Page navigation. Previous/next labels hide below a 520px container; below 400px the page buttons collapse
 * into "Page 3 of 12". At the first and last page, previous/next stay focusable but are marked `aria-disabled`,
 * so keyboard focus is never dropped.
 */
export function Pagination({
  page,
  pageCount,
  onPageChange,
  siblingCount = 1,
  boundaryCount = 1,
  variant = 'default',
  label = 'Pagination',
  previousLabel = 'Previous',
  nextLabel = 'Next',
  pageLabel = 'Page',
  ofLabel = 'of',
  isDisabled = false,
  landmark = true,
  className,
  ...rest
}: PaginationProps): JSX.Element {
  const { locale } = useLocale();
  const nf = useMemo(() => new Intl.NumberFormat(locale), [locale]);
  const Root = landmark ? 'nav' : 'div';
  const count = Math.max(0, Math.floor(pageCount));
  const current = Math.min(Math.max(1, Math.floor(page)), Math.max(1, count));
  const items = variant === 'compact' ? [] : getPageItems(current, count, Math.max(0, siblingCount), Math.max(1, boundaryCount));
  const atStart = current <= 1;
  const atEnd = current >= count;

  const go = (next: number) => {
    if (isDisabled || next < 1 || next > count || next === current) return;
    onPageChange?.(next);
  };

  const summary = (
    <span className={styles.summaryText}>
      {pageLabel} <span className={styles.num}>{nf.format(count === 0 ? 0 : current)}</span> {ofLabel}{' '}
      <span className={styles.num}>{nf.format(count)}</span>
    </span>
  );

  return (
    <Root {...rest} role={landmark ? undefined : 'group'} aria-label={label} data-variant={variant} className={cx(styles.root, className)}>
      <ul className={styles.list}>
        <li className={styles.stepItem}>
          <RACButton
            className={cx(styles.button, styles.step)}
            aria-disabled={atStart || undefined}
            isDisabled={isDisabled}
            onPress={() => !atStart && go(current - 1)}
          >
            <IconChevronLeft className={styles.dirIcon} aria-hidden="true" size="1.15em" />
            <span className={styles.stepLabel}>{previousLabel}</span>
          </RACButton>
        </li>

        {items.map((item) =>
          typeof item === 'number' ? (
            <li key={item} className={styles.pageItem}>
              <RACButton
                className={cx(styles.button, styles.page)}
                aria-label={`${pageLabel} ${nf.format(item)}`}
                aria-current={item === current ? 'page' : undefined}
                isDisabled={isDisabled}
                onPress={() => go(item)}
              >
                {/* The raised key behind the current page. Every page button has one so the old key fades out
                    while the new one pops in (CSS only; see .currentPill). */}
                <span className={styles.currentPill} aria-hidden="true" />
                <span className={styles.pageNum}>{nf.format(item)}</span>
              </RACButton>
            </li>
          ) : (
            <li key={item} className={cx(styles.pageItem, styles.ellipsis)} aria-hidden="true">
              <IconDots size="1em" />
            </li>
          ),
        )}

        <li className={cx(styles.summary, variant === 'compact' && styles.summaryCompact)} aria-live={variant === 'compact' ? 'polite' : undefined}>
          {summary}
        </li>

        <li className={styles.stepItem}>
          <RACButton
            className={cx(styles.button, styles.step)}
            aria-disabled={atEnd || undefined}
            isDisabled={isDisabled}
            onPress={() => !atEnd && go(current + 1)}
          >
            <span className={styles.stepLabel}>{nextLabel}</span>
            <IconChevronRight className={styles.dirIcon} aria-hidden="true" size="1.15em" />
          </RACButton>
        </li>
      </ul>
    </Root>
  );
}

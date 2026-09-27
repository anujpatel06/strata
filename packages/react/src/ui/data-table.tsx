'use client';

import { IconArrowUp, IconSelector } from '@strata/icons';
import {
  useLayoutEffect,
  useMemo,
  useRef,
  type CSSProperties,
  type HTMLAttributes,
  type JSX,
  type ReactNode,
} from 'react';
import {
  Cell,
  Collection,
  Column,
  Row,
  Table,
  TableBody,
  TableHeader,
  VisuallyHidden,
  useLocale,
  type Key,
  type Selection,
  type SortDescriptor,
  type TableProps,
} from 'react-aria-components';
import { Checkbox } from './checkbox';
import { Pagination, type PaginationProps } from './pagination';
import { Skeleton } from './skeleton';
import styles from './data-table.module.css';

const cx = (...c: Array<string | false | null | undefined>) => c.filter(Boolean).join(' ');

export type DataTableSortDescriptor = SortDescriptor;
export type DataTableSelection = Selection;

export interface DataTableColumn<T> {
  /** Unique id; also the key passed to `onSortChange` and `useSortedRows` accessors. */
  id: string;
  header: ReactNode;
  /** Announced by screen readers when moving between rows. Mark the column that names the row (e.g. a reference). */
  isRowHeader?: boolean;
  allowsSorting?: boolean;
  /** Use `end` for numbers and amounts (they also get tabular figures). */
  align?: 'start' | 'end' | 'center';
  /** Preferred width (px or any CSS length). */
  width?: number | string;
  minWidth?: number;
  /** Plain-text header for assistive technology when `header` is not a string. */
  textValue?: string;
  cell: (row: T) => ReactNode;
}

type DataTableLabelling =
  | { 'aria-label': string; 'aria-labelledby'?: string }
  | { 'aria-label'?: string; 'aria-labelledby': string };

interface DataTableBaseProps<T>
  extends Omit<
    TableProps,
    | 'children'
    | 'aria-label'
    | 'aria-labelledby'
    | 'className'
    | 'style'
    | 'selectionMode'
    | 'onRowAction'
    | 'sortDescriptor'
    | 'onSortChange'
    | 'render'
  > {
  columns: DataTableColumn<T>[];
  rows: readonly T[];
  getRowId: (row: T) => string;
  /** Adds a checkbox column. `multiple` also adds select-all in the header. */
  selectionMode?: 'none' | 'single' | 'multiple';
  sortDescriptor?: DataTableSortDescriptor;
  onSortChange?: (descriptor: DataTableSortDescriptor) => void;
  /** Called when a row is activated (click, Enter). With selection on, the checkbox still toggles selection. */
  onRowAction?: (id: string) => void;
  /** Shows skeleton rows and marks the table `aria-busy`. */
  isLoading?: boolean;
  /** Number of skeleton rows while loading. Match your page size to avoid a jump. */
  loadingRowCount?: number;
  /** Read by screen readers as each skeleton row's header while loading. */
  loadingLabel?: string;
  /** Shown in place of rows when `rows` is empty. Pass an `<EmptyState size="sm" … />` for a richer message. */
  emptyState?: ReactNode;
  /** Overrides the theme's density for this table only. */
  density?: 'comfortable' | 'compact';
  /** Keeps the header visible while the body scrolls. Needs `maxBlockSize` (the table scrolls inside itself). */
  stickyHeader?: boolean;
  /** Maximum height of the scroll container, e.g. 480 or "60vh". */
  maxBlockSize?: number | string;
  /** Class for the outer scroll container. */
  className?: string;
  style?: CSSProperties;
}

export type DataTableProps<T> = DataTableBaseProps<T> & DataTableLabelling;

const SKELETON_WIDTHS = ['72%', '48%', '60%', '84%', '40%', '56%'];

interface LoadingRow {
  __strataLoading: number;
}

/** The Table fills in the name ("Select", "Select All"), checked and indeterminate state through the "selection" slot. */
function SelectionCheckbox({ isDisabled }: { isDisabled?: boolean }): JSX.Element {
  return <Checkbox slot="selection" className={styles.checkbox} isDisabled={isDisabled || undefined} />;
}

/**
 * One arrow for both directions: descending rotates it 180° (with the spring when motion is allowed), so flipping
 * the sort visibly turns the arrow instead of swapping glyphs. Unsorted columns show a faint up/down selector.
 */
function SortIcon({ direction }: { direction: SortDescriptor['direction'] | undefined }): JSX.Element {
  return (
    <span className={styles.sortIcon} data-direction={direction} aria-hidden="true">
      {direction ? (
        <IconArrowUp className={styles.sortArrow} size="1.15em" />
      ) : (
        <IconSelector size="1.15em" />
      )}
    </span>
  );
}

const alignClass = (align: DataTableColumn<unknown>['align']) =>
  align === 'end' ? styles.alignEnd : align === 'center' ? styles.alignCenter : undefined;

/**
 * A data table: sorting, row selection, loading and empty states, sticky header, density.
 * Built on React Aria's Table — arrow keys move between cells, Enter/Space on a sortable header sorts,
 * Space toggles row selection. Scrolls sideways inside itself on narrow screens.
 *
 * Sorting is controlled: keep `sortDescriptor` in state and sort `rows` yourself (see `useSortedRows`)
 * or on the server.
 */
export function DataTable<T>({
  columns,
  rows,
  getRowId,
  selectionMode = 'none',
  onRowAction,
  isLoading = false,
  loadingRowCount = 5,
  loadingLabel = 'Loading',
  emptyState,
  density,
  stickyHeader = true,
  maxBlockSize,
  className,
  style,
  ...tableProps
}: DataTableProps<T>): JSX.Element {
  const tableRef = useRef<HTMLTableElement | HTMLDivElement>(null);
  const hasSelection = selectionMode !== 'none';

  const loadingRows = useMemo<LoadingRow[]>(
    () => Array.from({ length: Math.max(1, loadingRowCount) }, (_, i) => ({ __strataLoading: i })),
    [loadingRowCount],
  );
  const loadingKeys = useMemo(() => loadingRows.map((r) => `strata-loading-${r.__strataLoading}`), [loadingRows]);

  // Every row needs a row header. Without an explicit one React Aria would pick the first column — which is the
  // checkbox column when selection is on — so default to the first data column instead.
  const rowHeaderIds = useMemo(() => {
    const ids = columns.filter((c) => c.isRowHeader).map((c) => c.id);
    return new Set(ids.length > 0 ? ids : columns.slice(0, 1).map((c) => c.id));
  }, [columns]);

  // React Aria's Table doesn't forward aria-busy, so set it on the grid element directly.
  useLayoutEffect(() => {
    const el = tableRef.current;
    if (!el) return;
    if (isLoading) el.setAttribute('aria-busy', 'true');
    else el.removeAttribute('aria-busy');
  }, [isLoading]);

  return (
    <div
      className={cx(styles.root, stickyHeader && styles.sticky, className)}
      data-density={density}
      data-loading={isLoading || undefined}
      style={{ maxBlockSize, ...style }}
    >
      <Table
        {...tableProps}
        ref={tableRef}
        className={styles.table}
        selectionMode={hasSelection ? selectionMode : 'none'}
        disabledKeys={isLoading ? loadingKeys : tableProps.disabledKeys}
        onRowAction={onRowAction && !isLoading ? (key: Key) => onRowAction(String(key)) : undefined}
        data-actionable={(onRowAction && !isLoading) || undefined}
      >
        <TableHeader className={styles.header}>
          {hasSelection && (
            <Column id="strata-selection" className={cx(styles.column, styles.selectionColumn)}>
              {selectionMode === 'multiple' ? <SelectionCheckbox isDisabled={isLoading} /> : <VisuallyHidden>Select</VisuallyHidden>}
            </Column>
          )}
          <Collection items={columns}>
            {(col) => (
              <Column
                id={col.id}
                isRowHeader={rowHeaderIds.has(col.id)}
                allowsSorting={col.allowsSorting}
                textValue={col.textValue ?? (typeof col.header === 'string' ? col.header : undefined)}
                className={cx(styles.column, alignClass(col.align))}
                style={{ inlineSize: col.width, minInlineSize: col.minWidth }}
              >
                {({ allowsSorting, sortDirection }) => (
                  <span className={styles.columnInner}>
                    <span className={styles.columnLabel}>{col.header}</span>
                    {allowsSorting && <SortIcon direction={sortDirection} />}
                  </span>
                )}
              </Column>
            )}
          </Collection>
        </TableHeader>

        {isLoading ? (
          <TableBody className={styles.body} items={loadingRows} dependencies={[columns, hasSelection, loadingLabel]}>
            {(item) => (
              <Row id={`strata-loading-${item.__strataLoading}`} className={styles.row} data-skeleton="">
                {hasSelection && <Cell className={cx(styles.cell, styles.selectionCell)} />}
                <Collection items={columns}>
                  {(col) => (
                    <Cell className={cx(styles.cell, alignClass(col.align))}>
                      {/* Row headers must have text: skeleton rows announce "Loading" instead of an empty header. */}
                      {rowHeaderIds.has(col.id) && <VisuallyHidden>{loadingLabel}</VisuallyHidden>}
                      <Skeleton
                        className={styles.skeleton}
                        radius="badge"
                        blockSize="0.75em"
                        inlineSize={SKELETON_WIDTHS[(item.__strataLoading + columns.indexOf(col)) % SKELETON_WIDTHS.length]}
                      />
                    </Cell>
                  )}
                </Collection>
              </Row>
            )}
          </TableBody>
        ) : (
          <TableBody
            className={styles.body}
            items={rows}
            dependencies={[columns, hasSelection]}
            renderEmptyState={() => <div className={styles.empty}>{emptyState ?? 'No results.'}</div>}
          >
            {(row) => (
              <Row id={getRowId(row)} className={styles.row}>
                {hasSelection && (
                  <Cell className={cx(styles.cell, styles.selectionCell)}>
                    <SelectionCheckbox />
                  </Cell>
                )}
                <Collection items={columns} dependencies={[row]}>
                  {(col) => <Cell className={cx(styles.cell, alignClass(col.align))}>{col.cell(row)}</Cell>}
                </Collection>
              </Row>
            )}
          </TableBody>
        )}
      </Table>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Client-side sorting
 * ------------------------------------------------------------------ */

export type SortValue = string | number | bigint | boolean | Date | null | undefined;
/** Per-column functions that return the value to sort by, keyed by column id. */
export type SortAccessors<T> = Partial<Record<string, (row: T) => SortValue>>;

/**
 * Sorts rows for a controlled `sortDescriptor`. Strings use locale-aware, numeric collation ("Item 2" < "Item 10"),
 * dates and numbers compare by value, empty values go last in either direction, and ties keep their original order.
 * Define `accessors` outside your component (or memoise it) so the result is stable between renders.
 */
export function useSortedRows<T>(rows: readonly T[], sortDescriptor: DataTableSortDescriptor | undefined, accessors: SortAccessors<T>): T[] {
  const { locale } = useLocale();
  const column = sortDescriptor?.column;
  const direction = sortDescriptor?.direction;
  return useMemo(() => {
    const get = column != null ? accessors[String(column)] : undefined;
    if (!get) return [...rows];
    const collator = new Intl.Collator(locale, { numeric: true, sensitivity: 'base' });
    const dir = direction === 'descending' ? -1 : 1;
    const norm = (v: SortValue) => (v instanceof Date ? v.getTime() : typeof v === 'boolean' ? Number(v) : v);
    return rows
      .map((row, index) => ({ row, index, value: norm(get(row)) }))
      .sort((a, b) => {
        const aEmpty = a.value == null || a.value === '' || (typeof a.value === 'number' && Number.isNaN(a.value));
        const bEmpty = b.value == null || b.value === '' || (typeof b.value === 'number' && Number.isNaN(b.value));
        if (aEmpty || bEmpty) return aEmpty && bEmpty ? a.index - b.index : aEmpty ? 1 : -1;
        let c: number;
        if (typeof a.value === 'string' || typeof b.value === 'string') c = collator.compare(String(a.value), String(b.value));
        else c = (a.value as number | bigint) < (b.value as number | bigint) ? -1 : (a.value as number | bigint) > (b.value as number | bigint) ? 1 : 0;
        return c !== 0 ? c * dir : a.index - b.index;
      })
      .map((x) => x.row);
  }, [rows, column, direction, accessors, locale]);
}

/* ------------------------------------------------------------------ *
 * Toolbar + pagination footer
 * ------------------------------------------------------------------ */

export interface DataTableToolbarProps extends HTMLAttributes<HTMLDivElement> {}

/** A row above the table for search, filters and actions. The first child sits at the start, the last at the end; wraps when narrow. */
export function DataTableToolbar({ className, ...props }: DataTableToolbarProps): JSX.Element {
  return <div {...props} className={cx(styles.toolbar, className)} />;
}

export interface DataTablePaginationProps extends Omit<PaginationProps, 'pageCount' | 'variant' | 'landmark'> {
  /**
   * Render the pager as a navigation landmark. Off by default: table paging belongs to the table, so it is a
   * labelled group and any number of tables can share a page. Turn it on with a unique `label`.
   */
  landmark?: boolean;
  pageSize: number;
  totalCount: number;
  /** Builds the range text. Default: "Showing 1–10 of 48". */
  formatSummary?: (range: { start: number; end: number; total: number }) => ReactNode;
}

/** Pagination under a table, with a live "Showing 1–10 of 48" summary. */
export function DataTablePagination({
  page,
  pageSize,
  totalCount,
  formatSummary,
  landmark = false,
  className,
  ...paginationProps
}: DataTablePaginationProps): JSX.Element {
  const { locale } = useLocale();
  const nf = useMemo(() => new Intl.NumberFormat(locale), [locale]);
  const size = Math.max(1, Math.floor(pageSize));
  const total = Math.max(0, Math.floor(totalCount));
  const pageCount = Math.max(1, Math.ceil(total / size));
  const current = Math.min(Math.max(1, page), pageCount);
  const start = total === 0 ? 0 : (current - 1) * size + 1;
  const end = Math.min(current * size, total);

  const summary = formatSummary ? (
    formatSummary({ start, end, total })
  ) : total === 0 ? (
    'No results'
  ) : (
    <>
      Showing{' '}
      <span className={styles.summaryNum}>
        {nf.format(start)}–{nf.format(end)}
      </span>{' '}
      of <span className={styles.summaryNum}>{nf.format(total)}</span>
    </>
  );

  return (
    <div className={cx(styles.footer, className)}>
      <p className={styles.footerSummary} aria-live="polite">
        {summary}
      </p>
      <Pagination {...paginationProps} landmark={landmark} page={current} pageCount={pageCount} className={styles.footerPagination} />
    </div>
  );
}

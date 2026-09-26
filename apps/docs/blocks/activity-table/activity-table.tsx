'use client';

/**
 * Activity table — a full data-table page: search, status filter, sortable columns, row selection with bulk
 * actions, CSV export of the current view, row density, pagination, and empty and loading states (Refresh shows
 * the skeleton while it "reloads"). Built only from Strata components; copy and rows come from `content`.
 *
 * `headingLevel` (default 1) is the level of the page title. Above 1 the block is embedded in another page and
 * renders no <main> landmark.
 */

import {
  Badge,
  Button,
  Card,
  DataTable,
  DataTablePagination,
  DataTableToolbar,
  EmptyState,
  Menu,
  MenuItem,
  MenuTrigger,
  SearchField,
  Select,
  SelectItem,
  ToastRegion,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  TooltipTrigger,
  toast,
  useSortedRows,
  type DataTableColumn,
  type DataTableSelection,
  type DataTableSortDescriptor,
} from '@strata/react';
import {
  IconBaselineDensityMedium,
  IconBaselineDensitySmall,
  IconChevronDown,
  IconDownload,
  IconRefresh,
  IconSearch,
} from '@tabler/icons-react';
import { useId, useLayoutEffect, useMemo, useRef, useState, type HTMLAttributes, type JSX, type RefObject } from 'react';
import { activityTableContent, type ActivityPlural, type ActivityRow, type ActivityTableContent } from './activity-table.content';
import styles from './activity-table.module.css';

const cx = (...c: Array<string | false | null | undefined>) => c.filter(Boolean).join(' ');

type Level = 1 | 2 | 3 | 4 | 5 | 6;
const level = (n: number): Level => Math.min(6, Math.max(1, Math.round(n))) as Level;
const subLevel = (n: number) => Math.min(6, Math.max(2, Math.round(n))) as Exclude<Level, 1>;

function Heading({ level: l, ...rest }: { level: Level } & HTMLAttributes<HTMLHeadingElement>): JSX.Element {
  const Tag = `h${l}` as const;
  return <Tag {...rest} />;
}

const PAGE_SIZE = 8;
/** Below this width (px) the table folds date, category and status into two columns. */
const COMPACT_TABLE_BELOW = 640;
const ALL = '__all';

type Density = 'comfortable' | 'compact';

function useWidthBelow(ref: RefObject<HTMLElement | null>, width: number): boolean {
  const [below, setBelow] = useState(false);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(([entry]) => {
      if (entry) setBelow(entry.contentRect.width < width);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref, width]);
  return below;
}

/* ------------------------------------------------------------------ *
 * Formatting — Intl in the content locale
 * ------------------------------------------------------------------ */

const MINUS = '−';

function useFormat(locale: string, currency: string) {
  return useMemo(() => {
    const signed = new Intl.NumberFormat(locale, { style: 'currency', currency, signDisplay: 'exceptZero' });
    const number = new Intl.NumberFormat(locale);
    const day = new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
    const plural = new Intl.PluralRules(locale);
    return {
      amount: (v: number) =>
        signed
          .formatToParts(v)
          .map((p) => (p.type === 'minusSign' ? p.value.replace('-', MINUS) : p.value))
          .join(''),
      date: (iso: string) => {
        const d = new Date(`${iso}T00:00:00Z`);
        return Number.isNaN(d.getTime()) ? iso : day.format(d);
      },
      number: (n: number) => number.format(n),
      count: (n: number, forms: ActivityPlural) =>
        (forms[plural.select(n) as keyof ActivityPlural] ?? forms.other).replace('{count}', number.format(n)),
    };
  }, [locale, currency]);
}

/** Quotes a CSV field when it contains a separator, quote or line break. */
const csvCell = (v: string | number) => {
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replaceAll('"', '""')}"` : s;
};

/* ------------------------------------------------------------------ *
 * Block
 * ------------------------------------------------------------------ */

export interface ActivityTableProps {
  /** All copy and rows. Defaults to the English sample in ./activity-table.content.ts. */
  content?: ActivityTableContent;
  /** Level of the page title (default 1). Above 1 the block renders as embedded: no <main>. */
  headingLevel?: 1 | 2 | 3 | 4;
  /** Shows the skeleton rows, e.g. while your rows load. Refresh also shows them briefly. */
  isLoading?: boolean;
  className?: string;
}

export function ActivityTable({
  content = activityTableContent,
  headingLevel = 1,
  isLoading = false,
  className,
}: ActivityTableProps): JSX.Element {
  const uid = useId();
  const a = content.activity;
  const fmt = useFormat(content.locale, content.currency);
  const embedded = headingLevel > 1;
  const Main = embedded ? 'div' : 'main';

  const rootRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const compact = useWidthBelow(cardRef, COMPACT_TABLE_BELOW);

  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<string>(ALL);
  const [sort, setSort] = useState<DataTableSortDescriptor>({ column: 'date', direction: 'descending' });
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [refreshing, setRefreshing] = useState(false);
  const loading = isLoading || refreshing;
  const [density, setDensity] = useState<Density | undefined>();

  // Start the density toggle on the theme's own density: compare its table row height with the comfortable one.
  useLayoutEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const style = getComputedStyle(el);
    const row = parseFloat(style.getPropertyValue('--strata-table-row-height'));
    const comfortable = parseFloat(style.getPropertyValue('--strata-space-12'));
    if (Number.isFinite(row) && Number.isFinite(comfortable)) setDensity(row >= comfortable ? 'comfortable' : 'compact');
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLocaleLowerCase(content.locale);
    return a.rows.filter(
      (row) =>
        (status === ALL || row.status === status) &&
        (!q || [row.title, row.meta, row.category, row.id].some((v) => v.toLocaleLowerCase(content.locale).includes(q))),
    );
  }, [a.rows, query, status, content.locale]);

  const accessors = useMemo(
    () => ({
      date: (r: ActivityRow) => r.date,
      description: (r: ActivityRow) => r.title,
      category: (r: ActivityRow) => r.category,
      status: (r: ActivityRow) => a.statuses[r.status]?.label ?? r.status,
      amount: (r: ActivityRow) => r.amount,
    }),
    [a.statuses],
  );
  const sorted = useSortedRows(filtered, sort, accessors);
  const pageCount = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const current = Math.min(page, pageCount);
  const pageRows = sorted.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

  const resetView = () => {
    setPage(1);
    setSelected(new Set());
  };

  const onSelectionChange = (keys: DataTableSelection) => {
    // "Select all" in the header means the rows on this page.
    setSelected(keys === 'all' ? new Set(pageRows.map((r) => r.id)) : new Set([...keys].map(String)));
  };

  const refresh = () => {
    setRefreshing(true);
    setSelected(new Set());
    // Stands in for refetching.
    setTimeout(() => setRefreshing(false), 1400);
  };

  const exportCsv = () => {
    const header = [a.columns.date, a.columns.description, a.columns.category, a.columns.status, a.columns.amount, 'ID'];
    const lines = sorted.map((r) =>
      [r.date, `${r.title} · ${r.meta}`, r.category, a.statuses[r.status]?.label ?? r.status, r.amount, r.id].map(csvCell).join(','),
    );
    // BOM so spreadsheet apps read non-Latin text (Arabic, Hindi…) as UTF-8.
    const blob = new Blob(['﻿' + [header.map(csvCell).join(','), ...lines].join('\r\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'activity.csv';
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 0);
    toast({ title: fmt.count(sorted.length, a.exported), tone: 'success' });
  };

  const columns = useMemo<DataTableColumn<ActivityRow>[]>(() => {
    const statusBadge = (row: ActivityRow) => {
      const s = a.statuses[row.status] ?? { label: row.status, tone: 'neutral' as const };
      return (
        <Badge tone={s.tone} size={compact ? 'sm' : 'md'}>
          {s.label}
        </Badge>
      );
    };
    const description: DataTableColumn<ActivityRow> = {
      id: 'description',
      header: a.columns.description,
      isRowHeader: true,
      allowsSorting: true,
      cell: (row) => (
        <span className={styles.desc}>
          <span className={styles.descTitle}>{row.title}</span>
          <span className={styles.descMeta}>{compact ? `${fmt.date(row.date)} · ${row.meta}` : row.meta}</span>
        </span>
      ),
    };
    const amount: DataTableColumn<ActivityRow> = {
      id: 'amount',
      header: a.columns.amount,
      align: 'end',
      allowsSorting: true,
      cell: (row) =>
        compact ? (
          <span className={styles.amountStack}>
            <span className={cx(styles.amount, row.amount > 0 && styles.amountIn)}>{fmt.amount(row.amount)}</span>
            {statusBadge(row)}
          </span>
        ) : (
          <span className={cx(styles.amount, row.amount > 0 && styles.amountIn)}>{fmt.amount(row.amount)}</span>
        ),
    };
    if (compact) return [description, amount];
    return [
      { id: 'date', header: a.columns.date, allowsSorting: true, cell: (row) => <time dateTime={row.date}>{fmt.date(row.date)}</time> },
      description,
      { id: 'category', header: a.columns.category, allowsSorting: true, cell: (row) => row.category },
      { id: 'status', header: a.columns.status, allowsSorting: true, cell: statusBadge },
      amount,
    ];
  }, [a.columns, a.statuses, compact, fmt]);

  const count = selected.size;
  const { pagination: p } = a;

  return (
    <div ref={rootRef} className={cx(styles.root, className)}>
      <Main className={styles.page} aria-labelledby={embedded ? undefined : `${uid}-title`}>
        <div className={styles.header}>
          <div className={styles.titleBlock}>
            <Heading level={level(headingLevel)} id={`${uid}-title`} className={styles.title}>
              {a.title}
            </Heading>
            <p className={styles.description}>{a.description}</p>
          </div>
          <div className={styles.headerActions}>
            <Button variant="outline" onPress={refresh} isDisabled={loading}>
              <IconRefresh aria-hidden />
              {a.refresh}
            </Button>
            <Button variant="primary" onPress={exportCsv} isDisabled={loading || sorted.length === 0}>
              <IconDownload aria-hidden />
              {a.export}
            </Button>
          </div>
        </div>

        <Card className={styles.card} ref={cardRef}>
          <DataTableToolbar className={styles.toolbar}>
            <div className={styles.filters}>
              <SearchField
                aria-label={a.search.label}
                placeholder={a.search.placeholder}
                value={query}
                onChange={(v) => {
                  setQuery(v);
                  resetView();
                }}
                className={styles.search}
              />
              <Select
                aria-label={a.status.label}
                selectedKey={status}
                onSelectionChange={(key) => {
                  setStatus(key == null ? ALL : String(key));
                  resetView();
                }}
                className={styles.status}
              >
                <SelectItem id={ALL}>{a.status.all}</SelectItem>
                {Object.entries(a.statuses).map(([id, s]) => (
                  <SelectItem key={id} id={id}>
                    {s.label}
                  </SelectItem>
                ))}
              </Select>
            </div>
            <div className={styles.tools}>
              <span className={styles.selection} aria-live="polite">
                {count > 0 ? fmt.count(count, a.selected) : ''}
              </span>
              <MenuTrigger>
                <Button variant="outline" isDisabled={count === 0} className={styles.bulk}>
                  {a.bulk.label}
                  <IconChevronDown aria-hidden />
                </Button>
                <Menu
                  placement="bottom end"
                  onAction={(key) => {
                    const item = a.bulk.items.find((i) => i.id === key);
                    if (!item) return;
                    toast({ title: fmt.count(count, item.done), tone: 'success' });
                    setSelected(new Set());
                  }}
                >
                  {a.bulk.items.map((item) => (
                    <MenuItem key={item.id} id={item.id}>
                      {item.label}
                    </MenuItem>
                  ))}
                </Menu>
              </MenuTrigger>
              <ToggleButtonGroup
                aria-label={a.density.label}
                size="sm"
                selectedKeys={density ? [density] : []}
                disallowEmptySelection
                onSelectionChange={(keys) => {
                  const [next] = keys;
                  if (next === 'comfortable' || next === 'compact') setDensity(next);
                }}
              >
                <TooltipTrigger delay={500}>
                  <ToggleButton id="comfortable" aria-label={a.density.comfortable}>
                    <IconBaselineDensityMedium aria-hidden />
                  </ToggleButton>
                  <Tooltip>{a.density.comfortable}</Tooltip>
                </TooltipTrigger>
                <TooltipTrigger delay={500}>
                  <ToggleButton id="compact" aria-label={a.density.compact}>
                    <IconBaselineDensitySmall aria-hidden />
                  </ToggleButton>
                  <Tooltip>{a.density.compact}</Tooltip>
                </TooltipTrigger>
              </ToggleButtonGroup>
            </div>
          </DataTableToolbar>

          <DataTable
            aria-labelledby={`${uid}-title`}
            columns={columns}
            rows={pageRows}
            getRowId={(row) => row.id}
            selectionMode="multiple"
            selectedKeys={selected}
            onSelectionChange={onSelectionChange}
            sortDescriptor={sort}
            onSortChange={(next) => {
              setSort(next);
              setPage(1);
            }}
            isLoading={loading}
            loadingRowCount={PAGE_SIZE}
            loadingLabel={a.loading}
            density={density}
            stickyHeader={false}
            className={styles.table}
            emptyState={
              <EmptyState
                size="sm"
                level={subLevel(headingLevel + 1)}
                icon={<IconSearch />}
                title={a.empty.title}
                description={a.empty.description}
                action={
                  <Button
                    variant="outline"
                    size="sm"
                    onPress={() => {
                      setQuery('');
                      setStatus(ALL);
                      resetView();
                    }}
                  >
                    {a.empty.clear}
                  </Button>
                }
              />
            }
          />

          <DataTablePagination
            className={styles.pagination}
            label={p.label}
            previousLabel={p.previous}
            nextLabel={p.next}
            pageLabel={p.page}
            ofLabel={p.of}
            page={current}
            pageSize={PAGE_SIZE}
            totalCount={sorted.length}
            onPageChange={(next) => {
              setPage(next);
              setSelected(new Set());
            }}
            formatSummary={({ start, end, total }) =>
              total === 0
                ? p.none
                : p.summary
                    .replace('{start}', fmt.number(start))
                    .replace('{end}', fmt.number(end))
                    .replace('{total}', fmt.number(total))
            }
          />
        </Card>
      </Main>
      <ToastRegion />
    </div>
  );
}

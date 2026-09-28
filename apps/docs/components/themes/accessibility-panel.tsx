'use client';

import {
  IconArrowNarrowRight,
  IconCheck,
  IconCircleCheck,
  IconMoon,
  IconSun,
  IconSparkles,
  IconX,
} from '@syntara/icons';
import {
  Badge,
  DataTable,
  EmptyState,
  StatTile,
  StatTileGroup,
  useSortedRows,
  type DataTableColumn,
  type DataTableSortDescriptor,
} from '@syntara/react';
import type { Adjustment, AdjustmentKind, ContrastCheck, Scheme } from '@syntara/theme-engine';
import { useId, useMemo, useState } from 'react';
import { KIND_HELP, KIND_LABEL, SCHEME_LABEL, formatRatio, formatRequired, plural } from './format';
import { SCHEMES } from './state';
import { useThemes } from './themes-provider';
import styles from './panels.module.css';

const KIND_TONE: Record<AdjustmentKind, 'info' | 'neutral' | 'brand'> = {
  contrast: 'info',
  visibility: 'neutral',
  choice: 'neutral',
};

function Hex({ hex, label }: { hex: string; label: string }) {
  return (
    <span className={styles.hex}>
      <span className={styles.swatch} style={{ backgroundColor: hex }} aria-hidden="true" />
      <span className={styles.mono}>
        <span className="visually-hidden">{label} </span>
        {hex.toUpperCase()}
      </span>
    </span>
  );
}

function AdjustmentRow({ adjustment: a }: { adjustment: Adjustment }) {
  const hasRatios = a.ratioBefore !== undefined && a.ratioAfter !== undefined;
  return (
    <li className={styles.change}>
      <span className={styles.changeSwatches}>
        <Hex hex={a.fromHex} label="From" />
        <IconArrowNarrowRight className={styles.arrow} aria-hidden />
        <Hex hex={a.toHex} label="to" />
      </span>
      <span className={styles.changeBody}>
        <span className={styles.changeTitle}>
          <span className={styles.changeLabel}>{a.label}</span>
          <Badge size="sm" tone={KIND_TONE[a.kind]} variant={a.kind === 'choice' ? 'outline' : 'soft'} title={KIND_HELP[a.kind]}>
            {KIND_LABEL[a.kind]}
          </Badge>
          <code className={styles.role}>{a.role}</code>
        </span>
        <span className={styles.changeMessage}>{a.message}</span>
        {hasRatios && (
          <span className={styles.changeRatio}>
            {formatRatio(a.ratioBefore as number)}:1 <span aria-hidden="true">→</span>
            <span className="visually-hidden"> to </span> {formatRatio(a.ratioAfter as number)}:1
            {a.required !== undefined && <span className={styles.needs}> · needs {formatRequired(a.required)}:1</span>}
          </span>
        )}
      </span>
    </li>
  );
}

function Sample({ check }: { check: ContrastCheck }) {
  if (check.kind === 'text') {
    return (
      <span className={styles.sample} style={{ backgroundColor: check.bgHex, color: check.fgHex }} aria-hidden="true">
        Aa
      </span>
    );
  }
  return (
    <span className={styles.sample} style={{ backgroundColor: check.bgHex }} aria-hidden="true">
      <span className={styles.ring} style={{ borderColor: check.fgHex }} />
    </span>
  );
}

const CHECK_COLUMNS: DataTableColumn<ContrastCheck>[] = [
  { id: 'sample', header: <span className="visually-hidden">Sample</span>, textValue: 'Sample', width: 64, cell: (c) => <Sample check={c} /> },
  { id: 'fg', header: 'Foreground', isRowHeader: true, allowsSorting: true, cell: (c) => <code className={styles.role}>{c.fg}</code> },
  { id: 'bg', header: 'Background', allowsSorting: true, cell: (c) => <code className={styles.role}>{c.bg}</code> },
  { id: 'ratio', header: 'Ratio', align: 'end', allowsSorting: true, cell: (c) => <span className={styles.mono}>{formatRatio(c.ratio)}:1</span> },
  {
    id: 'needs',
    header: 'Needs',
    align: 'end',
    cell: (c) => (
      <span className={styles.needsCell}>
        <span className={styles.mono}>{formatRequired(c.required)}:1</span>
        <span className={styles.kind}>{c.kind === 'text' ? 'text' : 'non-text'}</span>
      </span>
    ),
  },
  {
    id: 'result',
    header: 'Result',
    allowsSorting: true,
    cell: (c) => (
      <Badge
        size="sm"
        tone={c.pass ? 'success' : 'danger'}
        icon={c.pass ? <IconCheck stroke={2.5} /> : <IconX stroke={2.5} />}
      >
        {c.pass ? 'Pass' : 'Fail'}
      </Badge>
    ),
  },
];

const CHECK_SORT = {
  fg: (c: ContrastCheck) => c.fg,
  bg: (c: ContrastCheck) => c.bg,
  ratio: (c: ContrastCheck) => c.ratio,
  result: (c: ContrastCheck) => (c.pass ? 1 : 0),
};

export function AccessibilityPanel() {
  const { theme, state } = useThemes();
  const { scheme } = state;
  const changesId = useId();
  const checksId = useId();
  const [sort, setSort] = useState<DataTableSortDescriptor | undefined>();

  const checks = useMemo(() => {
    const out: Record<Scheme, ContrastCheck[]> = { light: [], dark: [] };
    for (const c of theme.checks) out[c.scheme].push(c);
    return out;
  }, [theme.checks]);

  const adjustments = useMemo(() => {
    const out: Record<Scheme, Adjustment[]> = { light: [], dark: [] };
    for (const a of theme.adjustments) out[a.scheme].push(a);
    return out;
  }, [theme.adjustments]);

  const rows = useSortedRows(checks[scheme], sort, CHECK_SORT);

  const tile = (s: Scheme) => {
    const list = checks[s];
    const passed = list.filter((c) => c.pass).length;
    const failed = list.length - passed;
    return (
      <StatTile
        key={s}
        label={`${SCHEME_LABEL[s]} checks`}
        value={`${passed}/${list.length}`}
        caption={failed === 0 ? 'All pass WCAG 2.2 AA' : `${failed} failing`}
        icon={s === 'light' ? <IconSun /> : <IconMoon />}
      />
    );
  };

  return (
    <div className={styles.stack}>
      <StatTileGroup aria-label="Contrast summary">
        {SCHEMES.map(tile)}
        <StatTile
          label="Solver adjustments"
          value={String(theme.adjustments.length)}
          caption={`${adjustments.light.length} light · ${adjustments.dark.length} dark`}
          icon={<IconSparkles />}
        />
      </StatTileGroup>

      <section aria-labelledby={changesId} className={styles.section}>
        <div className={styles.sectionHead}>
          <h2 id={changesId} className={styles.h2}>
            What the solver changed
          </h2>
          <p className={styles.sub}>Where the preferred ramp step failed a check, what it moved to, and why.</p>
        </div>
        {theme.adjustments.length === 0 ? (
          <EmptyState
            size="sm"
            level={3}
            className={styles.empty}
            icon={<IconCircleCheck />}
            title="Nothing to fix"
            description="Every role landed on its preferred ramp step and passes WCAG 2.2 AA, in light and dark."
          />
        ) : (
          <div className={styles.changeGroups}>
            {SCHEMES.map((s) => (
              <div key={s} className={styles.changeGroup}>
                <h3 className={styles.h3}>
                  {s === 'light' ? <IconSun aria-hidden /> : <IconMoon aria-hidden />}
                  {SCHEME_LABEL[s]}
                  <span className={styles.count}>{plural(adjustments[s].length, 'change')}</span>
                </h3>
                {adjustments[s].length === 0 ? (
                  <p className={styles.none}>No changes needed — every role passes on its preferred step.</p>
                ) : (
                  <ul className={styles.changes}>
                    {adjustments[s].map((a) => (
                      <AdjustmentRow key={a.id} adjustment={a} />
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      <section aria-labelledby={checksId} className={styles.section}>
        <div className={styles.sectionHead}>
          <h2 id={checksId} className={styles.h2}>
            All checks <span className={styles.h2Meta}>· {SCHEME_LABEL[scheme]}</span>
          </h2>
          <p className={styles.sub}>
            WCAG 2.2 AA: text 4.5:1, non-text 3:1. Ratios are floored, never rounded up — 4.49 fails.
          </p>
        </div>
        <DataTable
          aria-labelledby={checksId}
          columns={CHECK_COLUMNS}
          rows={rows}
          getRowId={(c) => `${c.fg}|${c.bg}`}
          sortDescriptor={sort}
          onSortChange={setSort}
          density="compact"
          stickyHeader={false}
        />
      </section>
    </div>
  );
}

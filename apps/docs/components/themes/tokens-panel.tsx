'use client';

import { Badge, DataTable, Tooltip, TooltipTrigger, type DataTableColumn } from '@strata/react';
import { ROLES, roleToCssVar, type Adjustment, type RampName, type ResolvedColor, type Role } from '@strata/theme-engine';
import { useId, useMemo } from 'react';
import { Focusable } from 'react-aria-components';
import { SCHEME_LABEL } from './format';
import { useThemes } from './themes-provider';
import styles from './panels.module.css';

const RAMPS: RampName[] = ['primary', 'accent', 'neutral', 'success', 'warning', 'danger', 'info'];
const STEPS = Array.from({ length: 12 }, (_, i) => i + 1);

interface RoleRow {
  role: Role;
  color: ResolvedColor;
  adjustment?: Adjustment;
}

function Source({ row }: { row: RoleRow }) {
  const { color, adjustment } = row;
  if (!color.adjusted) {
    return color.ref ? <code className={styles.ref}>{color.ref}</code> : <span className={styles.subtle}>computed</span>;
  }
  return (
    <span className={styles.source}>
      <TooltipTrigger delay={300}>
        <Focusable>
          <Badge size="sm" tone="info" role="img" aria-label="Adjusted by the solver" className={styles.adjustedBadge}>
            adjusted
          </Badge>
        </Focusable>
        <Tooltip placement="top" className={styles.tooltip}>
          {adjustment?.message ?? 'Moved by the contrast solver.'}
        </Tooltip>
      </TooltipTrigger>
      {color.adjusted.fromRef && <span className={styles.was}>was {color.adjusted.fromRef}</span>}
      {adjustment && <span className="visually-hidden">: {adjustment.message}</span>}
    </span>
  );
}

const ROLE_COLUMNS: DataTableColumn<RoleRow>[] = [
  {
    id: 'swatch',
    header: <span className="visually-hidden">Swatch</span>,
    textValue: 'Swatch',
    width: 56,
    cell: (r) => <span className={styles.roleSwatch} style={{ backgroundColor: r.color.hex }} aria-hidden="true" />,
  },
  { id: 'var', header: 'CSS variable', isRowHeader: true, cell: (r) => <code className={styles.cssVar}>{roleToCssVar(r.role)}</code> },
  { id: 'hex', header: 'Value', cell: (r) => <span className={styles.mono}>{r.color.hex.toUpperCase()}</span> },
  { id: 'source', header: 'Source', cell: (r) => <Source row={r} /> },
];

export function TokensPanel() {
  const { theme, state } = useThemes();
  const { scheme } = state;
  const rampsId = useId();
  const rolesId = useId();
  const schemeTheme = theme.schemes[scheme];

  const exact: Partial<Record<RampName, string>> = { primary: theme.input.primary, accent: theme.input.accent };

  const rows = useMemo<RoleRow[]>(() => {
    const byId = new Map(theme.adjustments.map((a) => [a.id, a] as const));
    return (ROLES as readonly Role[]).map((role) => {
      const color = schemeTheme.roles[role];
      return { role, color, adjustment: color.adjusted ? byId.get(color.adjusted.adjustmentId) : undefined };
    });
  }, [theme.adjustments, schemeTheme]);

  const adjustedCount = rows.filter((r) => r.color.adjusted).length;

  return (
    <div className={styles.stack}>
      <section aria-labelledby={rampsId} className={styles.section}>
        <div className={styles.sectionHead}>
          <h2 id={rampsId} className={styles.h2}>
            Ramps <span className={styles.h2Meta}>· {SCHEME_LABEL[scheme]}</span>
          </h2>
          <p className={styles.sub}>
            Twelve steps per hue in OKLCH — hue held, lightness and chroma varied. Your colours stay exact at step 9.
          </p>
        </div>
        <div className={styles.ramps}>
          <div className={styles.rampRow} aria-hidden="true">
            <span />
            <span className={styles.stepHead}>
              {STEPS.map((s) => (
                <span key={s}>{s}</span>
              ))}
            </span>
          </div>
          {RAMPS.map((ramp) => {
            const labelId = `${rampsId}-${ramp}`;
            return (
              <div key={ramp} className={styles.rampRow}>
                <span id={labelId} className={styles.rampName}>
                  {ramp}
                </span>
                <ol className={styles.ramp} aria-labelledby={labelId}>
                  {schemeTheme.ramps[ramp].map((hex, i) => {
                    const step = i + 1;
                    const isInput = exact[ramp] === hex && step === 9;
                    const name = `${ramp} ${step}, ${hex.toUpperCase()}${isInput ? ', your input colour' : ''}`;
                    return (
                      <li key={step} className={styles.step} data-input={isInput || undefined} title={name}>
                        <span className={styles.chip} style={{ backgroundColor: hex }} aria-hidden="true" />
                        <span className="visually-hidden">{name}</span>
                      </li>
                    );
                  })}
                </ol>
              </div>
            );
          })}
          <p className={styles.legend}>
            <span className={styles.legendMark} aria-hidden="true" />
            Step 9 of primary and accent is the exact colour you entered.
          </p>
        </div>
      </section>

      <section aria-labelledby={rolesId} className={styles.section}>
        <div className={styles.sectionHead}>
          <h2 id={rolesId} className={styles.h2}>
            Semantic roles <span className={styles.h2Meta}>· {SCHEME_LABEL[scheme]}</span>
          </h2>
          <p className={styles.sub}>
            What components read. Each role points at a ramp step unless the solver had to move it:{' '}
            {adjustedCount === 0 ? 'none moved' : `${adjustedCount} moved`} in {SCHEME_LABEL[scheme].toLowerCase()}. Hover or focus
            an “adjusted” badge to see why.
          </p>
        </div>
        <DataTable
          aria-labelledby={rolesId}
          columns={ROLE_COLUMNS}
          rows={rows}
          getRowId={(r) => r.role}
          density="compact"
          stickyHeader={false}
        />
      </section>
    </div>
  );
}

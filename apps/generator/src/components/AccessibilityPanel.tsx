import { useId, useMemo } from 'react';
import { IconArrowNarrowRight, IconCheck, IconCircleCheck, IconCircleX, IconX } from '@tabler/icons-react';
import type { Adjustment, ContrastCheck, Scheme, Theme } from '@strata/theme-engine';
import { KIND_LABEL, SCHEME_LABEL, floorRatio, formatRequired } from './format';
import styles from './AccessibilityPanel.module.css';
import ui from './ui.module.css';

interface AccessibilityPanelProps {
  theme: Theme;
  scheme: Scheme;
}

const SCHEMES: Scheme[] = ['light', 'dark'];

export function AccessibilityPanel({ theme, scheme }: AccessibilityPanelProps) {
  const changesId = useId();
  const checksId = useId();

  const bySchemeChecks = useMemo(() => {
    const out: Record<Scheme, ContrastCheck[]> = { light: [], dark: [] };
    for (const check of theme.checks) out[check.scheme].push(check);
    return out;
  }, [theme.checks]);

  const bySchemeAdjustments = useMemo(() => {
    const out: Record<Scheme, Adjustment[]> = { light: [], dark: [] };
    for (const adj of theme.adjustments) out[adj.scheme].push(adj);
    return out;
  }, [theme.adjustments]);

  return (
    <div className={styles.stack}>
      <section aria-label="Summary">
        <ul className={styles.cards}>
          {SCHEMES.map((s) => {
            const checks = bySchemeChecks[s];
            const passed = checks.filter((c) => c.pass).length;
            const allPass = passed === checks.length;
            return (
              <li key={s} className={`${ui.card} ${styles.card}`}>
                <span className={styles.cardLabel}>{SCHEME_LABEL[s]}</span>
                <span className={styles.cardValue}>
                  {passed}/{checks.length}
                  <span className={styles.cardUnit}> checks pass</span>
                </span>
                <span className={`${ui.status} ${allPass ? ui.statusPass : ui.statusFail} ${styles.cardStatus}`}>
                  {allPass ? (
                    <IconCircleCheck size={16} stroke={2} aria-hidden="true" />
                  ) : (
                    <IconCircleX size={16} stroke={2} aria-hidden="true" />
                  )}
                  {allPass ? 'WCAG 2.2 AA' : `${checks.length - passed} failing`}
                </span>
              </li>
            );
          })}
          <li className={`${ui.card} ${styles.card}`}>
            <span className={styles.cardLabel}>Solver</span>
            <span className={styles.cardValue}>
              {theme.adjustments.length}
              <span className={styles.cardUnit}>
                {' '}
                automatic adjustment{theme.adjustments.length === 1 ? '' : 's'}
              </span>
            </span>
            <span className={`${ui.status} ${styles.cardStatusNeutral}`}>
              {bySchemeAdjustments.light.length} light · {bySchemeAdjustments.dark.length} dark
            </span>
          </li>
        </ul>
      </section>

      <section aria-labelledby={changesId}>
        <div className={ui.sectionHead}>
          <h2 id={changesId} className={ui.h2}>
            What the solver changed
          </h2>
          <p className={ui.sub}>Where the preferred ramp step failed a check, and what it moved to.</p>
        </div>
        {theme.adjustments.length === 0 ? (
          <div className={`${ui.card} ${styles.empty}`}>
            <IconCircleCheck size={20} stroke={1.75} aria-hidden="true" />
            <p>Nothing to fix — this brand passes as-is.</p>
          </div>
        ) : (
          <div className={styles.groups}>
            {SCHEMES.filter((s) => bySchemeAdjustments[s].length > 0).map((s) => (
              <div key={s} className={`${ui.card} ${styles.group}`}>
                <h3 className={styles.groupHead}>
                  {SCHEME_LABEL[s]}
                  <span className={styles.groupCount}>{bySchemeAdjustments[s].length}</span>
                </h3>
                <ul className={styles.adjList}>
                  {bySchemeAdjustments[s].map((adj) => (
                    <AdjustmentRow key={adj.id} adjustment={adj} />
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </section>

      <section aria-labelledby={checksId}>
        <div className={ui.sectionHead}>
          <h2 id={checksId} className={ui.h2}>
            All checks
            <span className={styles.h2Meta}> · {SCHEME_LABEL[scheme]}</span>
          </h2>
          <p className={ui.sub}>WCAG 2.2 AA · text 4.5:1, non-text 3:1 · ratios floored, never rounded up</p>
        </div>
        <ChecksTable checks={bySchemeChecks[scheme]} label={`Contrast checks table, ${SCHEME_LABEL[scheme].toLowerCase()} scheme`} />
      </section>
    </div>
  );
}

function SwatchWithHex({ hex, label }: { hex: string; label: string }) {
  return (
    <span className={styles.swHex}>
      <span className={ui.swatch} style={{ backgroundColor: hex }} aria-hidden="true" />
      <span className={`${ui.mono} ${styles.swHexText}`}>
        <span className={ui.srOnly}>{label} </span>
        {hex}
      </span>
    </span>
  );
}

function AdjustmentRow({ adjustment: a }: { adjustment: Adjustment }) {
  const hasRatios = a.ratioBefore !== undefined && a.ratioAfter !== undefined;
  return (
    <li className={styles.adj}>
      <span className={styles.swPair}>
        <SwatchWithHex hex={a.fromHex} label="From" />
        <IconArrowNarrowRight className={styles.arrow} size={16} stroke={1.75} aria-hidden="true" />
        <SwatchWithHex hex={a.toHex} label="to" />
      </span>
      <span className={styles.adjBody}>
        <span className={styles.adjTitle}>
          <span className={styles.adjLabel}>{a.label}</span>
          <span className={ui.chip}>{KIND_LABEL[a.kind]}</span>
          <code className={`${ui.mono} ${styles.adjRole}`}>{a.role}</code>
        </span>
        <span className={styles.adjMessage}>{a.message}</span>
        {hasRatios && (
          <span className={`${ui.mono} ${styles.adjRatio}`}>
            {floorRatio(a.ratioBefore as number)}:1 <span aria-hidden="true">→</span>
            <span className={ui.srOnly}>to</span> {floorRatio(a.ratioAfter as number)}:1
            {a.required !== undefined && <span className={styles.adjNeeds}> · needs {formatRequired(a.required)}:1</span>}
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

function ChecksTable({ checks, label }: { checks: ContrastCheck[]; label: string }) {
  const groups = useMemo(() => {
    const map = new Map<string, ContrastCheck[]>();
    for (const c of checks) {
      const list = map.get(c.fg);
      if (list) list.push(c);
      else map.set(c.fg, [c]);
    }
    return [...map.entries()];
  }, [checks]);

  return (
    <div className={`${ui.card} ${ui.scrollX} ${styles.tableWrap}`} role="region" aria-label={label} tabIndex={0}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th scope="col" className={styles.colSample}>
              Sample
            </th>
            <th scope="col">Foreground</th>
            <th scope="col">Background</th>
            <th scope="col" className={styles.num}>
              Ratio
            </th>
            <th scope="col" className={styles.num}>
              Needs
            </th>
            <th scope="col">Result</th>
          </tr>
        </thead>
        {groups.map(([fg, rows]) => (
          <tbody key={fg} className={styles.tgroup}>
            {rows.map((c, i) => (
              <tr key={`${c.fg}|${c.bg}`} className={c.pass ? undefined : styles.failRow}>
                <td className={styles.colSample}>
                  <Sample check={c} />
                </td>
                {i === 0 ? (
                  <th scope="rowgroup" rowSpan={rows.length} className={`${ui.mono} ${styles.fgCell}`}>
                    {fg}
                  </th>
                ) : null}
                <td className={`${ui.mono} ${styles.roleCell}`}>{c.bg}</td>
                <td className={`${ui.mono} ${styles.num}`}>{floorRatio(c.ratio)}</td>
                <td className={`${ui.mono} ${styles.num} ${styles.needs}`}>{formatRequired(c.required)}</td>
                <td>
                  <span className={`${ui.status} ${c.pass ? ui.statusPass : ui.statusFail}`}>
                    {c.pass ? (
                      <IconCheck size={14} stroke={2.5} aria-hidden="true" />
                    ) : (
                      <IconX size={14} stroke={2.5} aria-hidden="true" />
                    )}
                    {c.pass ? 'Pass' : 'Fail'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        ))}
      </table>
    </div>
  );
}

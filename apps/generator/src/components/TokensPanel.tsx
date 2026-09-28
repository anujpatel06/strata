import { useId, useMemo } from 'react';
import {
  ROLES,
  roleToCssVar,
  type Adjustment,
  type FigmaModes,
  type RampName,
  type Role,
  type Scheme,
  type Theme,
} from '@syntara/theme-engine';
import type { TenantId } from '../tenants';
import type { ExportFormat } from '../url-state';
import { ExportSection } from './ExportSection';
import { SCHEME_LABEL, labelOn } from './format';
import styles from './TokensPanel.module.css';
import ui from './ui.module.css';

const RAMPS: RampName[] = ['primary', 'accent', 'neutral', 'success', 'warning', 'danger', 'info'];
const BRAND_STEP = 9;

const ROLE_GROUPS: Array<{ label: string; prefix: string }> = [
  { label: 'Surface', prefix: 'surface.' },
  { label: 'Text', prefix: 'text.' },
  { label: 'Border', prefix: 'border.' },
  { label: 'Action', prefix: 'action.' },
  { label: 'Accent', prefix: 'accent.' },
  { label: 'Focus', prefix: 'focus.' },
  { label: 'Feedback', prefix: 'feedback.' },
];

interface TokensPanelProps {
  theme: Theme;
  scheme: Scheme;
  tenant: TenantId;
  format: ExportFormat;
  onFormatChange: (format: ExportFormat) => void;
  figmaModes: FigmaModes;
  onFigmaModesChange: (figmaModes: FigmaModes) => void;
  focusExport: boolean;
  onExportFocused: () => void;
}

export function TokensPanel({
  theme,
  scheme,
  tenant,
  format,
  onFormatChange,
  figmaModes,
  onFigmaModesChange,
  focusExport,
  onExportFocused,
}: TokensPanelProps) {
  const rampsId = useId();
  const rolesId = useId();
  const schemeTheme = theme.schemes[scheme];

  const adjustmentsById = useMemo(() => new Map(theme.adjustments.map((a) => [a.id, a] as const)), [theme.adjustments]);

  const roleGroups = useMemo(
    () =>
      ROLE_GROUPS.map((g) => ({ ...g, roles: (ROLES as readonly Role[]).filter((r) => r.startsWith(g.prefix)) })).filter(
        (g) => g.roles.length > 0,
      ),
    [],
  );

  return (
    <div className={styles.stack}>
      <section aria-labelledby={rampsId}>
        <div className={ui.sectionHead}>
          <h2 id={rampsId} className={ui.h2}>
            Ramps <span className={styles.h2Meta}>· {SCHEME_LABEL[scheme]}</span>
          </h2>
          <p className={ui.sub}>12 steps in OKLCH — hue held, lightness and chroma varied. Primary step 9 is your exact hex.</p>
        </div>
        <div className={`${ui.card} ${styles.ramps}`}>
          {RAMPS.map((ramp) => (
            <div key={ramp} className={styles.rampRow}>
              <span className={`${ui.mono} ${styles.rampName}`} id={`${rampsId}-${ramp}`}>
                {ramp}
              </span>
              <ol className={styles.ramp} aria-labelledby={`${rampsId}-${ramp}`}>
                {schemeTheme.ramps[ramp].map((hex, i) => {
                  const step = i + 1;
                  const isBrand = ramp === 'primary' && step === BRAND_STEP;
                  const name = `${ramp} ${step} ${hex}${isBrand ? ' (brand)' : ''}`;
                  return (
                    <li
                      key={step}
                      className={`${styles.step} ${isBrand ? styles.brandStep : ''}`}
                      style={{ backgroundColor: hex, color: labelOn(hex) }}
                      title={name}
                    >
                      <span aria-hidden="true" className={styles.stepNum}>
                        {step}
                      </span>
                      {isBrand && (
                        <span aria-hidden="true" className={styles.brandTag}>
                          brand
                        </span>
                      )}
                      <span className={ui.srOnly}>{name}</span>
                    </li>
                  );
                })}
              </ol>
            </div>
          ))}
        </div>
      </section>

      <section aria-labelledby={rolesId}>
        <div className={ui.sectionHead}>
          <h2 id={rolesId} className={ui.h2}>
            Semantic roles <span className={styles.h2Meta}>· {SCHEME_LABEL[scheme]}</span>
          </h2>
          <p className={ui.sub}>What components consume. Each role points at a ramp step unless the solver had to move it.</p>
        </div>
        <div
          className={`${ui.card} ${ui.scrollX}`}
          role="region"
          aria-label={`Semantic roles table, ${SCHEME_LABEL[scheme].toLowerCase()} scheme`}
          tabIndex={0}
        >
          <table className={styles.table}>
            <thead>
              <tr>
                <th scope="col" className={styles.colSwatch}>
                  <span className={ui.srOnly}>Swatch</span>
                </th>
                <th scope="col">CSS variable</th>
                <th scope="col">Value</th>
                <th scope="col">Source</th>
              </tr>
            </thead>
            {roleGroups.map((group) => (
              <tbody key={group.label} className={styles.tgroup}>
                <tr>
                  <th scope="rowgroup" colSpan={4} className={styles.groupRow}>
                    {group.label}
                  </th>
                </tr>
                {group.roles.map((role) => {
                  const c = schemeTheme.roles[role];
                  const adj = c.adjusted ? adjustmentsById.get(c.adjusted.adjustmentId) : undefined;
                  return (
                    <tr key={role}>
                      <td className={styles.colSwatch}>
                        <span className={`${ui.swatch} ${styles.roleSwatch}`} style={{ backgroundColor: c.hex }} />
                      </td>
                      <td className={ui.mono}>
                        <code className={styles.cssVar}>{roleToCssVar(role)}</code>
                      </td>
                      <td className={`${ui.mono} ${styles.hex}`}>{c.hex}</td>
                      <td>
                        <Source stepRef={c.ref} adjustment={adj} fromRef={c.adjusted?.fromRef} adjusted={!!c.adjusted} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            ))}
          </table>
        </div>
      </section>

      <ExportSection
        theme={theme}
        tenant={tenant}
        format={format}
        onFormatChange={onFormatChange}
        figmaModes={figmaModes}
        onFigmaModesChange={onFigmaModesChange}
        focusExport={focusExport}
        onExportFocused={onExportFocused}
      />
    </div>
  );
}

function Source({
  stepRef,
  adjusted,
  adjustment,
  fromRef,
}: {
  stepRef: string | undefined;
  adjusted: boolean;
  adjustment: Adjustment | undefined;
  fromRef: string | undefined;
}) {
  return (
    <span className={styles.source}>
      {stepRef ? <span className={`${ui.mono} ${styles.ref}`}>{stepRef}</span> : !adjusted && <span className={styles.computed}>computed</span>}
      {adjusted && (
        <>
          <span className={ui.chip} title={adjustment?.message}>
            adjusted
          </span>
          {fromRef && <span className={`${ui.mono} ${styles.was}`}>was {fromRef}</span>}
          {adjustment && <span className={ui.srOnly}>: {adjustment.message}</span>}
        </>
      )}
    </span>
  );
}

/**
 * The safe-pairs matrices on /docs/color, generated from packages/theme-engine/src/contrast-pairs.json. Each ratio is
 * the lowest measured over every tenant (house included) in light and dark, floored to 2 decimals.
 * Wide screens get a matrix (rows: foreground role, columns: surface); narrow ones get the same data as grouped lists.
 */
import { IconCheck } from '@strata/icons';
import { roleToCssVar, type Role } from '@strata/theme-engine';
import { Callout } from '@/components/mdx/callout';
import { floor2, getColorUsageData, type Kind, type Matrix } from './data';
import { LiveScope } from './live';
import styles from './color-usage.module.css';

const short = (role: Role) => role.replace(/^surface\./, '');

/** A role name that may wrap only after its dots ("feedback.success.<wbr>onSolid"), never mid-word. */
function RoleName({ role }: { role: string }) {
  const parts = role.split('.');
  return (
    <>
      {parts.map((p, i) => (
        <span key={i}>
          {p}
          {i < parts.length - 1 && (
            <>
              .<wbr />
            </>
          )}
        </span>
      ))}
    </>
  );
}

function Pass({ worst, worstAt }: { worst: number; worstAt?: string }) {
  return (
    <span className={styles.pass} title={worstAt ? `Lowest in ${worstAt}` : undefined}>
      <IconCheck aria-hidden className={styles.passIcon} />
      <span className={styles.srOnly}>Guaranteed, lowest </span>
      {floor2(worst)}
      <span className={styles.srOnly}>:1{worstAt ? `, ${worstAt}` : ''}</span>
    </span>
  );
}

function None() {
  return (
    <span className={styles.none}>
      <span aria-hidden="true">—</span>
      <span className={styles.srOnly}>Not guaranteed</span>
    </span>
  );
}

const CAPTION: Record<Kind, string> = {
  text: 'Text on surfaces',
  'non-text': 'Focus rings and input borders on surfaces',
};

/** One kind of pair (text 4.5:1 or non-text 3:1) on the surface roles. */
export function PairMatrix({ kind }: { kind: Kind }) {
  const data = getColorUsageData();
  const m: Matrix = kind === 'text' ? data.text : data.nonText;
  const label = `${CAPTION[kind]}, ${m.required}:1`;
  return (
    <figure className={styles.matrix}>
      <figcaption className={styles.matrixCaption}>
        <span className={styles.matrixTitle}>{CAPTION[kind]}</span>
        <span className={styles.matrixReq}>
          needs {m.required}:1 {kind === 'text' ? '(WCAG 1.4.3)' : '(WCAG 1.4.11)'}
        </span>
      </figcaption>

      {/* Wide: the matrix. */}
      <div className={styles.matrixWide}>
        <div className={styles.matrixScroll} role="region" aria-label={label} tabIndex={0}>
          <table className={styles.matrixTable}>
            <thead>
              <tr>
                <th scope="col" className={styles.corner}>
                  <span className={styles.srOnly}>Foreground role</span>
                  <span aria-hidden="true">on surface.</span>
                </th>
                {m.columns.map((c) => (
                  <th key={c} scope="col">
                    <span className={styles.srOnly}>surface.</span>
                    {short(c)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {m.rows.map((row) => (
                <tr key={row.fg}>
                  <th scope="row">
                    <code className={styles.code}>{row.fg}</code>
                  </th>
                  {row.cells.map((cell) => (
                    <td key={cell.bg} data-pass={cell.worst != null || undefined}>
                      {cell.worst != null ? <Pass worst={cell.worst} worstAt={cell.worstAt} /> : <None />}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Narrow: one group per foreground role. */}
      <ul className={styles.matrixNarrow} aria-label={label}>
        {m.rows.map((row) => {
          const yes = row.cells.filter((c) => c.worst != null);
          const no = row.cells.filter((c) => c.worst == null);
          return (
            <li key={row.fg} className={styles.narrowGroup}>
              <code className={styles.code}>{row.fg}</code>
              <ul className={styles.narrowList}>
                {yes.map((c) => (
                  <li key={c.bg}>
                    <span>{c.bg}</span>
                    <Pass worst={c.worst!} worstAt={c.worstAt} />
                  </li>
                ))}
              </ul>
              {no.length > 0 && (
                <p className={styles.narrowNo}>Not guaranteed on {no.map((c) => short(c.bg)).join(', ')}.</p>
              )}
            </li>
          );
        })}
      </ul>
    </figure>
  );
}

/**
 * Labels on fills: each label role is checked only on the fills listed with it. Each tile paints the fill with its
 * label in the picked tenant (a checked pair, so it's real text), with the lowest ratio over every theme beneath.
 */
export function FillPairs() {
  const data = getColorUsageData();
  const tiles = data.fills.flatMap((row) => row.fills.map((f) => ({ fg: row.fg, ...f })));
  return (
    <figure className={styles.matrix}>
      <figcaption className={styles.matrixCaption}>
        <span className={styles.matrixTitle}>Labels on fills</span>
        <span className={styles.matrixReq}>needs {data.requirements.text}:1 (WCAG 1.4.3)</span>
      </figcaption>
      <ul className={styles.tiles} aria-label={`Labels on fills, ${data.requirements.text}:1`}>
        {tiles.map((t) => (
          <li key={`${t.fg}|${t.bg}`} className={styles.tile}>
            <LiveScope tenants={data.tenants} surface="none" direction="page" className={styles.tileSwatch}>
              <span
                className={styles.tileFill}
                style={{ background: `var(${roleToCssVar(t.bg)})`, color: `var(${roleToCssVar(t.fg)})` }}
              >
                Aa
              </span>
            </LiveScope>
            <span className={styles.tileText}>
              <code className={styles.tileBg}>
                <RoleName role={t.bg} />
              </code>
              <span className={styles.tileFg}>
                <span className={styles.srOnly}>with </span>
                <RoleName role={t.fg} />
              </span>
              <Pass worst={t.worst} worstAt={t.worstAt} />
            </span>
          </li>
        ))}
      </ul>
    </figure>
  );
}

/** Plain-words legend, with the theme count read from the data. */
export function PairLegend() {
  const { themeCount, tenants } = getColorUsageData();
  return (
    <dl className={styles.legend}>
      <div>
        <dt>
          <span className={styles.pass}>
            <IconCheck aria-hidden className={styles.passIcon} />
            ratio
          </span>
        </dt>
        <dd>
          Guaranteed for every brand the engine generates. The number is the lowest ratio measured on this site: {tenants.length}{' '}
          brands in light and dark, {themeCount} themes. Hover it to see where.
        </dd>
      </div>
      <div>
        <dt>
          <None />
        </dt>
        <dd>Not guaranteed. Don’t use it, even if it looks fine in your brand today.</dd>
      </div>
    </dl>
  );
}

/** Unlisted pairs that pass in some themes and fail in others: why "looks fine" isn't enough. */
export function UnlistedNote() {
  const d = getColorUsageData();
  return (
    <Callout tone="warning" title="Looks fine isn’t the same as checked">
      <div className={styles.calloutBody}>
      <p>
        Of the {d.unlistedCount} unlisted pairs in these tables, {d.luckyCount} pass in all {d.themeCount} themes on this site
        today. They still aren’t checked, so a new brand can break them.
      </p>
      {d.nearMisses.map((n) => (
        <p key={`${n.fg}|${n.bg}`}>
          <code className={styles.code}>{n.fg}</code> on <code className={styles.code}>{n.bg}</code> already fails: it passes in{' '}
          {n.passes} of {n.of} themes and drops to {floor2(n.worst)}:1 in {n.worstAt} (needs {n.required}:1).
        </p>
      ))}
      </div>
    </Callout>
  );
}

/* ---- Inline numbers for the prose, each read from its source ---- */

export function GlassOpacity() {
  const { glass } = getColorUsageData();
  return <>{glass.min === glass.max ? `${glass.min}%` : `${glass.min}–${glass.max}%`}</>;
}

export function FeatureGlow() {
  const g = getColorUsageData().featureGlow;
  if (!g) return <>a capped mix of the brand</>;
  return (
    <>
      {g.light}% of the brand in light and {g.dark}% in dark, fading to plain surface.raised by {g.stop}% of its radius
    </>
  );
}

export function ChartWorst() {
  const { chartWorst } = getColorUsageData();
  return (
    <>
      {floor2(chartWorst.ratio)}:1 ({chartWorst.at})
    </>
  );
}

export function FieldDarkMix() {
  const mix = getColorUsageData().fieldDarkMix;
  return <>{mix != null ? `${mix}%` : 'most of'}</>;
}

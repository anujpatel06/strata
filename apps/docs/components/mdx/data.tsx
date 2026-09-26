/**
 * Server components that render docs content straight from the source of truth — the engine, the fuzz
 * report, contrast-pairs.json, ADR files, tenant brand files — so the numbers on the page can't drift.
 */
import {
  FOUNDATIONS,
  ROLES,
  TYPE_PAIRS,
  contrastRatio,
  generateTheme,
  roleToCssVar,
  type Role,
} from '@strata/theme-engine';
import { Badge, Button, ThemeScope } from '@strata/react';
import { listRepoDir, readRepoFile } from '@/lib/repo';
import { githubBlob } from '@/lib/site';
import { getHouseBrand, getTenants } from '@/lib/tenants';
import type React from 'react';
import { CodeBlock } from './code-block';
import { Table } from './prose';
import styles from './data.module.css';

const Code = ({ children }: { children: string }) => <code className={styles.code}>{children}</code>;

function Swatch({ hex }: { hex: string }) {
  return (
    <span className={styles.swatch}>
      {/* Engine output rendered as data, not styling. */}
      <span className={styles.chip} style={{ background: hex }} aria-hidden="true" />
      <span className={styles.hex}>{hex}</span>
    </span>
  );
}

/* ------------------------------------------------------------------ */

const ROLE_GROUP_LABEL: Record<string, string> = {
  surface: 'Surface',
  text: 'Text',
  border: 'Border',
  action: 'Action',
  accent: 'Accent',
  focus: 'Focus',
  feedback: 'Feedback',
};

/**
 * Every semantic colour role (ROLES), its CSS variable, and each tenant's value. Both schemes are rendered;
 * CSS shows the one matching the page's current scheme.
 */
export function RolesTable() {
  const tenants = getTenants().map((t) => ({ ...t, theme: generateTheme(t.brand) }));
  const groups = new Map<string, Role[]>();
  for (const role of ROLES) {
    const key = role.split('.')[0]!;
    groups.set(key, [...(groups.get(key) ?? []), role]);
  }
  return (
    <Table aria-label="Semantic colour roles per tenant">
      <thead>
        <tr>
          <th scope="col">Role and CSS variable</th>
          {tenants.map((t) => (
            <th key={t.id} scope="col">
              {t.name}
            </th>
          ))}
        </tr>
      </thead>
      {[...groups].map(([group, roles]) => (
        <tbody key={group}>
          <tr>
            <th scope="colgroup" colSpan={tenants.length + 1} className={styles.groupRow}>
              {ROLE_GROUP_LABEL[group] ?? group}
            </th>
          </tr>
          {roles.map((role) => (
            <tr key={role}>
              <td>
                <span className={styles.roleCell}>
                  <Code>{`color.${role}`}</Code>
                  <span className={styles.cssVar}>{roleToCssVar(role)}</span>
                </span>
              </td>
              {tenants.map((t) => (
                <td key={t.id} className={styles.swatchCell}>
                  <span className={styles.onLight}>
                    <Swatch hex={t.theme.schemes.light.roles[role].hex} />
                  </span>
                  <span className={styles.onDark}>
                    <Swatch hex={t.theme.schemes.dark.roles[role].hex} />
                  </span>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      ))}
    </Table>
  );
}

/* ------------------------------------------------------------------ */

const DENSITY_ROWS = [
  ['controlHeight', '--strata-control-height', 'Buttons, fields, selects, toggles'],
  ['controlPaddingInline', '--strata-control-padding-inline', 'Horizontal padding inside controls'],
  ['tableRowHeight', '--strata-table-row-height', 'DataTable rows'],
  ['cardInset', '--strata-card-inset', 'Card and dialog padding'],
  ['sectionGap', '--strata-section-gap', 'Space between page sections'],
  ['fieldGap', '--strata-field-gap', 'Space between form fields'],
] as const;

export function DensityTable() {
  const { comfortable, compact } = FOUNDATIONS.density;
  return (
    <Table aria-label="Density tokens">
      <thead>
        <tr>
          <th scope="col">CSS variable</th>
          <th scope="col">Used for</th>
          <th scope="col" data-num="">
            Comfortable
          </th>
          <th scope="col" data-num="">
            Compact
          </th>
        </tr>
      </thead>
      <tbody>
        {DENSITY_ROWS.map(([key, cssVar, use]) => (
          <tr key={key}>
            <td>
              <Code>{cssVar}</Code>
            </td>
            <td>{use}</td>
            <td data-num="">{comfortable[key]}px</td>
            <td data-num="">{compact[key]}px</td>
          </tr>
        ))}
      </tbody>
    </Table>
  );
}

/* ------------------------------------------------------------------ */

interface FuzzReport {
  command: string;
  seed: number;
  themes: number;
  checksPerTheme: number;
  totalChecks: number;
  passed: number;
  failed: number;
  passRatePercent: number;
  generationMs: { median: number; p95: number };
  environment: { cpu: string; node: string; platform: string };
  adjustmentsPerTheme: { min: number; median: number; max: number };
  minMargin: Record<string, { required: number; minRatio: number; fg: string; bg: string; scheme: string; fgHex: string; bgHex: string }>;
}

function readFuzz(): FuzzReport | undefined {
  const raw = readRepoFile('packages', 'theme-engine', 'reports', 'fuzz-report.json');
  return raw ? (JSON.parse(raw) as FuzzReport) : undefined;
}

const int = new Intl.NumberFormat('en-US');
/** Floors to 2 decimals — ratios are never rounded up. */
const floor2 = (n: number) => (Math.floor(n * 100) / 100).toFixed(2);

/** The theme fuzz results, read from packages/theme-engine/reports/fuzz-report.json at build time. */
export function FuzzResults() {
  const r = readFuzz();
  if (!r) return <p className={styles.note}>Run `pnpm test:themes` to generate the fuzz report.</p>;
  const rows: Array<[string, string]> = [
    ['Random brands (seed ' + r.seed + '), each in light and dark', int.format(r.themes)],
    ['Contrast checks (' + r.checksPerTheme + ' per brand)', int.format(r.totalChecks)],
    ['Passed', int.format(r.passed)],
    ['Failed', int.format(r.failed)],
    ['Pass rate', `${r.passRatePercent}%`],
    ['Solver adjustments per brand (min / median / max)', `${r.adjustmentsPerTheme.min} / ${r.adjustmentsPerTheme.median} / ${r.adjustmentsPerTheme.max}`],
    ['Median generation time', `${r.generationMs.median.toFixed(2)} ms`],
    ['p95 generation time', `${r.generationMs.p95.toFixed(2)} ms`],
  ];
  return (
    <figure className={styles.figure}>
      <Table aria-label="Theme fuzz results">
        <thead>
          <tr>
            <th scope="col">Metric</th>
            <th scope="col" data-num="">
              Value
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map(([k, v]) => (
            <tr key={k}>
              <td>{k}</td>
              <td data-num="">{v}</td>
            </tr>
          ))}
        </tbody>
      </Table>
      <figcaption className={styles.caption}>
        Reproduce with <Code>{r.command}</Code>. Timing measured on {r.environment.cpu}, Node {r.environment.node}; it varies by
        machine. Source:{' '}
        <a href={githubBlob('packages/theme-engine/reports/fuzz-report.md')} className={styles.link}>
          fuzz-report.md
        </a>
        .
      </figcaption>
    </figure>
  );
}

/** The tightest contrast margins the solver shipped across the fuzz run. */
export function FuzzMargins() {
  const r = readFuzz();
  if (!r) return null;
  return (
    <Table aria-label="Tightest contrast margins">
      <thead>
        <tr>
          <th scope="col">Required</th>
          <th scope="col">Lowest shipped</th>
          <th scope="col">Pair</th>
        </tr>
      </thead>
      <tbody>
        {Object.values(r.minMargin).map((m) => (
          <tr key={m.required}>
            <td>{m.required}:1</td>
            <td>{m.minRatio.toFixed(4)}:1</td>
            <td>
              {m.scheme} <Code>{m.fg}</Code> {m.fgHex} on <Code>{m.bg}</Code> {m.bgHex}
            </td>
          </tr>
        ))}
      </tbody>
    </Table>
  );
}

/* ------------------------------------------------------------------ */

interface ContrastPairsFile {
  requirements: Record<'text' | 'non-text', number>;
  pairs: Array<{ fg: string; kind: 'text' | 'non-text'; against: string[] }>;
}

/** Every pair the engine guarantees (packages/theme-engine/src/contrast-pairs.json). */
export function ContrastPairs() {
  const raw = readRepoFile('packages', 'theme-engine', 'src', 'contrast-pairs.json');
  if (!raw) return null;
  const file = JSON.parse(raw) as ContrastPairsFile;
  return (
    <Table aria-label="Guaranteed contrast pairs">
      <thead>
        <tr>
          <th scope="col">Foreground</th>
          <th scope="col">Checked against</th>
          <th scope="col" data-num="">
            Minimum
          </th>
        </tr>
      </thead>
      <tbody>
        {file.pairs.map((p) => (
          <tr key={p.fg}>
            <td>
              <Code>{p.fg}</Code>
            </td>
            <td>
              <span className={styles.chips}>
                {p.against.map((a) => (
                  <Code key={a}>{a}</Code>
                ))}
              </span>
            </td>
            <td data-num="">
              {file.requirements[p.kind]}:1 {p.kind === 'non-text' ? '(non-text)' : ''}
            </td>
          </tr>
        ))}
      </tbody>
    </Table>
  );
}

/* ------------------------------------------------------------------ */

/** The solver's own explanations for the house brand, generated at build time. */
export function HouseAdjustments() {
  const theme = generateTheme(getHouseBrand());
  return (
    <ul className={styles.adjustments}>
      {theme.adjustments.map((a) => (
        <li key={a.id}>
          <Badge tone="neutral" variant="outline" size="sm">
            {a.scheme} · {a.kind}
          </Badge>
          <span>{a.message}</span>
        </li>
      ))}
    </ul>
  );
}

/* ------------------------------------------------------------------ */

interface Adr {
  number: string;
  title: string;
  status: string;
  decidedBy: string;
  file: string;
}

function readAdrs(): Adr[] {
  const out: Adr[] = [];
  for (const file of listRepoDir('docs', 'adr')) {
    const m = /^(\d{3})-.+\.md$/.exec(file);
    if (!m || m[1] === '000') continue;
    const text = readRepoFile('docs', 'adr', file) ?? '';
    const heading = /^#\s+ADR-\d+:\s*(.+)$/m.exec(text)?.[1]?.trim() ?? file;
    const statusLine = /\*\*Status:\*\*\s*(.+)$/m.exec(text)?.[1]?.trim() ?? '';
    const [status = '', ...rest] = statusLine.split(/\s+—\s+/);
    out.push({ number: m[1]!, title: heading, status: status.trim(), decidedBy: rest.join(' — ').trim(), file });
  }
  return out;
}

/** Architecture decision records, read from docs/adr at build time. */
export function AdrList() {
  const adrs = readAdrs();
  return (
    <Table aria-label="Architecture decision records">
      <thead>
        <tr>
          <th scope="col">ADR</th>
          <th scope="col">Decision</th>
          <th scope="col">Status</th>
        </tr>
      </thead>
      <tbody>
        {adrs.map((a) => (
          <tr key={a.number}>
            <td className={styles.nowrap}>
              <a href={githubBlob(`docs/adr/${a.file}`)} className={styles.link}>
                ADR-{a.number}
              </a>
            </td>
            <td>{a.title}</td>
            <td>
              <span className={styles.status}>
                <Badge tone={a.status.startsWith('Accepted') ? 'success' : 'neutral'} variant="soft" size="sm">
                  {a.status.replace(/\s*\(.*\)$/, '') || 'Draft'}
                </Badge>
                {a.decidedBy && <span className={styles.decidedBy}>{a.decidedBy}</span>}
              </span>
            </td>
          </tr>
        ))}
      </tbody>
    </Table>
  );
}

/* ------------------------------------------------------------------ */

/** One ThemeScope per tenant rendering the same components — the whole idea in one row. */
export function TenantGrid() {
  const tenants = getTenants();
  return (
    <div className={styles.tenants}>
      {tenants.map((t) => {
        const theme = generateTheme(t.brand);
        return (
          <ThemeScope key={t.id} theme={t.id} scheme="light" locale={t.locale} className={styles.tenant}>
            <div className={styles.tenantHead}>
              <span className={styles.tenantMark} aria-hidden="true" />
              <div>
                <p className={styles.tenantName}>{t.product.name}</p>
                <p className={styles.tenantIndustry}>{t.product.industry}</p>
              </div>
            </div>
            <div className={styles.tenantActions}>
              <Button variant="primary" size="sm">
                {t.dir === 'rtl' ? 'متابعة' : 'Continue'}
              </Button>
              <Button variant="outline" size="sm">
                {t.dir === 'rtl' ? 'إلغاء' : 'Cancel'}
              </Button>
            </div>
            <dl className={styles.tenantFacts} dir="ltr" lang="en">
              <div>
                <dt>Primary</dt>
                <dd>
                  <Swatch hex={theme.input.primary} />
                </dd>
              </div>
              <div>
                <dt>Type</dt>
                <dd>{TYPE_PAIRS[t.brand.typePair].label.split(' — ')[1]}</dd>
              </div>
              <div>
                <dt>Shape · density</dt>
                <dd>
                  {t.brand.shape} · {t.brand.density}
                </dd>
              </div>
            </dl>
          </ThemeScope>
        );
      })}
    </div>
  );
}

/** A tenant's brand.json — the whole brand, as data. */
export async function TenantBrandJson({ id }: { id: string }) {
  const raw = readRepoFile('tenants', id, 'brand.json');
  if (!raw) return null;
  return <CodeBlock code={raw} lang="json" title={`tenants/${id}/brand.json`} />;
}

/* ------------------------------------------------------------------ */

interface RegistryIndex {
  items: Array<{ name: string; type: string; title?: string; description?: string }>;
}

/** The non-component items in the built registry (apps/docs/public/r/registry.json), plus a component count. */
export function RegistryItems() {
  const raw = readRepoFile('apps', 'docs', 'public', 'r', 'registry.json');
  if (!raw) return <p className={styles.note}>Run `pnpm registry` to build the registry.</p>;
  const index = JSON.parse(raw) as RegistryIndex;
  const ui = index.items.filter((i) => i.type === 'registry:ui');
  const rest = index.items.filter((i) => i.type !== 'registry:ui');
  return (
    <figure className={styles.figure}>
      <Table aria-label="Registry items">
        <thead>
          <tr>
            <th scope="col">Item</th>
            <th scope="col">Type</th>
            <th scope="col">What it installs</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className={styles.nowrap}>
              <Code>{'<component>'}</Code>
            </td>
            <td className={styles.nowrap}>
              <Code>registry:ui</Code>
            </td>
            <td>
              One per component ({ui.length} in this build): its <Code>.tsx</Code> and <Code>.module.css</Code>, npm
              dependencies and the Strata components it uses.
            </td>
          </tr>
          {rest.map((i) => (
            <tr key={i.name}>
              <td className={styles.nowrap}>
                <a href={`/r/${i.name}.json`} className={styles.link}>
                  {i.name}
                </a>
              </td>
              <td className={styles.nowrap}>
                <Code>{i.type}</Code>
              </td>
              <td>{i.description}</td>
            </tr>
          ))}
        </tbody>
      </Table>
      <figcaption className={styles.caption}>
        Read from <a href="/r/registry.json" className={styles.link}>/r/registry.json</a> when this page was built.
      </figcaption>
    </figure>
  );
}

/** How shadcn/ui variables map onto Strata roles in the theme bridge (theme-engine src/export/shadcn.ts). */
export async function ShadcnMap() {
  const { SHADCN_ROLE_MAP } = await import('../../../../packages/theme-engine/src/export/shadcn');
  const rows = new Map<string, string[]>();
  for (const [variable, role] of SHADCN_ROLE_MAP) rows.set(role, [...(rows.get(role) ?? []), variable]);
  return (
    <Table aria-label="shadcn variable to Strata role">
      <thead>
        <tr>
          <th scope="col">Strata role</th>
          <th scope="col">shadcn/ui variables</th>
        </tr>
      </thead>
      <tbody>
        {[...rows].map(([role, vars]) => (
          <tr key={role}>
            <td className={styles.nowrap}>
              <Code>{`color.${role}`}</Code>
            </td>
            <td>
              <span className={styles.chips}>
                {vars.map((v) => (
                  <Code key={v}>{`--${v}`}</Code>
                ))}
              </span>
            </td>
          </tr>
        ))}
      </tbody>
    </Table>
  );
}

/* ------------------------------------------------------------------ */

/** Link to an ADR by number, resolved against docs/adr at build time (so renamed files don't break links). */
export function AdrLink({ n, children }: { n: string; children?: React.ReactNode }) {
  const file = listRepoDir('docs', 'adr').find((f) => f.startsWith(`${n}-`));
  const href = file ? githubBlob(`docs/adr/${file}`) : githubBlob('docs/adr');
  return (
    <a href={href} className={styles.link}>
      {children ?? `ADR-${n}`}
    </a>
  );
}

/**
 * Pairs the shadcn bridge does NOT guarantee: brand fills used as text or as chart marks on the page
 * background. Ratios computed from each theme's final hex values at build time, floored (never rounded up).
 */
export function ShadcnGaps() {
  const brands = [...getTenants().map((t) => ({ name: t.name, brand: t.brand })), { name: 'House', brand: getHouseBrand() }];
  const cols = [
    { label: '--destructive', role: 'feedback.danger.solid' as Role, need: 4.5 },
    { label: '--primary', role: 'action.primary.bg' as Role, need: 4.5 },
    { label: '--chart-5', role: 'feedback.warning.solid' as Role, need: 3 },
  ];
  return (
    <figure className={styles.figure}>
      <Table aria-label="Unguaranteed shadcn pairs">
        <thead>
          <tr>
            <th scope="col">Theme</th>
            {cols.map((c) => (
              <th key={c.label} scope="col" data-num="">
                <Code>{c.label}</Code>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {brands.flatMap(({ name, brand }) => {
            const theme = generateTheme(brand);
            return (['light', 'dark'] as const).map((scheme) => {
              const roles = theme.schemes[scheme].roles;
              return (
                <tr key={`${name}-${scheme}`}>
                  <td className={styles.nowrap}>
                    {name} · {scheme}
                  </td>
                  {cols.map((c) => {
                    const r = contrastRatio(roles[c.role].hex, roles['surface.canvas'].hex);
                    return (
                      <td key={c.label} data-num="" className={r < c.need ? styles.below : undefined}>
                        {floor2(r)}:1
                        {r < c.need && <span className="visually-hidden"> (below {c.need}:1)</span>}
                      </td>
                    );
                  })}
                </tr>
              );
            });
          })}
        </tbody>
      </Table>
      <figcaption className={styles.caption}>
        Each colour against <Code>--background</Code>. WCAG 2.x ratios from each theme’s final hex values, computed
        when this page was built and floored, never rounded up. Text needs 4.5:1; chart marks need 3:1 (non-text
        contrast). Values below the minimum are in bold red.
      </figcaption>
    </figure>
  );
}

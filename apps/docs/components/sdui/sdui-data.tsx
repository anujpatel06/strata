/**
 * Server components for /docs/server-driven-ui that read their numbers from the source when the page is built:
 * packages/sdui/schema/manifest.json (the slice), packages/react/meta (what's left out), and the theme engine's
 * native exporters (the contrast re-check). Nothing here is typed in by hand.
 */
import type { Manifest, ManifestNode } from '@strata/sdui';
import { buildNativeModel, generateTheme, toCompose, toSwiftUI, verifyNativeExport, type BrandInput } from '@strata/theme-engine';
import { MaturityBadge } from '@/components/docs/maturity-badge';
import { A, InlineCode, Li, P, Table, Ul } from '@/components/mdx/prose';
import { getAllMeta } from '@/lib/meta';
import { CATEGORY_LABEL, CATEGORY_ORDER } from '@/lib/meta-types';
import { readRepoFile } from '@/lib/repo';
import { getHouseBrand, getTenants } from '@/lib/tenants';
import styles from './sdui-data.module.css';

/** Manifest text marks code with backticks (`id`): draw those parts as code, the rest as text. */
function Rich({ text }: { text: string }) {
  return (
    <>
      {text.split(/(`[^`]+`)/).map((part, i) =>
        part.startsWith('`') && part.endsWith('`') && part.length > 2 ? <InlineCode key={i}>{part.slice(1, -1)}</InlineCode> : part,
      )}
    </>
  );
}

function readManifest(): Manifest {
  const raw = readRepoFile('packages', 'sdui', 'schema', 'manifest.json');
  if (!raw) throw new Error('packages/sdui/schema/manifest.json is missing: run pnpm --filter @strata/sdui generate');
  return JSON.parse(raw) as Manifest;
}

const plural = (n: number, one: string, many = `${one}s`) => `${n.toLocaleString('en-US')} ${n === 1 ? one : many}`;
const list = (items: string[]) =>
  items.length <= 1 ? (items[0] ?? '') : `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;

function counts(m: Manifest) {
  const nodes = Object.entries(m.nodes);
  const fromMeta = nodes.filter(([, n]) => n.source === 'meta');
  const components = new Set(fromMeta.map(([, n]) => n.component).filter((c): c is string => c != null));
  const byMaturity = new Map<string, number>();
  for (const [, n] of nodes) byMaturity.set(n.maturity, (byMaturity.get(n.maturity) ?? 0) + 1);
  return { nodes: nodes.length, fromMeta: fromMeta.length, own: nodes.length - fromMeta.length, components, byMaturity };
}

/** One paragraph of counts: node types, where they come from, maturity, icons. */
export function SliceSummary() {
  const m = readManifest();
  const c = counts(m);
  const total = getAllMeta().length;
  const maturity = (['stable', 'beta', 'alpha'] as const)
    .filter((k) => c.byMaturity.has(k))
    .map((k) => `${c.byMaturity.get(k)} ${k}`);
  const own = [...new Set(Object.values(m.nodes).filter((n) => n.source === 'sdui').map((n) => n.maturity))];
  return (
    <P>
      Schema {m.schemaVersion} has {plural(c.nodes, 'node type')}: {c.fromMeta} drawn by {c.components.size} of the {total}{' '}
      Strata components, and {c.own} of the schema’s own for layout and text. By maturity: {list(maturity)}. A node from a
      component takes the component’s maturity{own.length === 1 ? `; the schema’s own nodes are ${own[0]}` : ''}. Icons are referenced by name, and{' '}
      {plural(m.icons.length, 'icon')} from <InlineCode>@strata/icons</InlineCode> are on the list.
    </P>
  );
}

function ruleIds(n: ManifestNode) {
  return n.rules.map((r) => r.id);
}

/** Every node type in the manifest: where it comes from, its maturity and its accessibility rules. */
export function SliceTable() {
  const m = readManifest();
  const titles = new Map(getAllMeta().map((meta) => [meta.name, meta.title]));
  return (
    <Table aria-label="Node types in the schema">
      <thead>
        <tr>
          <th scope="col">Node</th>
          <th scope="col">Drawn by</th>
          <th scope="col">Maturity</th>
          <th scope="col">Accessibility rules</th>
        </tr>
      </thead>
      <tbody>
        {Object.entries(m.nodes).map(([type, n]) => (
          <tr key={type}>
            <td className={styles.nowrap}>
              <InlineCode>{type}</InlineCode>
            </td>
            <td>
              {n.component ? (
                <A href={`/docs/components/${n.component}`}>{titles.get(n.component) ?? n.component}</A>
              ) : (
                <span className={styles.subtle}>The schema</span>
              )}
            </td>
            <td>
              <MaturityBadge maturity={n.maturity} />
            </td>
            <td>
              {ruleIds(n).length ? (
                <span className={styles.rules}>
                  {ruleIds(n).map((id) => (
                    <span key={id} className={styles.nowrap}>
                      <InlineCode>{id}</InlineCode>
                    </span>
                  ))}
                </span>
              ) : (
                <span className={styles.subtle}>None</span>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </Table>
  );
}

/** Why inputs, overlays, tables and charts are out, and exactly which components that leaves off the wire. */
export function OutOfSlice() {
  const m = readManifest();
  const inSlice = counts(m).components;
  const out = getAllMeta().filter((meta) => !inSlice.has(meta.name));
  return (
    <>
      <P>
        <Rich text={m.outOfSlice} />
      </P>
      <Table aria-label="Components not in the schema, by category">
        <thead>
          <tr>
            <th scope="col">Category</th>
            <th scope="col">Not on the wire</th>
          </tr>
        </thead>
        <tbody>
          {CATEGORY_ORDER.map((category) => {
            const items = out.filter((meta) => meta.category === category);
            if (!items.length) return null;
            return (
              <tr key={category}>
                <td>{CATEGORY_LABEL[category]}</td>
                <td>
                  {items.map((meta, i) => (
                    <span key={meta.name}>
                      {i > 0 && ', '}
                      <A href={`/docs/components/${meta.name}`}>{meta.title}</A>
                    </span>
                  ))}
                </td>
              </tr>
            );
          })}
        </tbody>
      </Table>
      <P>
        {out.length} of {out.length + inSlice.size} components aren’t in the slice. From the components that are in it, these
        parts stay out:
      </P>
      <Ul>
        {m.excludedNodes.map((x) => (
          <Li key={x.node}>
            <InlineCode>{x.node}</InlineCode>: <Rich text={x.reason} />
          </Li>
        ))}
      </Ul>
    </>
  );
}

/** Props no node takes, from the manifest, with the reason the validator gives. */
export function NeverOnTheWire() {
  const m = readManifest();
  return (
    <Table aria-label="Props no node takes">
      <thead>
        <tr>
          <th scope="col">Prop</th>
          <th scope="col">Why not</th>
        </tr>
      </thead>
      <tbody>
        {m.excludedEverywhere.map((x) => (
          <tr key={x.prop}>
            <td className={styles.nowrap}>
              <InlineCode>{x.prop}</InlineCode>
            </td>
            <td>
              <Rich text={x.reason} />
            </td>
          </tr>
        ))}
      </tbody>
    </Table>
  );
}

/**
 * The native token files' contrast re-check, run when this page is built: each tenant's Kotlin and Swift file is
 * generated with the engine's exporters, its colours are read back out of the text, and every pair in
 * contrast-pairs.json is checked on them (verifyNativeExport, the same check `pnpm tokens` runs on the files it writes).
 */
export function NativeTokenChecks() {
  const brands: Array<{ id: string; name: string; brand: BrandInput }> = [
    ...getTenants().map((t) => ({ id: t.id, name: t.name, brand: t.brand })),
    { id: 'house', name: 'House (this site)', brand: getHouseBrand() },
  ];
  const rows = brands.map(({ id, name, brand }) => {
    const theme = generateTheme(brand);
    const model = buildNativeModel(theme);
    const kotlin = verifyNativeExport(theme, toCompose(theme, {}, model), 'compose', model);
    const swift = verifyNativeExport(theme, toSwiftUI(theme, model), 'swiftui', model);
    const score = (r: typeof kotlin) => ({
      passed: r.checks.filter((c) => c.pass).length,
      total: r.checks.length,
      problems: r.problems.length,
    });
    return { id, name, kotlin: score(kotlin), swift: score(swift) };
  });
  const cell = (s: { passed: number; total: number; problems: number }) => (
    <>
      {s.passed} of {s.total} pass
      {s.problems > 0 && <> · {plural(s.problems, 'problem')}</>}
    </>
  );
  return (
    <Table aria-label="Contrast checks on the exported native colours">
      <thead>
        <tr>
          <th scope="col">Tenant</th>
          <th scope="col">
            Compose (<InlineCode>StrataTokens.kt</InlineCode>)
          </th>
          <th scope="col">
            SwiftUI (<InlineCode>StrataTokens.swift</InlineCode>)
          </th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.id}>
            <td>{r.name}</td>
            <td className={styles.num}>{cell(r.kotlin)}</td>
            <td className={styles.num}>{cell(r.swift)}</td>
          </tr>
        ))}
      </tbody>
    </Table>
  );
}

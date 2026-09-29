import { IconCode, IconCheck, IconX } from '@syntara/icons';
import { IconBrandReact } from '@tabler/icons-react';
import { Kbd, Tag } from '@syntara/react';
import type { Metadata } from 'next';
import type { CSSProperties } from 'react';
import { notFound } from 'next/navigation';
import { DocsPage } from '@/components/docs/docs-page';
import { InstallTabs } from '@/components/docs/install-tabs';
import { MaturityBadgeLink } from '@/components/docs/maturity-badge';
import { CodeBlock } from '@/components/mdx/code-block';
import { PackageCommand } from '@/components/mdx/package-command';
import { H2, H3, P, Steps, Table, A } from '@/components/mdx/prose';
import { ComponentPreview } from '@/components/preview/component-preview';
import { CATEGORY_LABEL, type ComponentMeta, type Deprecation, type PropDoc } from '@/lib/meta-types';
import { getAllMeta, getMeta, heroExample } from '@/lib/meta';
import { readRepoFile } from '@/lib/repo';
import { githubBlob } from '@/lib/site';
import { slugify } from '@/lib/slug';
import type { TocItem } from '@/lib/toc';
import styles from './component-page.module.css';

export const dynamicParams = false;

export function generateStaticParams() {
  return getAllMeta().map((m) => ({ name: m.name }));
}

export async function generateMetadata({ params }: { params: Promise<{ name: string }> }): Promise<Metadata> {
  const { name } = await params;
  const meta = getMeta(name);
  return meta ? { title: meta.title, description: meta.description } : {};
}

function propsByComponent(props: PropDoc[]): Array<[string, PropDoc[]]> {
  const map = new Map<string, PropDoc[]>();
  for (const p of props) map.set(p.component, [...(map.get(p.component) ?? []), p]);
  return [...map];
}

function toc(meta: ComponentMeta): TocItem[] {
  const items: TocItem[] = [
    { id: 'installation', title: 'Installation', depth: 2 },
    { id: 'usage', title: 'Usage', depth: 2 },
  ];
  const more = meta.examples.slice(1);
  if (more.length) {
    items.push({ id: 'examples', title: 'Examples', depth: 2 });
    for (const e of more) items.push({ id: `example-${slugify(e.title)}`, title: e.title, depth: 3 });
  }
  items.push({ id: 'accessibility', title: 'Accessibility', depth: 2 });
  if (meta.guidelines.do.length || meta.guidelines.dont.length) items.push({ id: 'guidelines', title: 'Guidelines', depth: 2 });
  if (meta.props.length) {
    items.push({ id: 'api-reference', title: 'API reference', depth: 2 });
    for (const [component] of propsByComponent(meta.props)) items.push({ id: `api-${slugify(component)}`, title: component, depth: 3 });
  }
  if (meta.tokens.length) items.push({ id: 'tokens', title: 'Tokens', depth: 2 });
  return items;
}

/** `'a' | 'b' | 'c'` → ['a', 'b', 'c']; anything that isn't a union of string literals → null. */
function literalUnion(type: string): string[] | null {
  const parts = type.split('|').map((p) => p.trim());
  return parts.length > 1 && parts.every((p) => /^'[^']*'$/.test(p)) ? parts : null;
}

/**
 * A prop's type: string-literal unions become a row of values (the default one marked, deprecated ones struck
 * through and labelled in words); anything else is code.
 */
function PropType({ prop }: { prop: PropDoc }) {
  const literals = literalUnion(prop.type);
  if (!literals) return <code className={styles.typeCode}>{prop.type}</code>;
  const deprecated = new Set(prop.deprecatedValues?.map((d) => d.value));
  return (
    <ul className={styles.values} aria-label="Values">
      {literals.map((v) => (
        <li key={v} className={styles.value} data-default={v === prop.default || undefined} data-deprecated={deprecated.has(v) || undefined}>
          <code>{v.slice(1, -1)}</code>
          {v === prop.default && <span className={styles.valueDefault}>default</span>}
          {deprecated.has(v) && <span className={styles.valueDefault}>deprecated</span>}
        </li>
      ))}
    </ul>
  );
}

/** One deprecation record from meta.json, in words: what, since when, until when, what instead, and how to migrate. */
function DeprecationNote({ what, record }: { what: string; record: Deprecation }) {
  return (
    <div className={styles.deprecation}>
      <p>
        <strong>Deprecated:</strong> <code>{what}</code>, since {record.since}. It keeps working until {record.removal}. Use{' '}
        <code>{record.replacement}</code> instead. {record.reason}
      </p>
      <p>
        Migrate with <code>npx @syntara/codemods {record.codemod} &lt;path&gt;</code>. The decision is in{' '}
        <A href={githubBlob(`docs/rfcs/${record.rfc}.md`)}>RFC-{record.rfc.slice(0, 3)}</A>.
      </p>
    </div>
  );
}

const TOKEN_GROUPS: ReadonlyArray<{ label: string; match: (t: string) => boolean }> = [
  { label: 'Colour', match: (t) => t.startsWith('color.') },
  { label: 'Type', match: (t) => /^(font|line-height)\b/.test(t) },
  { label: 'Space and size', match: (t) => /^(space|control|card-inset|field-gap|section-gap|table-row-height|icon)\b/.test(t) },
  { label: 'Shape', match: (t) => t.startsWith('radius') },
  { label: 'Depth', match: (t) => /^(shadow|glass|hairline)\b/.test(t) },
  { label: 'Motion', match: (t) => t.startsWith('motion') },
];

/** "color.feedback.danger.onSolid" → "--syntara-color-feedback-danger-on-solid" (same rule as the engine's roleToCssVar). */
const tokenVar = (t: string) => '--syntara-' + t.replace(/\./g, '-').replace(/[A-Z]/g, (m) => '-' + m.toLowerCase());

function groupTokens(tokens: string[]): Array<{ label: string; tokens: string[] }> {
  const rest = [...tokens];
  const groups = TOKEN_GROUPS.map((g) => {
    const mine = rest.filter(g.match);
    for (const t of mine) rest.splice(rest.indexOf(t), 1);
    return { label: g.label, tokens: mine };
  });
  if (rest.length) groups.push({ label: 'Other', tokens: rest });
  return groups.filter((g) => g.tokens.length > 0);
}

/** "Shift + Tab" → Shift + Tab keycaps; "Space / Enter" → two alternatives. */
function Keys({ keys }: { keys: string }) {
  const alternatives = keys.split(/\s+\/\s+|\s+or\s+/);
  return (
    <span className={styles.keys}>
      {alternatives.map((alt, i) => (
        <span key={alt + i} className={styles.keyAlt}>
          {i > 0 && <span className={styles.keySep}>or</span>}
          {alt.split(/\s*\+\s*/).map((k, j) => (
            <span key={k + j} className={styles.keyCombo}>
              {j > 0 && <span aria-hidden="true">+</span>}
              <Kbd>{k}</Kbd>
            </span>
          ))}
        </span>
      ))}
    </span>
  );
}

export default async function ComponentPage({ params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  const meta = getMeta(name);
  if (!meta) notFound();

  const sourcePath = `packages/react/src/ui/${meta.name}.tsx`;
  const mainExport = meta.exports[0] ?? meta.title.replace(/\s+/g, '');
  const importLine = `import { ${meta.exports.join(', ') || mainExport} } from '@syntara/react';`;
  const moreExamples = meta.examples.slice(1);
  const files = meta.files.map((file) => ({ file, source: readRepoFile('packages', 'react', 'src', 'ui', file) }));

  return (
    <DocsPage
      href={`/docs/components/${meta.name}`}
      crumbs={[
        { href: '/docs/components', label: 'Components' },
        { label: CATEGORY_LABEL[meta.category] },
      ]}
      title={meta.title}
      description={meta.description}
      meta={
        <>
          <MaturityBadgeLink maturity={meta.maturity} size="md" />
          <span className={styles.metaLinks}>
            {meta.reactAria && (
              <a href={meta.reactAria} className={styles.metaLink} target="_blank" rel="noreferrer">
                <IconBrandReact aria-hidden size={14} />
                React Aria
              </a>
            )}
            <a href={githubBlob(sourcePath)} className={styles.metaLink} target="_blank" rel="noreferrer">
              <IconCode aria-hidden size={14} />
              Source
            </a>
          </span>
        </>
      }
      toc={toc(meta)}
      editUrl={githubBlob(`packages/react/meta/${meta.name}.meta.json`)}
    >
      {/* A heading for the hero keeps the outline h1 → h2 → h3 when an example contains its own h3. */}
      <section aria-labelledby="preview">
        <h2 id="preview" className="visually-hidden">
          Preview
        </h2>
        <ComponentPreview name={heroExample(meta)} label={`${meta.title}`} />
      </section>

      <H2 id="installation">Installation</H2>
      <InstallTabs
        label="Installation method"
        className={styles.installTabs}
        panelClassName={styles.installPanel}
        tabs={[
          {
            id: 'npm',
            label: 'npm',
            content: (
              <>
                <PackageCommand add="@syntara/react @syntara/tokens" />
                <CodeBlock code={importLine} lang="tsx" />
              </>
            ),
          },
          {
            id: 'manual',
            label: 'Manual',
            content: (
              <Steps>
                {meta.dependencies.length > 0 && (
                  <>
                    <H3 id="manual-dependencies">Install the dependencies</H3>
                    <PackageCommand add={meta.dependencies.join(' ')} />
                  </>
                )}
                <H3 id="manual-files">Copy the files into your components/ui folder</H3>
                {files.map(({ file, source }) =>
                  source ? (
                    <CodeBlock key={file} code={source} lang={file.endsWith('.css') ? 'css' : 'tsx'} title={`components/ui/${file}`} collapseAfter={16} />
                  ) : (
                    <P key={file}>
                      <code>{file}</code> isn’t in the repo yet.
                    </P>
                  ),
                )}
                {meta.registryDependencies.length > 0 && (
                  <>
                    <H3 id="manual-siblings">Copy the components it uses</H3>
                    <P>
                      {meta.registryDependencies.map((dep, i) => (
                        <span key={dep}>
                          {i > 0 && ', '}
                          <A href={`/docs/components/${dep}`}>{getMeta(dep)?.title ?? dep}</A>
                        </span>
                      ))}{' '}
                      — same steps, same folder.
                    </P>
                  </>
                )}
                <H3 id="manual-tokens">Load the tokens once</H3>
                <P>
                  Components read <code>--syntara-*</code> variables. Import a tenant’s token file at your app root — see{' '}
                  <A href="/docs/installation">Installation</A>.
                </P>
              </Steps>
            ),
          },
        ]}
      />

      <H2 id="usage">Usage</H2>
      {meta.usage ? <CodeBlock code={meta.usage} lang="tsx" /> : <CodeBlock code={importLine} lang="tsx" />}

      {moreExamples.length > 0 && (
        <>
          <H2 id="examples">Examples</H2>
          {moreExamples.map((e) => (
            <section key={e.name} className={styles.example} aria-labelledby={`example-${slugify(e.title)}`}>
              <H3 id={`example-${slugify(e.title)}`}>{e.title}</H3>
              {e.description && <P>{e.description}</P>}
              <ComponentPreview name={e.name} label={e.title} />
            </section>
          ))}
        </>
      )}

      <H2 id="accessibility">Accessibility</H2>
      {meta.accessibility.keyboard.length > 0 ? (
        <Table aria-label="Keyboard interactions">
          <thead>
            <tr>
              <th scope="col">Keys</th>
              <th scope="col">Action</th>
            </tr>
          </thead>
          <tbody>
            {meta.accessibility.keyboard.map((k) => (
              <tr key={k.keys}>
                <td className={styles.keysCell}>
                  <Keys keys={k.keys} />
                </td>
                <td>{k.action}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      ) : (
        <P>No keyboard interaction of its own.</P>
      )}
      {meta.accessibility.notes.length > 0 && (
        <ul className={styles.notes}>
          {meta.accessibility.notes.map((n) => (
            <li key={n}>{n}</li>
          ))}
        </ul>
      )}

      {(meta.guidelines.do.length > 0 || meta.guidelines.dont.length > 0) && (
        <>
          <H2 id="guidelines">Guidelines</H2>
          <div className={styles.guidelines}>
            {(
              [
                { kind: 'do', title: 'Do', items: meta.guidelines.do, Icon: IconCheck },
                { kind: 'dont', title: 'Don’t', items: meta.guidelines.dont, Icon: IconX },
              ] as const
            ).map(({ kind, title, items, Icon }) =>
              items.length > 0 ? (
                <section key={kind} className={styles.guide} data-kind={kind} aria-labelledby={`guidelines-${kind}`}>
                  <h3 id={`guidelines-${kind}`} className={styles.guideTitle}>
                    <span className={styles.guideChip} aria-hidden="true">
                      <Icon />
                    </span>
                    {title}
                  </h3>
                  <ul className={styles.guideList}>
                    {items.map((g) => (
                      <li key={g}>{g}</li>
                    ))}
                  </ul>
                </section>
              ) : null,
            )}
          </div>
        </>
      )}

      {meta.props.length > 0 && (
        <>
          <H2 id="api-reference">API reference</H2>
          {propsByComponent(meta.props).map(([component, props]) => (
            <section key={component} className={styles.api} aria-labelledby={`api-${slugify(component)}`}>
              <H3 id={`api-${slugify(component)}`}>{component}</H3>
              <dl className={styles.props}>
                {props.map((p) => (
                  <div key={p.name} className={styles.prop}>
                    <dt className={styles.propName}>
                      <code>{p.name}</code>
                      {p.deprecated && (
                        <Tag size="sm" variant="outline" className={styles.propRequired}>
                          Deprecated
                        </Tag>
                      )}
                      {p.required && (
                        <Tag size="sm" variant="outline" className={styles.propRequired}>
                          Required
                        </Tag>
                      )}
                    </dt>
                    <dd className={styles.propBody}>
                      <PropType prop={p} />
                      <p className={styles.propDescription}>{p.description}</p>
                      {p.deprecated && <DeprecationNote what={p.name} record={p.deprecated} />}
                      {p.deprecatedValues?.map((d) => (
                        <DeprecationNote key={d.value} what={`${p.name}=${d.value.replace(/'/g, '"')}`} record={d} />
                      ))}
                      {p.default && !literalUnion(p.type)?.includes(p.default) && (
                        <p className={styles.propDefault}>
                          Default <code>{p.default}</code>
                        </p>
                      )}
                    </dd>
                  </div>
                ))}
              </dl>
            </section>
          ))}
        </>
      )}

      {meta.tokens.length > 0 && (
        <>
          <H2 id="tokens">Tokens</H2>
          <P>
            The semantic tokens this component reads, grouped by what they control. Swatches show this site’s theme; change a tenant’s brand and the component follows with no code change.
          </P>
          <dl className={styles.tokenGroups}>
            {groupTokens(meta.tokens).map((g) => (
              <div key={g.label} className={styles.tokenGroup}>
                <dt className={styles.tokenLabel}>
                  {g.label}
                  <span className={styles.tokenCount}>{g.tokens.length}</span>
                </dt>
                <dd className={styles.tokenList}>
                  {g.tokens.map((t) => (
                    <code key={t} className={styles.token}>
                      {t.startsWith('color.') && (
                        <span
                          className={styles.tokenSwatch}
                          data-wildcard={t.includes('*') || undefined}
                          style={t.includes('*') ? undefined : ({ '--_swatch': `var(${tokenVar(t)})` } as CSSProperties)}
                          aria-hidden="true"
                        />
                      )}
                      {t.startsWith('color.') ? t.slice('color.'.length) : t}
                    </code>
                  ))}
                </dd>
              </div>
            ))}
          </dl>
        </>
      )}
    </DocsPage>
  );
}

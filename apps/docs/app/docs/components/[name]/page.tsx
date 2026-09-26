import { IconBrandReact, IconCode, IconCheck, IconX, IconBraces } from '@tabler/icons-react';
import { Tab, TabList, TabPanel, Tabs, Kbd } from '@strata/react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { DocsPage } from '@/components/docs/docs-page';
import { MaturityBadge } from '@/components/docs/maturity-badge';
import { CodeBlock } from '@/components/mdx/code-block';
import { PackageCommand } from '@/components/mdx/package-command';
import { H2, H3, P, Steps, Table, A } from '@/components/mdx/prose';
import { ComponentPreview } from '@/components/preview/component-preview';
import { CATEGORY_LABEL, type ComponentMeta, type PropDoc } from '@/lib/meta-types';
import { getAllMeta, getMeta } from '@/lib/meta';
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

function heroName(meta: ComponentMeta): string {
  return meta.examples[0]?.name ?? `${meta.name}-demo`;
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
  const importLine = `import { ${meta.exports.join(', ') || mainExport} } from '@strata/react';`;
  const moreExamples = meta.examples.slice(1);
  const files = meta.files.map((file) => ({ file, source: readRepoFile('packages', 'react', 'src', 'ui', file) }));

  return (
    <DocsPage
      href={`/docs/components/${meta.name}`}
      crumbs={[
        { href: '/docs', label: 'Docs' },
        { href: '/docs/components', label: 'Components' },
        { label: meta.title },
      ]}
      title={meta.title}
      description={meta.description}
      meta={
        <>
          <MaturityBadge maturity={meta.maturity} size="md" />
          <span className={styles.category}>{CATEGORY_LABEL[meta.category]}</span>
          <span className={styles.metaLinks}>
            {meta.reactAria && (
              <a href={meta.reactAria} className={styles.metaLink} target="_blank" rel="noreferrer">
                <IconBrandReact aria-hidden size={14} stroke={1.75} />
                React Aria
              </a>
            )}
            <a href={githubBlob(sourcePath)} className={styles.metaLink} target="_blank" rel="noreferrer">
              <IconCode aria-hidden size={14} stroke={1.75} />
              Source
            </a>
            <a href={`/r/${meta.name}.json`} className={styles.metaLink}>
              <IconBraces aria-hidden size={14} stroke={1.75} />
              Registry item
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
        <ComponentPreview name={heroName(meta)} label={`${meta.title}`} />
      </section>

      <H2 id="installation">Installation</H2>
      <Tabs className={styles.installTabs}>
        <TabList aria-label="Installation method">
          <Tab id="cli">CLI</Tab>
          <Tab id="npm">npm</Tab>
          <Tab id="manual">Manual</Tab>
        </TabList>
        <TabPanel id="cli" className={styles.installPanel}>
          <PackageCommand dlx={`shadcn@latest add @strata/${meta.name}`} />
          <P className={styles.note}>
            Needs the <code>@strata</code> namespace in <code>components.json</code> and the base item (
            <code>@strata/strata</code>) once per project — see{' '}
            <A href="/docs/installation#add-the-strata-namespace">Installation</A>. Or use the item’s URL:
          </P>
          <PackageCommand dlx={`shadcn@latest add {{SITE_URL}}/r/${meta.name}.json`} />
        </TabPanel>
        <TabPanel id="npm" className={styles.installPanel}>
          <PackageCommand add="@strata/react @strata/tokens" />
          <CodeBlock code={importLine} lang="tsx" />
        </TabPanel>
        <TabPanel id="manual" className={styles.installPanel}>
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
              Components read <code>--strata-*</code> variables. Import a tenant’s token file at your app root — see{' '}
              <A href="/docs/installation">Installation</A>.
            </P>
          </Steps>
        </TabPanel>
      </Tabs>

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
            <section className={styles.guide} data-kind="do" aria-labelledby="guidelines-do">
              <h3 id="guidelines-do" className={styles.guideTitle}>
                <IconCheck aria-hidden size={16} stroke={2} />
                Do
              </h3>
              <ul className={styles.guideList}>
                {meta.guidelines.do.map((g) => (
                  <li key={g}>{g}</li>
                ))}
              </ul>
            </section>
            <section className={styles.guide} data-kind="dont" aria-labelledby="guidelines-dont">
              <h3 id="guidelines-dont" className={styles.guideTitle}>
                <IconX aria-hidden size={16} stroke={2} />
                Don’t
              </h3>
              <ul className={styles.guideList}>
                {meta.guidelines.dont.map((g) => (
                  <li key={g}>{g}</li>
                ))}
              </ul>
            </section>
          </div>
        </>
      )}

      {meta.props.length > 0 && (
        <>
          <H2 id="api-reference">API reference</H2>
          {propsByComponent(meta.props).map(([component, props]) => (
            <section key={component} className={styles.api} aria-labelledby={`api-${slugify(component)}`}>
              <H3 id={`api-${slugify(component)}`}>{component}</H3>
              <Table aria-label={`${component} props`}>
                <thead>
                  <tr>
                    <th scope="col">Prop</th>
                    <th scope="col">Type and description</th>
                  </tr>
                </thead>
                <tbody>
                  {props.map((p) => (
                    <tr key={p.name}>
                      <td className={styles.propName}>
                        <code>{p.name}</code>
                        {p.required && <span className={styles.propMeta}>Required</span>}
                        {p.default && (
                          <span className={styles.propMeta}>
                            Default <code>{p.default}</code>
                          </span>
                        )}
                      </td>
                      <td className={styles.propType}>
                        <code>{p.type}</code>
                        <span className={styles.propDescription}>{p.description}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </section>
          ))}
        </>
      )}

      {meta.tokens.length > 0 && (
        <>
          <H2 id="tokens">Tokens</H2>
          <P>
            The semantic tokens this component reads. Change them per tenant and the component follows — no code change.
          </P>
          <ul className={styles.tokens}>
            {meta.tokens.map((t) => (
              <li key={t}>
                <code>{t}</code>
              </li>
            ))}
          </ul>
        </>
      )}
    </DocsPage>
  );
}

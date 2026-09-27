import { notFound } from 'next/navigation';
import { DOC_CONTENT } from '@/lib/doc-content';
import { DOC_GROUPS, getDocPage } from '@/lib/docs';
import { readRepoFile } from '@/lib/repo';
import { githubBlob } from '@/lib/site';
import { tocFromMdx } from '@/lib/toc';
import { DocsPage } from './docs-page';

/** Renders content/docs/<slug>.mdx inside the docs page frame, with a TOC read from the MDX source. */
export async function MdxPage({ slug }: { slug: string }) {
  const page = getDocPage(slug);
  const load = DOC_CONTENT[slug];
  if (!page || !load) notFound();
  const { default: Content } = await load();
  const repoFile = `apps/docs/content/docs/${slug}.mdx`;
  const source = readRepoFile(...repoFile.split('/')) ?? '';
  const group = DOC_GROUPS.find((g) => g.id === page.group)?.label ?? 'Docs';
  const crumbs = slug === 'index' ? [{ label: 'Docs' }, { label: group }] : [{ href: '/docs', label: 'Docs' }, { label: group }];
  return (
    <DocsPage
      href={page.href}
      crumbs={crumbs}
      title={page.title}
      description={page.description}
      toc={tocFromMdx(source)}
      editUrl={githubBlob(repoFile)}
    >
      <Content />
    </DocsPage>
  );
}

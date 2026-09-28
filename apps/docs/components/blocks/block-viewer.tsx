import { Tab, TabList, TabPanel, Tabs } from '@syntara/react';
import { CodeBlock } from '@/components/mdx/code-block';
import { PackageCommand } from '@/components/mdx/package-command';
import { getBlockContents, getBlockFiles, getBlockTenants, type BlockInfo } from './block-data';
import { BlockViewerClient } from './block-viewer-client';
import styles from './block-viewer.module.css';

/**
 * One block on /blocks: title, a Preview/Code switch, the block rendered live in a ThemeScope per tenant and
 * scheme at three widths, its source files (highlighted at build time) and the packages to install before copying them.
 */
/** The npm packages a block's files import, read from the source; react is assumed. */
function blockPackages(sources: string[]): string[] {
  const found = new Set<string>();
  for (const source of sources) {
    for (const [, spec] of source.matchAll(/from '([^'.][^']*)'/g)) {
      const pkg = spec!.startsWith('@') ? spec!.split('/').slice(0, 2).join('/') : spec!.split('/')[0]!;
      if (pkg !== 'react') found.add(pkg);
    }
  }
  return [...found].sort();
}

export async function BlockViewer({ block, index }: { block: BlockInfo; index?: number }) {
  const files = getBlockFiles(block.name);
  const packages = blockPackages(files.map((f) => f.source));
  const code = (
    <Tabs variant="pill" className={styles.files} defaultSelectedKey={files[0]?.name}>
      <TabList aria-label={`${block.title} files`} className={styles.fileList}>
        {files.map((f) => (
          <Tab key={f.name} id={f.name}>
            {f.name}
          </Tab>
        ))}
      </TabList>
      {files.map((f) => (
        <TabPanel key={f.name} id={f.name} className={styles.filePanel}>
          <CodeBlock code={f.source} lang={f.lang} title={`blocks/${block.name}/${f.name}`} collapseAfter={0} />
        </TabPanel>
      ))}
    </Tabs>
  );
  return (
    <BlockViewerClient
      name={block.name}
      title={block.title}
      description={block.description}
      index={index}
      categories={block.categories}
      packages={packages}
      tenants={getBlockTenants()}
      contents={getBlockContents(block)}
      code={code}
      install={packages.length > 0 ? <PackageCommand add={packages.join(' ')} /> : null}
    />
  );
}

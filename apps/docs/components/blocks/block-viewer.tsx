import { Tab, TabList, TabPanel, Tabs } from '@strata/react';
import { CodeBlock } from '@/components/mdx/code-block';
import { PackageCommand } from '@/components/mdx/package-command';
import { getBlockContents, getBlockFiles, getBlockTenants, type BlockInfo } from './block-data';
import { BlockViewerClient } from './block-viewer-client';
import styles from './block-viewer.module.css';

/**
 * One block on /blocks: title, a Preview/Code switch, the block rendered live in a ThemeScope per tenant and
 * scheme at three widths, its source files (highlighted at build time) and the registry install command.
 */
export async function BlockViewer({ block }: { block: BlockInfo }) {
  const files = getBlockFiles(block.name);
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
      tenants={getBlockTenants()}
      contents={getBlockContents(block)}
      code={code}
      install={<PackageCommand dlx={`shadcn@latest add @strata/${block.name}`} />}
    />
  );
}

import { HOUSE_ID } from '@/lib/house';
import { readExampleSource } from '@/lib/examples';
import { getHouseBrand, getTenants } from '@/lib/tenants';
import { CodeBlock } from '../mdx/code-block';
import { PreviewClient, type PreviewTenant } from './preview-client';

function previewTenants(): PreviewTenant[] {
  return [
    ...getTenants().map((t) => ({ id: t.id, name: t.name, density: t.brand.density, locale: t.locale, dir: t.dir })),
    { id: HOUSE_ID, name: 'House', density: getHouseBrand().density, locale: 'en-US', dir: 'ltr' as const },
  ];
}

export interface ComponentPreviewProps {
  /** Example file name in apps/docs/examples/<component>/, e.g. "button-demo". */
  name: string;
  /** Vertical alignment of the example in the stage. */
  align?: 'center' | 'start';
  /** Accessible label for the preview region; defaults to the example name. */
  label?: string;
}

/**
 * Live example with Preview / Code tabs. The preview renders inside a ThemeScope whose tenant, scheme,
 * direction and density are local to this preview; the code is the example file, highlighted at build time.
 */
export async function ComponentPreview({ name, align = 'center', label }: ComponentPreviewProps) {
  const example = readExampleSource(name);
  const code = example ? (
    <CodeBlock code={example.source} lang="tsx" title={`examples/${example.folder}/${name}.tsx`} collapseAfter={28} flush />
  ) : null;
  return <PreviewClient name={name} label={label ?? name} align={align} tenants={previewTenants()} code={code} />;
}

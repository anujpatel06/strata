import { IconFileTypeCss, IconFileTypeTsx, IconJson, IconTerminal2, IconFile } from '@syntara/icons';
import { isValidElement, type ReactNode } from 'react';
import { highlight, normaliseLang } from '@/lib/highlight';
import { SITE_URL } from '@/lib/site';
import { CodeFrame } from './code-frame';

/** `{{SITE_URL}}` in any code block becomes the deployed origin (NEXT_PUBLIC_SITE_URL). */
export function withSiteUrl(code: string): string {
  return code.replaceAll('{{SITE_URL}}', SITE_URL);
}

function fileIcon(lang: string, title?: string) {
  const props = { size: 14, 'aria-hidden': true } as const;
  if (lang === 'bash') return <IconTerminal2 {...props} />;
  if (lang === 'css' || title?.endsWith('.css')) return <IconFileTypeCss {...props} />;
  if (lang === 'json') return <IconJson {...props} />;
  if (lang === 'tsx' || lang === 'ts') return <IconFileTypeTsx {...props} />;
  return <IconFile {...props} />;
}

/**
 * Finds the fenced code inside MDX children: <CodeBlock title="x">```json …```</CodeBlock> arrives as
 * pre > code.language-json > "text". Returns the text and language.
 */
function fromChildren(node: ReactNode): { code: string; lang?: string } | undefined {
  if (Array.isArray(node)) {
    for (const child of node) {
      const found = fromChildren(child);
      if (found) return found;
    }
    return undefined;
  }
  if (!isValidElement<{ children?: ReactNode; className?: string }>(node)) return undefined;
  const { children, className } = node.props;
  if (typeof children === 'string' && /language-/.test(className ?? '')) {
    return { code: children, lang: /language-([\w-]+)/.exec(className ?? '')?.[1] };
  }
  return fromChildren(children);
}

export interface CodeBlockProps {
  /** The source. In MDX you can instead nest a fenced code block as children (keeps indentation intact). */
  code?: string;
  children?: ReactNode;
  lang?: string;
  /** File name or caption shown in a title bar. */
  title?: string;
  /** Collapse when longer than this many lines (default 24). Set 0 to never collapse. */
  collapseAfter?: number;
  flush?: boolean;
}

/** Server component: highlights at build time, then hands the HTML to the client frame for copy/expand. */
export async function CodeBlock({ code, children, lang, title, collapseAfter = 24, flush }: CodeBlockProps) {
  const nested = code == null ? fromChildren(children) : undefined;
  const source = withSiteUrl(code ?? nested?.code ?? '').replace(/\n+$/, '');
  const resolved = normaliseLang(lang ?? nested?.lang ?? 'tsx');
  const html = await highlight(source, resolved);
  const lines = source.split('\n').length;
  return (
    <CodeFrame
      title={title}
      icon={title ? fileIcon(resolved, title) : undefined}
      collapsible={collapseAfter > 0 && lines > collapseAfter}
      flush={flush}
    >
      <div dangerouslySetInnerHTML={{ __html: html }} />
    </CodeFrame>
  );
}

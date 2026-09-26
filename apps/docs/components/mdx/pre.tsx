import { isValidElement, type ReactNode } from 'react';
import { CodeBlock } from './code-block';

/** MDX fenced code → <pre><code class="language-x">…</code></pre>. Re-render it through Shiki. */
export async function Pre({ children }: { children?: ReactNode }) {
  let code = '';
  let lang = 'text';
  if (isValidElement<{ children?: ReactNode; className?: string }>(children)) {
    const inner = children.props.children;
    code = typeof inner === 'string' ? inner : Array.isArray(inner) ? inner.join('') : '';
    lang = /language-([\w-]+)/.exec(children.props.className ?? '')?.[1] ?? 'text';
  }
  return <CodeBlock code={code} lang={lang} />;
}

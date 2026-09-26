import { slugify } from './slug';

export interface TocItem {
  id: string;
  title: string;
  depth: 2 | 3;
}

/** Plain text of an inline-markdown heading: `code`, **bold**, [links](…) → text. */
function inlineText(md: string): string {
  return md
    .replace(/`([^`]*)`/g, '$1')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[*_]{1,2}([^*_]+)[*_]{1,2}/g, '$1')
    .replace(/<[^>]+>/g, '')
    .trim();
}

/** ## and ### headings of an MDX source, skipping fenced code. Ids match mdx-components' headings. */
export function tocFromMdx(source: string): TocItem[] {
  const items: TocItem[] = [];
  let inFence = false;
  for (const line of source.split('\n')) {
    if (/^\s*(```|~~~)/.test(line)) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;
    const m = /^(#{2,3})\s+(.+?)\s*#*\s*$/.exec(line);
    if (!m) continue;
    const title = inlineText(m[2] ?? '');
    items.push({ id: slugify(title), title, depth: m[1]!.length === 2 ? 2 : 3 });
  }
  return items;
}

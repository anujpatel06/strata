/**
 * Patterns are the docs site's blocks: apps/docs/blocks/blocks.json and one folder per block.
 *
 * Nothing about a pattern is written by hand here. `components` comes from the block's import of '@strata/react',
 * matched to component names through each meta file's `exports`. `structure` is the first paragraph of the
 * comment at the top of the block's source, one sentence per line.
 */
import { existsSync, readFileSync } from 'node:fs';
import { cachedFile } from './cache';
import { allComponents, closest } from './components';
import { ToolError, inside, isSafeName, repoPath, SAFE_NAME_MESSAGE } from './root';

interface BlockEntry {
  name: string;
  title: string;
  description: string;
  categories?: string[];
}

const BLOCKS_DIR = 'apps/docs/blocks';
const MAX_STRUCTURE_LINES = 6;

function blocks(root: string): BlockEntry[] {
  const index = inside(root, BLOCKS_DIR, 'blocks.json');
  if (!existsSync(index)) throw new ToolError(`${BLOCKS_DIR}/blocks.json is missing, so there are no patterns to return.`);
  return cachedFile('blocks', index, (text) => (JSON.parse(text) as BlockEntry[]).filter((b) => isSafeName(b.name)));
}

export function listPatterns(root: string): Record<string, unknown> {
  return {
    patterns: blocks(root).map((b) => ({ name: b.name, title: b.title, purpose: b.description })),
    hint: 'Call get_pattern with a name for its components and structure.',
  };
}

/** Names imported from '@strata/react', in source order. Type-only imports are skipped. */
export function strataImports(source: string): string[] {
  const names: string[] = [];
  const re = /import\s+(type\s+)?\{([^}]*)\}\s*from\s*['"]@strata\/react['"]/g;
  for (const match of source.matchAll(re)) {
    if (match[1]) continue;
    for (const raw of match[2]!.split(',')) {
      const item = raw.trim();
      if (item === '' || item.startsWith('type ')) continue;
      names.push(item.split(/\s+as\s+/)[0]!.trim());
    }
  }
  return [...new Set(names)];
}

/** The first paragraph of the first block comment, one sentence per line. */
export function headerLines(source: string): string[] {
  const comment = /\/\*\*([\s\S]*?)\*\//.exec(source);
  if (!comment) return [];
  const paragraph = comment[1]!
    .split('\n')
    .map((line) => line.replace(/^\s*\*\s?/, '').trimEnd())
    .join('\n')
    .trim()
    .split(/\n\s*\n/)[0]!
    .replace(/\s*\n\s*/g, ' ');
  return paragraph
    .split(/(?<=[.!?])\s+(?=[A-Z`'"])/)
    .map((s) => s.trim())
    .filter((s) => s !== '')
    .slice(0, MAX_STRUCTURE_LINES);
}

export function getPattern(root: string, name: string, includeSource = false): Record<string, unknown> {
  if (!isSafeName(name)) throw new ToolError(`"${name}" is not a pattern name. ${SAFE_NAME_MESSAGE}`);
  const all = blocks(root);
  const block = all.find((b) => b.name === name);
  const file = inside(root, BLOCKS_DIR, name, `${name}.tsx`);
  if (!block || !existsSync(file)) {
    throw new ToolError(`No pattern named "${name}". Use one of the patterns listed.`, {
      closest: closest(name, all.map((b) => b.name)),
      patterns: all.map((b) => b.name),
    });
  }
  const source = readFileSync(file, 'utf8');
  const byExport = new Map<string, string>();
  for (const meta of allComponents(root)) for (const e of meta.exports) byExport.set(e, meta.name);
  const components = [...new Set(strataImports(source).flatMap((n) => byExport.get(n) ?? []))].sort();
  return {
    name: block.name,
    title: block.title,
    purpose: block.description,
    components,
    structure: headerLines(source),
    source: repoPath(root, file),
    lines: source.split('\n').length,
    ...(includeSource ? { code: source } : { hint: 'Pass includeSource: true for the code. It is long.' }),
  };
}

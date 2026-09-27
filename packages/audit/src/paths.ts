/** Finds the files to audit. */
import { readdirSync, statSync } from 'node:fs';
import { join, relative, resolve, sep } from 'node:path';
import type { Language } from './types';

/** Always skipped: dependencies, build output, generated files and test fixtures. */
export const DEFAULT_IGNORES: readonly string[] = [
  '**/node_modules/**',
  '**/dist/**',
  '**/build/**',
  '**/.next*/**',
  '**/*.generated.*',
  '**/fixtures/**',
  '**/__fixtures__/**',
];

export function languageOf(file: string): Language | null {
  if (/\.(tsx|jsx)$/i.test(file)) return 'tsx';
  if (/\.css$/i.test(file)) return 'css';
  return null;
}

/** A small glob: ** crosses folders, * and ? stay inside one. A pattern with no slash inside it matches at any depth; one that ends in a slash is a folder. */
export function globToRegExp(glob: string): RegExp {
  let pattern = glob.replace(/\\/g, '/').replace(/^\.\//, '');
  if (!pattern.replace(/\/$/, '').includes('/')) pattern = '**/' + pattern;
  if (pattern.endsWith('/')) pattern += '**';
  let out = '';
  for (let i = 0; i < pattern.length; i++) {
    const ch = pattern[i]!;
    if (ch === '*') {
      if (pattern[i + 1] === '*') {
        i++;
        if (pattern[i + 1] === '/') {
          i++;
          out += '(?:.*/)?';
        } else out += '.*';
      } else out += '[^/]*';
    } else if (ch === '?') out += '[^/]';
    else out += ch.replace(/[.+^${}()|[\]\\]/g, '\\$&');
  }
  return new RegExp(`^${out}$`);
}

export function makeIgnore(extra: readonly string[] = []): (path: string, isDirectory: boolean) => boolean {
  const patterns = [...DEFAULT_IGNORES, ...extra].map(globToRegExp);
  return (path, isDirectory) => {
    const p = path.split(sep).join('/').replace(/^\.\//, '');
    // A folder is tested as if it held a file, so "**/dist/**" stops the walk at dist.
    return patterns.some((re) => re.test(p) || (isDirectory && re.test(p + '/x')));
  };
}

/** Files under the given paths, as paths relative to cwd, sorted. A file given by name is still filtered. */
export function collectFiles(paths: readonly string[], extraIgnores: readonly string[] = [], cwd = process.cwd()): string[] {
  const ignored = makeIgnore(extraIgnores);
  const found = new Set<string>();
  const shown = (absolute: string): string => {
    const rel = relative(cwd, absolute);
    return rel === '' ? '.' : rel.split(sep).join('/');
  };
  const walk = (absolute: string): void => {
    for (const entry of readdirSync(absolute, { withFileTypes: true })) {
      const child = join(absolute, entry.name);
      const name = shown(child);
      if (entry.isDirectory()) {
        if (!ignored(name, true)) walk(child);
      } else if (entry.isFile() && languageOf(entry.name) && !ignored(name, false)) found.add(name);
    }
  };
  for (const given of paths) {
    const absolute = resolve(cwd, given);
    const stat = statSync(absolute);
    if (stat.isDirectory()) walk(absolute);
    else if (languageOf(absolute) && !ignored(shown(absolute), false)) found.add(shown(absolute));
  }
  return [...found].sort();
}

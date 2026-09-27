/**
 * A small cache for files read at request time. An entry is reused while the file's modified time and size
 * are unchanged, so edits to meta.json or brand.json show up on the next call without a restart.
 */
import { readFileSync, statSync } from 'node:fs';

interface Entry<T> {
  stamp: string;
  value: T;
}

const entries = new Map<string, Entry<unknown>>();

function stampOf(path: string): string {
  const s = statSync(path);
  return `${s.mtimeMs}:${s.size}`;
}

/** Reads `path` and runs `parse` on its text, or returns the cached result. `kind` separates parsers of one file. */
export function cachedFile<T>(kind: string, path: string, parse: (text: string) => T): T {
  const key = `${kind}\0${path}`;
  const stamp = stampOf(path);
  const hit = entries.get(key);
  if (hit && hit.stamp === stamp) return hit.value as T;
  const value = parse(readFileSync(path, 'utf8'));
  entries.set(key, { stamp, value });
  return value;
}

export function clearCache(): void {
  entries.clear();
}

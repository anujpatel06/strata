/**
 * Server-only file access into the monorepo. Pages are prerendered at build time, so these reads
 * happen during `next build` with cwd = apps/docs.
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';

export const DOCS_ROOT = process.cwd();
export const REPO_ROOT = path.resolve(DOCS_ROOT, '..', '..');

// Pages are fully static, so nothing here needs tracing into the server output.
export const repoPath = (...parts: string[]): string => path.join(/*turbopackIgnore: true*/ REPO_ROOT, ...parts);

export function readRepoFile(...parts: string[]): string | undefined {
  const file = repoPath(...parts);
  return existsSync(file) ? readFileSync(file, 'utf8') : undefined;
}

export function listRepoDir(...parts: string[]): string[] {
  const dir = repoPath(...parts);
  return existsSync(dir) ? readdirSync(dir).sort() : [];
}

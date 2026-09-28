/**
 * Where the Syntara repo is, and the only ways this package turns a name into a path.
 * Every file read in the server goes through `inside()`, so nothing outside the repo root can be read.
 */
import { existsSync, realpathSync } from 'node:fs';
import { dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));

/** An error whose message is written for the agent: it says what went wrong and what to do next. */
export class ToolError extends Error {
  /** Extra compact fields for the error payload, e.g. `{ closest: [...] }`. */
  readonly details: Record<string, unknown>;
  constructor(message: string, details: Record<string, unknown> = {}) {
    super(message);
    this.name = 'ToolError';
    this.details = details;
  }
}

/** kebab-case names only: component, example, pattern and tenant ids. No dots, slashes or backslashes. */
export const SAFE_NAME = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const SAFE_NAME_MESSAGE =
  'Use a kebab-case name such as "button" or "date-picker". Paths, "..", slashes and absolute paths are not accepted.';

export function isSafeName(name: string): boolean {
  return name.length <= 64 && SAFE_NAME.test(name);
}

/** SYNTARA_ROOT if set, otherwise three levels up from packages/mcp/src. */
export function findRoot(env: NodeJS.ProcessEnv = process.env): string {
  const override = env.SYNTARA_ROOT;
  return resolve(override && override.trim() !== '' ? override : join(here, '../../..'));
}

/** Throws a ToolError when `root` doesn't look like a Syntara checkout. */
export function assertRoot(root: string): void {
  if (!existsSync(join(root, 'packages/react/meta'))) {
    throw new ToolError(
      `No Syntara repo at ${root} (packages/react/meta is missing). Set the SYNTARA_ROOT environment variable to the repo's path in the MCP server config.`,
    );
  }
}

/**
 * Joins `parts` under `root` and refuses anything that lands outside it, including through a symlink.
 * Callers validate names with `isSafeName` first; this is the second lock.
 */
export function inside(root: string, ...parts: string[]): string {
  for (const part of parts) {
    if (isAbsolute(part) || part.split(/[\\/]/).includes('..')) {
      throw new ToolError(`"${part}" is not allowed. ${SAFE_NAME_MESSAGE}`);
    }
  }
  const target = resolve(root, ...parts);
  const check = (base: string, path: string): void => {
    const rel = relative(base, path);
    if (rel === '' || rel.startsWith('..' + sep) || rel === '..' || isAbsolute(rel)) {
      throw new ToolError(`That path is outside the Syntara repo. ${SAFE_NAME_MESSAGE}`);
    }
  };
  check(root, target);
  if (existsSync(target)) check(realpathSync(root), realpathSync(target));
  return target;
}

/** Repo-relative path with forward slashes, for responses. */
export function repoPath(root: string, path: string): string {
  return relative(root, path).split(sep).join('/');
}

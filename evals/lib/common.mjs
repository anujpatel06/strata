/** Shared paths and helpers for the eval scripts. See ../README.md for the method. */
import { execFileSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const EVALS = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const REPO = path.resolve(EVALS, '..');
export const CACHE = path.join(EVALS, '.cache');
export const RUNS = path.join(EVALS, 'runs');
/**
 * Everything a run can see lives outside the repo on purpose:
 * - Claude Code loads CLAUDE.md files from parent folders, so a workspace inside this repo would hand every run
 *   the project's own instructions.
 * - A run can follow node_modules to its real path. If that path were inside the repo, the run could find the
 *   repo's docs, examples and meta files, which a real consumer doesn't have.
 * run.mjs also denies reads of the repo, and records every file a run read, so a leak shows up in the results.
 */
export const PREPARED = path.join(os.tmpdir(), 'syntara-evals-prepared');
export const PACKS = path.join(PREPARED, 'packs');
/** The template with dependencies installed once. Every run's workspace links to its node_modules. */
export const INSTALLED = path.join(PREPARED, 'app');
/**
 * Each run gets its own parent folder with a random name, so listing the folder above a workspace shows nothing
 * from another run, and a path is never used twice. Found in the first smoke runs: with shared, predictable paths a
 * run read a neighbouring workspace, and read memory notes that an earlier run at the same path had saved.
 */
export const newWorkspace = () => path.join(os.tmpdir(), `se-${randomBytes(6).toString('hex')}`, 'app');

/** The conditions a prompt can run under. `files` are written into the workspace; `mcp` connects the server. */
export const CONDITIONS = {
  none: { label: 'No context', mcp: false, agentsMd: false, llmsTxt: false },
  agents: { label: 'AGENTS.md only', mcp: false, agentsMd: true, llmsTxt: false },
  llms: { label: 'llms.txt only', mcp: false, agentsMd: false, llmsTxt: true },
  mcp: { label: 'MCP + AGENTS.md', mcp: true, agentsMd: true, llmsTxt: false },
};

/** Built-in tools every run gets. No Bash: a run writes code, it doesn't run it. The scorer does that. */
export const TOOLS = ['Read', 'Write', 'Edit', 'Glob', 'Grep'];

export const flag = (name, fallback) => {
  const i = process.argv.indexOf(`--${name}`);
  if (i === -1) return fallback;
  const v = process.argv[i + 1];
  return v === undefined || v.startsWith('--') ? true : v;
};
export const list = (v) => (typeof v === 'string' ? v.split(',').map((s) => s.trim()).filter(Boolean) : []);

/** Prompts: one Markdown file each, with a small front matter block (id, title, tags, tenant, locale). */
export function readPrompts() {
  const dir = path.join(EVALS, 'prompts');
  return readdirSync(dir)
    .filter((f) => f.endsWith('.md'))
    .sort()
    .map((f) => {
      const text = readFileSync(path.join(dir, f), 'utf8');
      const m = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/.exec(text);
      if (!m) throw new Error(`${f}: missing front matter`);
      const meta = Object.fromEntries(
        m[1].split('\n').filter(Boolean).map((line) => {
          const i = line.indexOf(':');
          return [line.slice(0, i).trim(), line.slice(i + 1).trim()];
        }),
      );
      const id = f.replace(/\.md$/, '');
      if (meta.id !== id) throw new Error(`${f}: id "${meta.id}" must equal the file name`);
      return { id, title: meta.title, tags: list(meta.tags), tenants: list(meta.tenants || 'vela'), locale: meta.locale || 'en-IN', body: m[2].trim() };
    });
}

export function git(...args) {
  return execFileSync('git', args, { cwd: REPO, encoding: 'utf8' }).trim();
}

/** The commit the packages were packed from, and whether the tree had uncommitted changes in them. */
export function sourceState() {
  const commit = git('rev-parse', 'HEAD');
  const dirty = git('status', '--porcelain', '--', 'packages/react', 'packages/icons', 'packages/tokens', 'packages/theme-engine', 'packages/mcp', 'packages/audit', 'tenants', 'AGENTS.md').split('\n').filter(Boolean);
  return { commit, dirty };
}

export function readJson(file, fallback) {
  return existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : fallback;
}

/** Floors to `digits` decimals. Scores and rates are never rounded up. */
export const floor = (n, digits = 1) => Math.floor(n * 10 ** digits + 1e-9) / 10 ** digits;

export function median(values) {
  const s = [...values].sort((a, b) => a - b);
  if (s.length === 0) return NaN;
  return s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2;
}

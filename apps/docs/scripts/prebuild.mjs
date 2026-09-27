#!/usr/bin/env node
/**
 * Runs before `next build`: gen-examples, the example map previews load from.
 * The registry is no longer built into the site (ADR-011, 2026-09-27).
 * Plain Node, no shell syntax, so it runs the same on macOS, Linux and Windows. Exits non-zero if the step fails.
 */
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const docsRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function run(label, command, args, env = process.env) {
  const result = spawnSync(command, args, { stdio: 'inherit', env, shell: process.platform === 'win32' && command === 'pnpm' });
  if (result.status !== 0) {
    console.error(`prebuild: ${label} failed${result.error ? ` (${result.error.message})` : ''}`);
    process.exit(result.status ?? 1);
  }
}

run('gen-examples', process.execPath, [path.join(docsRoot, 'scripts', 'gen-examples.mjs')]);


#!/usr/bin/env node
/**
 * Runs before `next build`:
 *   1. gen-examples — the example map previews load from;
 *   2. the registry (root `pnpm registry`) — rebuilt for the origin this build will be served from, because
 *      registry item URLs are absolute: STRATA_REGISTRY_URL = NEXT_PUBLIC_SITE_URL (default http://localhost:3000).
 * Plain Node, no shell syntax, so it runs the same on macOS, Linux and Windows. Exits non-zero if either step fails.
 */
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const docsRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = path.resolve(docsRoot, '..', '..');
const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/+$/, '');

function run(label, command, args, env = process.env) {
  const result = spawnSync(command, args, { stdio: 'inherit', env, shell: process.platform === 'win32' && command === 'pnpm' });
  if (result.status !== 0) {
    console.error(`prebuild: ${label} failed${result.error ? ` (${result.error.message})` : ''}`);
    process.exit(result.status ?? 1);
  }
}

run('gen-examples', process.execPath, [path.join(docsRoot, 'scripts', 'gen-examples.mjs')]);

// Prefer the pnpm that launched us (npm_execpath points at its JS entry); fall back to pnpm on PATH.
const pnpm = process.env.npm_execpath;
const [cmd, pre] = pnpm && /\.(c?js|mjs)$/.test(pnpm) ? [process.execPath, [pnpm]] : ['pnpm', []];
console.log(`prebuild: registry for ${siteUrl}`);
run('registry', cmd, [...pre, '--dir', repoRoot, 'registry'], { ...process.env, STRATA_REGISTRY_URL: siteUrl });

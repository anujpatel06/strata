/**
 * Builds every tenant's tokens from tenants/<id>/brand.json.
 *
 *   pnpm --filter @strata/tokens build      (or `pnpm tokens` from the repo root)
 *
 * dist/
 *   strata.css                  every tenant, scoped to [data-strata-theme="<id>"]
 *   manifest.json               { tenants: [{ id, name, summary }] }
 *   <id>/tokens.css             this tenant on :root
 *   <id>/<id>.tokens.json       W3C DTCG 2025.10
 *   <id>/figma/*.tokens.json    Figma-variables import: Brand.<Name>, Semantic.{Light,Dark}, Density.*, Shape.<Name>, Type.<Name>
 *   <id>/figma-starter/*.tokens.json  the same for Figma Starter (one mode per collection): "<Name> · Light|Dark|Size|Size <other>".Value
 *   <id>/contrast-report.json   every contrast check + every solver adjustment
 *
 * Options: --tenants <dir> (default <repo>/tenants), --out <dir> (default packages/tokens/dist).
 * Exits 1 if any contrast check fails, a brand.json is invalid, the DTCG token count
 * disagrees with the engine's summary, or the Figma Semantic files differ between tenants.
 */
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { performance } from 'node:perf_hooks';
import { fileURLToPath } from 'node:url';
import { generateTheme, toCSS, toDTCG, toFigmaFiles } from '@strata/theme-engine';
import type { BrandInput, Theme } from '@strata/theme-engine';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '../../..');

/** Optional overrides (e.g. for a throwaway tenant in a test): --tenants <dir> --out <dir>. */
function flag(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 ? process.argv[i + 1] : undefined;
}
const tenantsDir = resolve(flag('tenants') ?? join(repoRoot, 'tenants'));
const distDir = resolve(flag('out') ?? resolve(here, '../dist'));

const json = (value: unknown): string => JSON.stringify(value, null, 2) + '\n';

/** Leaf tokens (objects with "$value") — mirrors countLeafTokens in the engine's DTCG exporter. */
function countLeaves(node: unknown): number {
  if (node === null || typeof node !== 'object' || Array.isArray(node)) return 0;
  if ('$value' in node) return 1;
  return Object.entries(node).reduce((n, [k, v]) => (k.startsWith('$') ? n : n + countLeaves(v)), 0);
}

function write(path: string, content: string): void {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, content);
}

interface Built {
  id: string;
  theme: Theme;
  tokens: number;
  /** Semantic.*.tokens.json content minus $description — must match across tenants (one shared Figma collection). */
  semantic: string;
}

const withoutDescriptions = (v: unknown): unknown =>
  Array.isArray(v)
    ? v.map(withoutDescriptions)
    : v && typeof v === 'object'
      ? Object.fromEntries(Object.entries(v).filter(([k]) => k !== '$description').map(([k, x]) => [k, withoutDescriptions(x)]))
      : v;

function findTenants(): string[] {
  if (!existsSync(tenantsDir)) return [];
  return readdirSync(tenantsDir, { withFileTypes: true })
    .filter((d) => d.isDirectory() && existsSync(join(tenantsDir, d.name, 'brand.json')))
    .map((d) => d.name)
    .sort();
}

function buildTenant(id: string): Built {
  const input = JSON.parse(readFileSync(join(tenantsDir, id, 'brand.json'), 'utf8')) as BrandInput;
  const theme = generateTheme(input);
  const out = join(distDir, id);

  const dtcg = toDTCG(theme);
  write(join(out, 'tokens.css'), toCSS(theme, { selector: ':root' }));
  write(join(out, `${id}.tokens.json`), json(dtcg));
  const figma = toFigmaFiles(theme);
  for (const [file, doc] of Object.entries(figma)) write(join(out, 'figma', file), json(doc));
  for (const [file, doc] of Object.entries(toFigmaFiles(theme, { modes: 'single' }))) write(join(out, 'figma-starter', file), json(doc));
  const semantic = JSON.stringify(
    Object.keys(figma)
      .filter((f) => f.startsWith('Semantic.'))
      .sort()
      .map((f) => withoutDescriptions(figma[f])),
  );
  write(
    join(out, 'contrast-report.json'),
    json({
      tenant: id,
      name: theme.input.name,
      input: theme.input,
      summary: {
        checks: theme.summary.checks,
        passed: theme.summary.passed,
        failed: theme.summary.failed,
        adjustments: theme.summary.adjustments,
      },
      checks: theme.checks,
      adjustments: theme.adjustments,
    }),
  );
  return { id, theme, tokens: countLeaves(dtcg), semantic };
}

function table(rows: string[][]): string {
  const widths = rows[0]!.map((_, c) => Math.max(...rows.map((r) => r[c]!.length)));
  const line = (r: string[]) => r.map((cell, c) => (c === 0 ? cell.padEnd(widths[c]!) : cell.padStart(widths[c]!))).join('  ');
  return [line(rows[0]!), widths.map((w) => '-'.repeat(w)).join('  '), ...rows.slice(1).map(line)].join('\n');
}

function main(): number {
  const started = performance.now();
  const ids = findTenants();
  if (ids.length === 0) {
    console.error(`No tenants found: expected ${relative(repoRoot, tenantsDir)}/<id>/brand.json`);
    return 1;
  }

  // Start clean — but only wipe a custom --out dir if it already holds a previous build.
  if (!flag('out') || existsSync(join(distDir, 'manifest.json'))) rmSync(distDir, { recursive: true, force: true });
  const built: Built[] = [];
  const errors: string[] = [];
  for (const id of ids) {
    try {
      built.push(buildTenant(id));
    } catch (err) {
      errors.push(`${id}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  write(
    join(distDir, 'strata.css'),
    [
      `/* Strata — all tenants (${built.map((b) => b.id).join(', ')}). Generated by \`pnpm --filter @strata/tokens build\`. Do not edit by hand.\n` +
        `   Usage: <html data-strata-theme="<id>" data-strata-scheme="light|dark|auto" data-strata-density="comfortable|compact"> */`,
      ...built.map((b) => toCSS(b.theme, { selector: `[data-strata-theme="${b.id}"]` })),
    ].join('\n\n'),
  );
  write(
    join(distDir, 'manifest.json'),
    json({ tenants: built.map((b) => ({ id: b.id, name: b.theme.input.name, summary: b.theme.summary })) }),
  );

  const rows = [['tenant', 'checks passed', 'adjustments', 'tokens', 'ms']];
  for (const { id, theme, tokens } of built) {
    const s = theme.summary;
    rows.push([id, `${s.passed}/${s.checks}`, String(s.adjustments), String(tokens), s.generationMs.toFixed(1)]);
    const failed = theme.checks.filter((c) => !c.pass);
    for (const c of failed) {
      errors.push(`${id}: ${c.scheme} ${c.fg} on ${c.bg} = ${c.ratio.toFixed(2)}:1 (needs ${c.required}:1)`);
    }
    if (s.failed !== failed.length) errors.push(`${id}: summary.failed=${s.failed} but ${failed.length} checks fail`);
    if (tokens !== s.tokenCount) errors.push(`${id}: DTCG export has ${tokens} tokens but summary.tokenCount=${s.tokenCount}`);
  }
  const odd = built.filter((b) => b.semantic !== built[0]?.semantic).map((b) => b.id);
  if (odd.length) errors.push(`Figma Semantic files differ between ${built[0]?.id} and ${odd.join(', ')} — they must be shared`);
  console.log(table(rows));
  const shown = distDir.startsWith(repoRoot) ? relative(repoRoot, distDir) : distDir;
  console.log(`\n${built.length} tenant(s) → ${shown} in ${(performance.now() - started).toFixed(0)} ms`);

  if (errors.length) {
    console.error(`\n✗ ${errors.length} problem(s):\n  ${errors.join('\n  ')}`);
    return 1;
  }
  return 0;
}

process.exitCode = main();

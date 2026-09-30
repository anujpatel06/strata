#!/usr/bin/env node
/**
 * The README's "Tests passing" row must match what `pnpm test` reports, package for package.
 *
 *   node scripts/check-test-counts.mjs                  run `pnpm -r test`, then check the row against it
 *   node scripts/check-test-counts.mjs --from FILE       check against saved `pnpm test` output (CI runs the
 *                                                        suite once and pipes it to a file)
 *   node scripts/check-test-counts.mjs --from -          the same, reading stdin
 *   node scripts/check-test-counts.mjs --fix             rewrite the row with the measured numbers
 *
 * Why: the row inside the `numbers:` markers is maintained by hand — the table has no generator, and each row
 * carries the command that reproduces it. Its parts and their total then live in two places that nothing compares.
 * On 2026-09-30 the row read `468 components · 301 engine · 245 icons · …` (1,439) while the suite had been at
 * 2,167 for weeks, and `docs/log.md` had recorded 2,167 correctly in the meantime. Nobody was wrong at the moment
 * they wrote it; the row just went stale between sessions, which is what the "No invented metrics" rule in
 * CLAUDE.md is there to stop.
 *
 * What it checks:
 *   1. every package whose tests ran appears in the row, and every part of the row names a package that ran;
 *   2. each part equals that package's passing count;
 *   3. the parts sum to the suite's total, which is the number `docs/log.md` quotes.
 * `pnpm` prints no grand total, so the total here is the sum of the per-package counts — the same sum a person
 * does by hand. Check 3 is therefore implied by 1 and 2; it is reported because it is the number that gets quoted.
 *
 * `--fix` writes the counts and nothing else. In particular it does not touch the "Measured" date under the table:
 * that date covers every row, and only a run of every row's command earns it.
 */
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const README = path.join(ROOT, 'README.md');
const argv = process.argv.slice(2);
const fix = argv.includes('--fix');
const fromArg = argv.includes('--from') ? argv[argv.indexOf('--from') + 1] : null;

/**
 * The row's words for each package. A package that runs tests and is missing here is a finding, not a default, so
 * adding a tested package means deciding what the README calls it.
 */
const LABELS = {
  'packages/react': 'components',
  'packages/theme-engine': 'engine',
  'packages/icons': 'icons',
  'packages/mcp': 'MCP server',
  'packages/sdui': 'schema',
  'packages/audit': 'auditor',
  'packages/codemods': 'codemods',
};

const fail = (msg) => {
  console.error(msg);
  process.exit(1);
};
// Two packages sharing a label would make one of them disappear from the comparison instead of failing it.
const dupes = Object.values(LABELS).filter((l, i, all) => all.indexOf(l) !== i);
if (dupes.length) fail(`LABELS gives more than one package the same name: ${[...new Set(dupes)].join(', ')}.`);
const n = (x) => x.toLocaleString('en-US');

/** `pnpm -r test`, streamed so a local run still shows the suite, and captured so it can be parsed. */
async function runSuite() {
  console.log('$ pnpm -r test\n');
  const child = spawn('pnpm', ['-r', 'test'], { cwd: ROOT, stdio: ['ignore', 'pipe', 'pipe'] });
  let out = '';
  for (const stream of [child.stdout, child.stderr]) {
    stream.setEncoding('utf8');
    stream.on('data', (c) => {
      out += c;
      process.stdout.write(c);
    });
  }
  const code = await new Promise((res, rej) => {
    child.on('error', rej);
    child.on('close', res);
  });
  if (code !== 0) fail(`\n\`pnpm -r test\` exited ${code}. Fix the suite before checking the README against it.`);
  console.log();
  return out;
}

/**
 * Per-package counts from `pnpm -r test` output. pnpm prefixes every line with the workspace directory
 * (`packages/react test:`), and vitest's summary reads `Tests  474 passed (474)`, or
 * `Tests  309 passed | 1 skipped (310)`, or `Tests  2 failed | 470 passed (472)`.
 */
function parseSuite(text) {
  const counts = new Map();
  for (const raw of text.replace(/\u001b\[[0-9;]*m/g, '').split('\n')) {
    const m = /^\s*(?:(\S+)\s+test:)?\s*Tests\s+([^(]+)\((\d+)\)\s*$/.exec(raw);
    if (!m) continue;
    const [, prefix, tail] = m;
    if (!prefix) {
      fail(
        'That output has no per-package prefixes, so its counts cannot be attributed.\n' +
          'It came from one package (`pnpm --filter … test`). Use the whole suite: `pnpm test`.',
      );
    }
    const states = Object.fromEntries([...tail.matchAll(/(\d+)\s+(passed|failed|skipped|todo)/g)].map((s) => [s[2], Number(s[1])]));
    if (states.failed) fail(`${prefix}: ${states.failed} test(s) failed. Fix the suite before checking the README against it.`);
    if (counts.has(prefix)) fail(`${prefix} reported its test count twice, so the output is not one run of the suite.`);
    counts.set(prefix, states.passed ?? 0);
  }
  if (counts.size === 0) {
    fail('No `Tests … passed` line in that output, so nothing was measured. Expected the output of `pnpm test`.');
  }
  return counts;
}

/** Workspace directories with a `test` script — the set the row has to account for. */
function tested() {
  const dirs = [];
  for (const group of ['packages', 'apps']) {
    for (const name of readdirSync(path.join(ROOT, group))) {
      const dir = `${group}/${name}`;
      let pkg;
      try {
        pkg = JSON.parse(readFileSync(path.join(ROOT, dir, 'package.json'), 'utf8'));
      } catch {
        continue;
      }
      if (pkg.scripts?.test) dirs.push(dir);
    }
  }
  return dirs;
}

/** The "Tests passing" row inside the `numbers:` markers, and its parts in the order the README lists them. */
function readRow() {
  const readme = readFileSync(README, 'utf8');
  const block = /<!-- numbers:start -->([\s\S]*?)<!-- numbers:end -->/.exec(readme);
  if (!block) fail('README.md has no <!-- numbers:start --> … <!-- numbers:end --> block.');
  const row = /^\|\s*Tests passing\s*\|([^|]*)\|([^|]*)\|\s*$/m.exec(block[1]);
  if (!row) fail('No "| Tests passing |" row inside the numbers block of README.md.');
  const parts = row[1]
    .trim()
    .split('·')
    .map((part) => {
      const m = /^\s*([\d,]+)\s+(.+?)\s*$/.exec(part);
      if (!m) fail(`Cannot read "${part.trim()}" in the Tests passing row. Expected "<count> <label>".`);
      return { count: Number(m[1].replace(/,/g, '')), label: m[2] };
    });
  return { readme, line: row[0], parts };
}

const text = fromArg ? readFileSync(fromArg === '-' ? 0 : fromArg, 'utf8') : await runSuite();
const measured = parseSuite(text);
const { readme, line, parts } = readRow();

// Every package that ran must have a label, and every label must belong to a package that ran.
//
// A problem is either a stale count, which `--fix` can write, or a decision about what the row should name, which
// it must not guess at. Which one it is is recorded here rather than read back out of the message: the labels have
// spaces in them ("MCP server"), so matching the wording is one label away from being wrong.
const problems = [];
const decision = (msg) => problems.push({ msg, fixable: false });
const staleCount = (msg) => problems.push({ msg, fixable: true });
const byLabel = new Map();
for (const [dir, count] of measured) {
  const label = LABELS[dir];
  if (!label) {
    decision(
      `${dir} runs tests (${n(count)} passing) but has no label in check-test-counts.mjs, so the README cannot ` +
        `account for it. Decide what the row calls it and add it to LABELS.`,
    );
    continue;
  }
  byLabel.set(label, { dir, count });
}
for (const dir of tested()) {
  if (!measured.has(dir)) decision(`${dir} has a \`test\` script but reported no count in that output.`);
}
const inRow = new Set(parts.map((p) => p.label));
for (const [label, { dir, count }] of byLabel) {
  if (!inRow.has(label)) decision(`The row has no "${label}" part, so ${dir}'s ${n(count)} passing tests are missing from it.`);
}

// Each part against its package.
const rows = [];
for (const { label, count } of parts) {
  const hit = byLabel.get(label);
  if (!hit) {
    decision(`The row's "${label}" part names nothing that ran. Labels that ran: ${[...byLabel.keys()].join(', ')}.`);
    continue;
  }
  if (hit.count !== count) staleCount(`${label}: the row says ${n(count)}, ${hit.dir} reports ${n(hit.count)}.`);
  rows.push({ label, dir: hit.dir, readme: count, measured: hit.count });
}

const suiteTotal = [...measured.values()].reduce((a, b) => a + b, 0);
const rowTotal = parts.reduce((a, p) => a + p.count, 0);
if (rowTotal !== suiteTotal) staleCount(`The row's parts sum to ${n(rowTotal)}; the suite reports ${n(suiteTotal)} passing.`);

const width = Math.max(...rows.map((r) => r.label.length), 5);
console.log(`${'part'.padEnd(width)}  ${'package'.padEnd(21)}  ${'README'.padStart(7)}  ${'pnpm test'.padStart(9)}`);
for (const r of rows) {
  const flag = r.readme === r.measured ? '' : '  ←';
  console.log(`${r.label.padEnd(width)}  ${r.dir.padEnd(21)}  ${n(r.readme).padStart(7)}  ${n(r.measured).padStart(9)}${flag}`);
}
console.log(`${'total'.padEnd(width)}  ${''.padEnd(21)}  ${n(rowTotal).padStart(7)}  ${n(suiteTotal).padStart(9)}${rowTotal === suiteTotal ? '' : '  ←'}`);

if (problems.length === 0) {
  console.log(`\nThe README's "Tests passing" row matches the suite: ${n(suiteTotal)} passing across ${measured.size} packages.`);
  process.exit(0);
}

console.log();
for (const p of problems) console.log(`- ${p.msg}`);

// Only counts can be rewritten. A label that names no package, or a package with no label, is a decision.
const rewritable = problems.every((p) => p.fixable);
if (fix && rewritable) {
  const value = parts.map(({ label }) => `${n(byLabel.get(label).count)} ${label}`).join(' · ');
  const next = line.replace(/^(\|\s*Tests passing\s*\|)[^|]*(\|)/, `$1 ${value} $2`);
  writeFileSync(README, readme.replace(line, next));
  console.log(`\nREADME.md updated: ${value}`);
  console.log(
    'The "Measured" date under the table was left alone: it covers every row, so re-run every row\'s command before moving it.',
  );
  process.exit(0);
}
if (fix) console.log('\nNot fixed: the findings above are decisions about what the row should name, not counts to rewrite.');
else console.log(`\nRun with --fix to write the measured counts${rewritable ? '' : ' once the findings above are settled'}.`);
process.exit(1);

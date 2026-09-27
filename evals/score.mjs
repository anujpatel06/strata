#!/usr/bin/env node
/**
 * Scores every run of an iteration. Calls no model, so it can be re-run at any time.
 *
 *   node evals/score.mjs [--iteration 1] [--only <prompt id>]
 *
 * For each run it rebuilds the app with the files the agent wrote, then records:
 *   built       Screen.tsx exists and is no longer the placeholder
 *   typecheck   TypeScript errors (an invented prop or component shows up here)
 *   audit       the drift auditor's score and findings, per rule (packages/audit)
 *   render      the app builds, mounts, shows content and logs no page error
 *   axe         WCAG A and AA violation nodes, light and dark
 *   rtl         for prompts tagged rtl: the same checks in Arabic, right to left
 *   overflow    horizontal scroll at 390px wide
 *   brandNames  a brand named in code, e.g. theme="vela" or tenant === 'qamar'
 * Writes score.json next to each result.json.
 */
import { execFile, execFileSync } from 'node:child_process';
import { cpSync, createReadStream, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, symlinkSync, writeFileSync } from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import { AxeBuilder } from '@axe-core/playwright';
import { launchBrowser } from '../scripts/launch-browser.mjs';
import { CACHE, INSTALLED, REPO, RUNS, flag, readJson, readPrompts } from './lib/common.mjs';

const run = promisify(execFile);
const iteration = String(flag('iteration', 1));
const only = flag('only', '');
const root = path.join(RUNS, `iter-${iteration}`);
const SOURCE_ROOT = readJson(path.join(CACHE, 'source.json'))?.root ?? REPO;
const prompts = new Map(readPrompts().map((p) => [p.id, p]));
const PLACEHOLDER = readFileSync(path.join(REPO, 'evals/template/src/screens/Screen.tsx'), 'utf8');
// A brand named in code: theme="vela", tenant === 'qamar', data-strata-theme="care". Plain words in copy don't count.
const TENANT_WORDS = /(theme|tenant|brand)[\w-]*\s*(?:===?|!==?|=|:)\s*\{?\s*["'`](vela|harbor|qamar|care|house)["'`]/gi;
const AXE_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

function runDirs(dir) {
  if (!existsSync(dir)) return [];
  if (existsSync(path.join(dir, 'result.json'))) return [dir];
  return readdirSync(dir).flatMap((f) => (statSync(path.join(dir, f)).isDirectory() ? runDirs(path.join(dir, f)) : []));
}

const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' };
function serve(dir) {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      const rel = decodeURIComponent(new URL(req.url, 'http://x').pathname);
      const file = path.join(dir, rel === '/' ? 'index.html' : rel);
      if (!file.startsWith(dir) || !existsSync(file) || statSync(file).isDirectory()) {
        res.writeHead(404).end();
        return;
      }
      res.writeHead(200, { 'content-type': TYPES[path.extname(file)] ?? 'application/octet-stream' });
      createReadStream(file).pipe(res);
    });
    server.listen(0, '127.0.0.1', () => resolve({ server, url: `http://localhost:${server.address().port}` }));
  });
}

async function view(browser, url, query, { scheme = 'light', width = 1280 } = {}) {
  const ctx = await browser.newContext({ colorScheme: scheme, viewport: { width, height: 900 }, reducedMotion: 'reduce' });
  await ctx.route('https://fonts.googleapis.com/**', (r) => r.fulfill({ status: 200, contentType: 'text/css', body: '' }));
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message.slice(0, 200)));
  const out = { query, scheme, width, pageErrors: errors, mounted: false, textLength: 0, overflowPx: 0, axeNodes: null, axeRules: {} };
  try {
    await page.goto(`${url}/?${query}&scheme=${scheme}`, { waitUntil: 'networkidle', timeout: 30_000 });
    const m = await page.evaluate(() => {
      const main = document.querySelector('main');
      return { mounted: !!main, text: (main?.innerText ?? '').trim().length, overflow: document.documentElement.scrollWidth - window.innerWidth };
    });
    out.mounted = m.mounted;
    out.textLength = m.text;
    out.overflowPx = Math.max(0, m.overflow);
    if (m.mounted && m.text > 0) {
      const res = await new AxeBuilder({ page }).withTags(AXE_TAGS).analyze();
      out.axeNodes = res.violations.reduce((n, v) => n + v.nodes.length, 0);
      for (const v of res.violations) out.axeRules[v.id] = v.nodes.length;
    }
  } catch (e) {
    errors.push(`load failed: ${String(e).slice(0, 160)}`);
  }
  await ctx.close();
  return out;
}

async function scoreRun(dir, browser) {
  const result = readJson(path.join(dir, 'result.json'));
  const prompt = prompts.get(result.prompt);
  const screens = path.join(dir, 'src/screens');
  const screenFile = path.join(screens, 'Screen.tsx');
  const score = { prompt: result.prompt, condition: result.condition, model: result.model, repeat: result.repeat, tags: result.tags, scoredAt: new Date().toISOString() };

  score.built = existsSync(screenFile) && readFileSync(screenFile, 'utf8').trim() !== PLACEHOLDER.trim();
  score.agentFailed = result.exitCode !== 0 || result.timedOut || result.cli?.isError === true;
  score.editedProtectedFiles = result.editedProtectedFiles ?? [];
  // A run that read outside its workspace and the installed packages can't be compared with the others.
  score.contaminated = (result.pathsOutsideWorkspace ?? []).length > 0;
  score.touchedRepo = result.touchedRepo === true;
  score.toolCalls = result.toolCalls ?? {};
  if (!score.built) {
    Object.assign(score, { typeErrors: null, audit: null, builds: false, views: [], brandNames: 0, onSystem: false, renders: false });
    writeFileSync(path.join(dir, 'score.json'), JSON.stringify(score, null, 2) + '\n');
    return score;
  }

  // A scoring workspace: the installed template plus the agent's files.
  const ws = path.join(os.tmpdir(), 'strata-evals-score', path.relative(RUNS, dir).replaceAll(path.sep, '__'));
  rmSync(ws, { recursive: true, force: true });
  mkdirSync(ws, { recursive: true });
  for (const f of readdirSync(INSTALLED)) if (f !== 'node_modules' && f !== 'pnpm-lock.yaml') cpSync(path.join(INSTALLED, f), path.join(ws, f), { recursive: true });
  symlinkSync(path.join(INSTALLED, 'node_modules'), path.join(ws, 'node_modules'), 'dir');
  rmSync(path.join(ws, 'src/screens'), { recursive: true, force: true });
  cpSync(screens, path.join(ws, 'src/screens'), { recursive: true });

  const sources = readdirSync(screens, { recursive: true }).map(String).filter((f) => /\.(tsx?|css)$/.test(f));
  score.files = sources.length;
  score.lines = sources.reduce((n, f) => n + readFileSync(path.join(screens, f), 'utf8').split('\n').length, 0);
  score.brandNames = sources.reduce((n, f) => n + (readFileSync(path.join(screens, f), 'utf8').match(TENANT_WORDS)?.length ?? 0), 0);

  try {
    await run(path.join(ws, 'node_modules/.bin/tsc'), ['-p', 'tsconfig.json', '--noEmit', '--pretty', 'false'], { cwd: ws });
    score.typeErrors = 0;
  } catch (e) {
    const lines = String(e.stdout ?? '').split('\n').filter((l) => /error TS\d+/.test(l));
    score.typeErrors = lines.length || null;
    score.typeErrorSample = lines.slice(0, 5).map((l) => l.slice(0, 240));
  }

  try {
    // The auditor from the same source the packages were built from, so its component list matches them.
    const out = execFileSync('node', [path.join(SOURCE_ROOT, 'packages/audit/bin/cli.mjs'), path.join(ws, 'src/screens'), '--format', 'json'], { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024, cwd: SOURCE_ROOT });
    const audit = JSON.parse(out);
    const byRule = {};
    for (const f of audit.findings) byRule[f.rule] = (byRule[f.rule] ?? 0) + 1;
    score.audit = { score: audit.score, findings: audit.findings.length, opportunities: audit.stats.opportunities, byRule };
  } catch (e) {
    score.audit = null;
    score.auditError = String(e.stderr ?? e).slice(0, 400);
  }

  score.views = [];
  try {
    await run(path.join(ws, 'node_modules/.bin/vite'), ['build', '--logLevel', 'error'], { cwd: ws });
    score.builds = true;
  } catch (e) {
    score.builds = false;
    score.buildError = String(e.stderr ?? e).slice(0, 600);
  }
  if (score.builds) {
    const { server, url } = await serve(path.join(ws, 'dist'));
    const tenant = prompt?.tenants[0] ?? 'vela';
    const ltr = `tenant=${tenant}&locale=${prompt?.locale?.startsWith('ar') ? 'en-IN' : (prompt?.locale ?? 'en-IN')}`;
    score.views.push({ name: 'light', ...(await view(browser, url, ltr)) });
    score.views.push({ name: 'dark', ...(await view(browser, url, ltr, { scheme: 'dark' })) });
    score.views.push({ name: 'narrow', ...(await view(browser, url, ltr, { width: 390 })) });
    if (result.tags.includes('rtl')) score.views.push({ name: 'rtl', ...(await view(browser, url, 'tenant=qamar&locale=ar-AE')) });
    if (result.tags.includes('multi-brand')) for (const t of prompt.tenants.slice(1)) score.views.push({ name: `brand:${t}`, ...(await view(browser, url, `tenant=${t}&locale=en-IN`)) });
    server.close();
  }
  rmSync(ws, { recursive: true, force: true });

  score.renders = score.builds && score.views.length > 0 && score.views.every((v) => v.mounted && v.textLength > 0 && v.pageErrors.length === 0);
  const axe = score.views.filter((v) => v.axeNodes !== null);
  // Worst view, not the sum: the same node fails in light and dark, and counting it twice would overstate it.
  score.axeNodes = axe.length ? Math.max(...axe.map((v) => v.axeNodes)) : null;
  score.overflowPx = score.views.find((v) => v.name === 'narrow')?.overflowPx ?? null;
  score.onSystem = score.audit !== null && score.audit.findings === 0 && score.typeErrors === 0 && score.renders && score.brandNames === 0;
  writeFileSync(path.join(dir, 'score.json'), JSON.stringify(score, null, 2) + '\n');
  return score;
}

const dirs = runDirs(root).filter((d) => !only || d.includes(`${path.sep}${only}${path.sep}`));
if (dirs.length === 0) throw new Error(`No runs under ${root}`);
const browser = await launchBrowser();
let done = 0;
for (const dir of dirs) {
  const s = await scoreRun(dir, browser);
  done++;
  console.log(`${String(done).padStart(3)}/${dirs.length}  ${s.prompt} · ${s.condition} · #${s.repeat}  built ${s.built}  audit ${s.audit?.score ?? '—'}  types ${s.typeErrors ?? '—'}  axe ${s.axeNodes ?? '—'}  renders ${s.renders}`);
}
await browser.close();
console.log(`Scored ${done} run(s). Report with: node evals/report.mjs --iteration ${iteration}`);

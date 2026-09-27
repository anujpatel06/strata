#!/usr/bin/env node
/**
 * pnpm screenshots — Playwright screenshots of the Brand Generator + axe report.
 *
 *   pnpm screenshots                 build generator, serve it, shoot, run axe
 *   pnpm screenshots --no-build      reuse apps/generator/dist
 *   pnpm screenshots --strict        exit 1 if axe finds violations
 *   pnpm screenshots --url=<base>    shoot a running server instead (e.g. pnpm dev)
 *   pnpm screenshots --out=<dir>     output dir (default docs/screenshots/phase-1)
 *
 * Env: PLAYWRIGHT_CHROMIUM_PATH — use this Chromium binary instead of Playwright's.
 */
import { spawn, spawnSync } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import net from 'node:net';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { launchBrowser } from './launch-browser.mjs';
import { AxeBuilder } from '@axe-core/playwright';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const TENANTS = ['vela', 'harbor', 'qamar'];
const SCHEMES = ['light', 'dark'];
const DESKTOP = { width: 1440, height: 960 };
const MOBILE = { width: 390, height: 844 };
const AXE_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];
const IS_WIN = process.platform === 'win32';
const PNPM = IS_WIN ? 'pnpm.cmd' : 'pnpm';

const args = process.argv.slice(2);
const flag = (name) => args.includes(`--${name}`);
const option = (name) => args.find((a) => a.startsWith(`--${name}=`))?.split('=').slice(1).join('=');
const STRICT = flag('strict');
const EXTERNAL_URL = option('url');
const BUILD = !flag('no-build') && !EXTERNAL_URL;
const OUT_DIR = path.resolve(ROOT, option('out') ?? 'docs/screenshots/phase-1');

/** @type {import('node:child_process').ChildProcess | null} */
let server = null;
let serverLog = '';

function stopServer() {
  if (!server || server.exitCode !== null || server.signalCode !== null) return;
  try {
    if (IS_WIN) spawnSync('taskkill', ['/pid', String(server.pid), '/T', '/F']);
    else process.kill(-server.pid, 'SIGTERM'); // whole group: pnpm → vite
  } catch {
    /* already gone */
  }
}
process.on('exit', stopServer);
for (const sig of ['SIGINT', 'SIGTERM']) {
  process.on(sig, () => {
    stopServer();
    process.exit(130);
  });
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function freePort() {
  return new Promise((resolve, reject) => {
    const srv = net.createServer();
    srv.unref();
    srv.on('error', reject);
    srv.listen(0, '127.0.0.1', () => {
      const { port } = /** @type {net.AddressInfo} */ (srv.address());
      srv.close(() => resolve(port));
    });
  });
}

function build() {
  console.log('› Building @strata/generator');
  const res = spawnSync(PNPM, ['--filter', '@strata/generator', 'build'], {
    cwd: ROOT,
    stdio: 'inherit',
    shell: IS_WIN,
  });
  if (res.status !== 0) throw new Error(`Generator build failed (exit ${res.status ?? res.signal}).`);
}

async function startPreview() {
  const port = await freePort();
  const base = `http://127.0.0.1:${port}`;
  console.log(`› Starting vite preview on ${base}`);
  server = spawn(
    PNPM,
    ['--filter', '@strata/generator', 'preview', '--host', '127.0.0.1', '--port', String(port), '--strictPort'],
    { cwd: ROOT, stdio: ['ignore', 'pipe', 'pipe'], detached: !IS_WIN, shell: IS_WIN },
  );
  const collect = (chunk) => {
    serverLog = (serverLog + chunk).slice(-4000);
  };
  server.stdout.on('data', collect);
  server.stderr.on('data', collect);

  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    if (server.exitCode !== null || server.signalCode !== null) {
      throw new Error(
        `vite preview exited (${server.exitCode ?? server.signalCode}). ${BUILD ? '' : 'Run without --no-build? '}\n${serverLog}`,
      );
    }
    try {
      const res = await fetch(base);
      if (res.ok) return base;
    } catch {
      /* not up yet */
    }
    await sleep(250);
  }
  throw new Error(`vite preview did not respond within 30s.\n${serverLog}`);
}

/** Load a page and wait until fonts and network have settled. */
async function load(page, url) {
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.evaluate(async () => {
    await document.fonts.ready;
  });
  await page.waitForLoadState('networkidle');
  // Two frames so layout that depends on font metrics has painted.
  await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
}

/**
 * Offline font mode (CI / sandboxes that can't reach Google Fonts): set
 *   STRATA_LOCAL_FONTS=<a node_modules dir containing @fontsource/* packages>
 * and Google Fonts requests are answered from those packages instead, so screenshots use the
 * real typefaces (including Arabic) rather than system fallbacks. No repo dependency needed.
 */
const LOCAL_FONTS = process.env.STRATA_LOCAL_FONTS ? path.resolve(process.env.STRATA_LOCAL_FONTS) : null;
const LOCAL_FONT_BASE = 'https://fonts.gstatic.com/strata-local';

async function serveFontsLocally(context) {
  const { readFile } = await import('node:fs/promises');
  await context.route('https://fonts.googleapis.com/**', async (route) => {
    const url = new URL(route.request().url());
    let css = '';
    for (const family of url.searchParams.getAll('family')) {
      const [name, axes = ''] = family.split(':');
      const slug = name.trim().toLowerCase().replace(/\s+/g, '-');
      const weights = axes.includes('@') ? axes.split('@')[1].split(';') : ['400'];
      for (const weight of weights) {
        try {
          const face = await readFile(path.join(LOCAL_FONTS, '@fontsource', slug, `${weight}.css`), 'utf8');
          css += face.replaceAll('url(./files/', `url(${LOCAL_FONT_BASE}/${slug}/files/`) + '\n';
        } catch {
          /* family or weight not installed locally — the page falls back as it would offline */
        }
      }
    }
    await route.fulfill({ status: 200, contentType: 'text/css', body: css });
  });
  await context.route(`${LOCAL_FONT_BASE}/**`, async (route) => {
    const rel = new URL(route.request().url()).pathname.replace('/strata-local/', '');
    try {
      const body = await readFile(path.join(LOCAL_FONTS, '@fontsource', rel));
      await route.fulfill({ status: 200, contentType: rel.endsWith('.woff') ? 'font/woff' : 'font/woff2', body });
    } catch {
      await route.fulfill({ status: 404, body: '' });
    }
  });
}

/** One context per shot: viewport, colour scheme and reduced motion match the URL. */
async function openPage(browser, { viewport, scheme = 'light', mobile = false }) {
  const context = await browser.newContext({
    viewport,
    colorScheme: scheme,
    reducedMotion: 'reduce',
    isMobile: mobile,
    hasTouch: mobile,
  });
  if (LOCAL_FONTS) await serveFontsLocally(context);
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (err) => errors.push(err.message));
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  return { context, page, errors };
}

function summariseAxe(results) {
  return {
    violations: results.violations.map((v) => ({
      id: v.id,
      impact: v.impact,
      help: v.help,
      helpUrl: v.helpUrl,
      nodes: v.nodes.length,
      targets: v.nodes.slice(0, 10).map((n) => n.target.join(' ')),
    })),
    passes: results.passes.length,
    incomplete: results.incomplete.map((v) => ({ id: v.id, nodes: v.nodes.length })),
  };
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  if (BUILD) build();
  const base = EXTERNAL_URL ? EXTERNAL_URL.replace(/\/$/, '') : await startPreview();

  const browser = await launchBrowser();

  const shots = [];
  const axePages = [];
  const pageErrors = [];
  let axeVersion = null;

  const shoot = async ({ query, file, viewport = DESKTOP, scheme = 'light', mobile = false, axe = false }) => {
    const url = `${base}/?${query}`;
    const { context, page, errors } = await openPage(browser, { viewport, scheme, mobile });
    try {
      await load(page, url);
      const out = path.join(OUT_DIR, file);
      await page.screenshot({ path: out, fullPage: !mobile, animations: 'disabled' });
      shots.push(path.relative(ROOT, out));
      console.log(`  ✓ ${file}`);

      if (axe) {
        const results = await new AxeBuilder({ page }).withTags(AXE_TAGS).analyze();
        axeVersion ??= results.testEngine?.version ?? null;
        axePages.push({ page: file.replace(/\.png$/, ''), url: `/?${query}`, ...summariseAxe(results) });
      }
      if (errors.length) pageErrors.push({ page: file, errors });
    } finally {
      await context.close();
    }
  };

  try {
    console.log(`› Screenshots → ${path.relative(ROOT, OUT_DIR)}`);
    for (const tenant of TENANTS) {
      for (const scheme of SCHEMES) {
        await shoot({
          query: `tenant=${tenant}&scheme=${scheme}&tab=preview`,
          file: `${tenant}-${scheme}.png`,
          scheme,
          axe: true,
        });
      }
    }
    await shoot({ query: 'tenant=qamar&tab=accessibility', file: 'qamar-accessibility.png' });
    await shoot({ query: 'tenant=vela&tab=tokens', file: 'vela-tokens.png' });
    await shoot({ query: 'tenant=qamar', file: 'qamar-mobile.png', viewport: MOBILE, mobile: true });
  } finally {
    await browser.close();
    stopServer();
  }

  // ---- axe report ----
  const byRule = {};
  for (const p of axePages) {
    for (const v of p.violations) {
      byRule[v.id] ??= { impact: v.impact, help: v.help, pages: 0, nodes: 0 };
      byRule[v.id].pages += 1;
      byRule[v.id].nodes += v.nodes;
    }
  }
  const totalViolations = axePages.reduce((n, p) => n + p.violations.length, 0);
  const totalNodes = Object.values(byRule).reduce((n, r) => n + r.nodes, 0);
  const report = {
    generatedAt: new Date().toISOString(),
    command: 'pnpm screenshots',
    axeVersion,
    tags: AXE_TAGS,
    summary: { pagesScanned: axePages.length, totalViolations, totalNodes, byRule },
    pages: axePages,
    pageErrors,
  };
  const reportPath = path.join(OUT_DIR, 'axe-report.json');
  await writeFile(reportPath, JSON.stringify(report, null, 2) + '\n');

  console.log(`\n› ${shots.length} screenshots, axe on ${axePages.length} preview pages (${AXE_TAGS.join(', ')})`);
  for (const p of axePages) console.log(`  ${p.page.padEnd(14)} ${p.violations.length} violation(s)`);
  if (totalViolations === 0) {
    console.log('  axe: 0 violations');
  } else {
    console.log('\n  Violations by rule (pages · nodes):');
    for (const [id, r] of Object.entries(byRule).sort((a, b) => b[1].nodes - a[1].nodes)) {
      console.log(`  - ${id} [${r.impact}] ${r.pages} · ${r.nodes} — ${r.help}`);
    }
  }
  if (pageErrors.length) {
    console.warn(`\n  ⚠ Console/page errors on ${pageErrors.length} page(s) — see axe-report.json → pageErrors`);
  }
  console.log(`\n  Report: ${path.relative(ROOT, reportPath)}`);

  if (STRICT && totalViolations > 0) process.exitCode = 1;
}

main().catch((err) => {
  console.error(`\n✗ ${err instanceof Error ? err.message : err}`);
  stopServer();
  process.exitCode = 1;
});

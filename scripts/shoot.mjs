#!/usr/bin/env node
/**
 * One-off screenshot helper for agents and humans.
 *   node scripts/shoot.mjs <url> <out.png> [--width=1280] [--height=900] [--full] [--dark]
 * Env STRATA_LOCAL_FONTS=<node_modules dir with @fontsource/*> serves Google Fonts locally (offline sandboxes).
 * Prints console/page errors.
 */
import { chromium } from 'playwright';
import { launchBrowser } from './launch-browser.mjs';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

const [url, out, ...rest] = process.argv.slice(2);
if (!url || !out) { console.error('usage: node scripts/shoot.mjs <url> <out.png> [--width=] [--height=] [--full] [--dark]'); process.exit(2); }
const opt = (n, d) => Number(rest.find((a) => a.startsWith(`--${n}=`))?.split('=')[1] ?? d);
const FONTS = process.env.STRATA_LOCAL_FONTS;
const browser = await launchBrowser();
const context = await browser.newContext({ viewport: { width: opt('width', 1280), height: opt('height', 900) }, colorScheme: rest.includes('--dark') ? 'dark' : 'light', reducedMotion: 'reduce' });
if (FONTS) {
  const BASE = 'https://fonts.gstatic.com/strata-local';
  await context.route('https://fonts.googleapis.com/**', async (route) => {
    const u = new URL(route.request().url()); let css = '';
    for (const fam of u.searchParams.getAll('family')) {
      const [name, axes = ''] = fam.split(':'); const slug = name.trim().toLowerCase().replace(/\s+/g, '-');
      for (const w of axes.includes('@') ? axes.split('@')[1].split(';') : ['400']) {
        try { css += (await readFile(path.join(FONTS, '@fontsource', slug, `${w}.css`), 'utf8')).replaceAll('url(./files/', `url(${BASE}/${slug}/files/`); } catch {}
      }
    }
    await route.fulfill({ status: 200, contentType: 'text/css', body: css });
  });
  await context.route(`${BASE}/**`, async (route) => {
    const rel = new URL(route.request().url()).pathname.replace('/strata-local/', '');
    try { await route.fulfill({ status: 200, contentType: 'font/woff2', body: await readFile(path.join(FONTS, '@fontsource', rel)) }); } catch { await route.fulfill({ status: 404, body: '' }); }
  });
} else {
  await context.route('https://fonts.googleapis.com/**', (r) => r.fulfill({ status: 200, contentType: 'text/css', body: '' }));
}
const page = await context.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
await page.goto(url, { waitUntil: 'networkidle' });
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(300);
await page.screenshot({ path: out, fullPage: rest.includes('--full') });
await browser.close();
console.log(`saved ${out}${errors.length ? `\nerrors:\n- ${errors.join('\n- ')}` : ''}`);

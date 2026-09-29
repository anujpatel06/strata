#!/usr/bin/env node
/**
 * Before/after evidence for a change that can move pixels (ADR-030): snapshots, then a diff.
 *
 *   node scripts/compare-renders.mjs examples <dir> [--tenants=vela,harbor,care] [--components=tag,chip] [--width=1280]
 *       Every example of every component in the playground (apps/playground, SYNTARA_PLAYGROUND_URL, default
 *       http://127.0.0.1:5195), one PNG per example × tenant, light scheme, reduced motion, DPR 1.
 *   node scripts/compare-renders.mjs blocks <dir> [--tenants=…] [--widths=1440,390]
 *       Every block view (/blocks/<name>/view?tenant=<id>) of a running docs site (SYNTARA_BASE_URL, default
 *       http://localhost:3000): the page height in CSS px, and a full-page PNG.
 *   node scripts/compare-renders.mjs diff <before-dir> <after-dir>
 *       Which snapshots changed: size change, number of differing pixels and their bounding box. Exit 0 either way.
 *
 * A difference is any channel differing by more than 0. Snapshots are PNGs decoded here (no image dependencies).
 */
import { mkdirSync, readFileSync, readdirSync, writeFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { inflateSync } from 'node:zlib';
import { launchBrowser } from './launch-browser.mjs';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const [mode, a, b] = process.argv.slice(2).filter((x) => !x.startsWith('--'));
const option = (name) => process.argv.find((x) => x.startsWith(`--${name}=`))?.split('=').slice(1).join('=');

function decodePng(buf) {
  let pos = 8, width = 0, height = 0, colorType = 0;
  const idat = [];
  while (pos < buf.length) {
    const len = buf.readUInt32BE(pos);
    const type = buf.toString('ascii', pos + 4, pos + 8);
    const data = buf.subarray(pos + 8, pos + 8 + len);
    if (type === 'IHDR') (width = data.readUInt32BE(0)), (height = data.readUInt32BE(4)), (colorType = data[9]);
    else if (type === 'IDAT') idat.push(data);
    else if (type === 'IEND') break;
    pos += 12 + len;
  }
  const bpp = colorType === 6 ? 4 : 3;
  const raw = inflateSync(Buffer.concat(idat));
  const stride = width * bpp;
  const out = Buffer.alloc(width * height * 4);
  let prev = Buffer.alloc(stride);
  for (let y = 0; y < height; y++) {
    const f = raw[y * (stride + 1)];
    const line = Buffer.from(raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1)));
    for (let i = 0; i < stride; i++) {
      const l = i >= bpp ? line[i - bpp] : 0, u = prev[i], ul = i >= bpp ? prev[i - bpp] : 0;
      let v = line[i];
      if (f === 1) v += l;
      else if (f === 2) v += u;
      else if (f === 3) v += (l + u) >> 1;
      else if (f === 4) {
        const p = l + u - ul, pa = Math.abs(p - l), pb = Math.abs(p - u), pc = Math.abs(p - ul);
        v += pa <= pb && pa <= pc ? l : pb <= pc ? u : ul;
      }
      line[i] = v & 255;
    }
    for (let x = 0; x < width; x++) for (let c = 0; c < 3; c++) out[(y * width + x) * 4 + c] = line[x * bpp + c];
    prev = line;
  }
  return { width, height, data: out };
}

async function settle(page) {
  await page.evaluate(async () => {
    await document.fonts.ready;
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  });
  await page.waitForTimeout(250);
}

async function examples(dir) {
  const base = process.env.SYNTARA_PLAYGROUND_URL ?? 'http://127.0.0.1:5195';
  const tenants = (option('tenants') ?? 'vela,harbor,care').split(',');
  const width = Number(option('width') ?? 1280);
  const all = readdirSync(path.join(ROOT, 'apps/docs/examples')).sort();
  const components = option('components') ? option('components').split(',') : all;
  mkdirSync(dir, { recursive: true });
  const browser = await launchBrowser();
  const ctx = await browser.newContext({ viewport: { width, height: 900 }, deviceScaleFactor: 1, reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  const index = {};
  for (const tenant of tenants) for (const c of components) {
    await page.goto(`${base}/?c=${c}&tenant=${tenant}`, { waitUntil: 'networkidle' });
    await settle(page);
    const names = await page.$$eval('section[data-example]', (s) => s.map((e) => e.dataset.example));
    for (const name of names) {
      const el = page.locator(`section[data-example="${name}"]`);
      const file = `${tenant}__${c}__${name}.png`;
      await el.screenshot({ path: path.join(dir, file), animations: 'disabled' });
      index[file] = await el.evaluate((e) => e.getBoundingClientRect().height);
    }
  }
  writeFileSync(path.join(dir, 'index.json'), JSON.stringify(index, null, 1));
  await browser.close();
  console.log(`${Object.keys(index).length} example snapshots → ${dir}`);
}

async function blocks(dir) {
  const base = process.env.SYNTARA_BASE_URL ?? 'http://localhost:3000';
  const tenants = (option('tenants') ?? 'vela,harbor,qamar,care,haat,house').split(',');
  const widths = (option('widths') ?? '1440,390').split(',').map(Number);
  const names = JSON.parse(readFileSync(path.join(ROOT, 'apps/docs/blocks/blocks.json'), 'utf8')).map((x) => x.name);
  mkdirSync(dir, { recursive: true });
  const browser = await launchBrowser();
  const heights = {};
  for (const width of widths) {
    const ctx = await browser.newContext({ viewport: { width, height: 900 }, deviceScaleFactor: 1, reducedMotion: 'reduce' });
    const page = await ctx.newPage();
    for (const name of names) for (const tenant of tenants) {
      await page.goto(`${base}/blocks/${name}/view?tenant=${tenant}`, { waitUntil: 'networkidle' });
      await settle(page);
      const key = `${name}__${tenant}__${width}`;
      heights[key] = await page.evaluate(() => document.documentElement.scrollHeight);
      await page.screenshot({ path: path.join(dir, `${key}.png`), fullPage: true, animations: 'disabled' });
    }
    await ctx.close();
  }
  writeFileSync(path.join(dir, 'heights.json'), JSON.stringify(heights, null, 1));
  await browser.close();
  console.log(`${Object.keys(heights).length} block snapshots → ${dir}`);
}

function diff(before, after) {
  const files = readdirSync(before).filter((f) => f.endsWith('.png')).sort();
  let changed = 0;
  for (const f of files) {
    if (!existsSync(path.join(after, f))) {
      console.log(`MISSING  ${f}`);
      continue;
    }
    const A = decodePng(readFileSync(path.join(before, f)));
    const B = decodePng(readFileSync(path.join(after, f)));
    const w = Math.min(A.width, B.width), h = Math.min(A.height, B.height);
    let n = 0, x0 = Infinity, y0 = Infinity, x1 = -1, y1 = -1;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const oa = (y * A.width + x) * 4, ob = (y * B.width + x) * 4;
      if (A.data[oa] !== B.data[ob] || A.data[oa + 1] !== B.data[ob + 1] || A.data[oa + 2] !== B.data[ob + 2]) {
        n++;
        x0 = Math.min(x0, x), y0 = Math.min(y0, y), x1 = Math.max(x1, x), y1 = Math.max(y1, y);
      }
    }
    const sized = A.width !== B.width || A.height !== B.height;
    if (n || sized) {
      changed++;
      console.log(
        `CHANGED  ${f}  ${sized ? `${A.width}×${A.height} → ${B.width}×${B.height}  ` : ''}${n} px differ${n ? ` in x ${x0}–${x1}, y ${y0}–${y1}` : ''}`,
      );
    }
  }
  console.log(`${changed} of ${files.length} snapshots changed (${before} → ${after})`);
}

if (mode === 'examples') await examples(path.resolve(a));
else if (mode === 'blocks') await blocks(path.resolve(a));
else if (mode === 'diff') diff(path.resolve(a), path.resolve(b));
else {
  console.error('Usage: compare-renders.mjs examples <dir> | blocks <dir> | diff <before> <after>');
  process.exitCode = 2;
}

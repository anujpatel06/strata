#!/usr/bin/env node
/**
 * pnpm gif — the README's 30-second demo (BRIEF §13).
 *
 *   node scripts/readme-gif.mjs                 record against localhost:3000
 *   node scripts/readme-gif.mjs --url=<base>    record against a running server
 *   node scripts/readme-gif.mjs --out=<file>    default docs/media/readme.gif
 *   node scripts/readme-gif.mjs --keep-webm     keep the intermediate video
 *
 * It drives the homepage's own brand switcher — Vela, Harbor, Qamar (RTL), Haat (Devanagari), then dark —
 * because that is the README's claim: one component library, every brand, nothing differing in code.
 *
 * Needs ffmpeg on PATH. Playwright records webm; ffmpeg builds a palette from the whole clip and applies it,
 * which is what keeps brand colours from banding. Like every other sweep script this refuses to record a
 * server that is not running this build, so a GIF cannot quietly show someone else's work.
 */
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { mkdir, readdir, rm, rename, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { launchBrowser } from './launch-browser.mjs';
import { assertServedBuild } from './served-build.mjs';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const args = process.argv.slice(2);
const option = (n) => args.find((a) => a.startsWith(`--${n}=`))?.split('=').slice(1).join('=');
const BASE = option('url') ?? 'http://localhost:3000';
const OUT = path.resolve(ROOT, option('out') ?? 'docs/media/readme.gif');
const KEEP_WEBM = args.includes('--keep-webm');

/** 1280×800 records crisply; the GIF is scaled down, so text stays legible without a 1280-wide file. */
const VIEWPORT = { width: 1280, height: 800 };
const GIF_WIDTH = 960;
const FPS = 12;

/** The walkthrough. `hold` is how long that frame stays on screen, in ms. */
const BEATS = [
  { brand: 'Vela', hold: 3600, note: 'neobank, en-IN' },
  { brand: 'Harbor', hold: 3600, note: 'insurer, en-GB' },
  { brand: 'Qamar', hold: 4600, note: 'grocery, Arabic — the whole page mirrors' },
  { brand: 'Haat', hold: 4600, note: 'Devanagari' },
];

/**
 * The hero is brand-neutral, so switching brands above the fold changes almost nothing and the first cut of
 * this GIF showed a page that barely moved. Scroll until the switcher sits just under the sticky header and
 * the branded dashboard fills the rest of the frame — that is where a brand change is actually visible.
 * Care is left out deliberately: its blue reads too close to Vela's indigo to be worth three seconds.
 */
const SCROLL_TO = 440;

function ffmpeg(args_) {
  const r = spawnSync('ffmpeg', args_, { encoding: 'utf8' });
  if (r.error) throw new Error(`ffmpeg not found on PATH — install it, or pass --keep-webm and convert yourself.`);
  if (r.status !== 0) throw new Error(`ffmpeg exited ${r.status}:\n${r.stderr?.slice(-1500)}`);
}

const videoDir = path.join(ROOT, '.gif-record');
await rm(videoDir, { recursive: true, force: true });
await mkdir(videoDir, { recursive: true });
await mkdir(path.dirname(OUT), { recursive: true });

await assertServedBuild(BASE);

const browser = await launchBrowser();
const ctx = await browser.newContext({
  viewport: VIEWPORT,
  colorScheme: 'light',
  // The GIF is a recording, so motion is the point; but anything that loops forever would make the clip
  // look broken when it cuts, so the site's own reduced-motion path is the honest one to record.
  reducedMotion: 'reduce',
  // No explicit size: pinning one letterboxed the clip, leaving a grey band along the bottom.
  recordVideo: { dir: videoDir },
});
const page = await ctx.newPage();

try {
  await page.goto(BASE, { waitUntil: 'networkidle' });
  // Let fonts settle, or the first second of the clip shows a fallback face.
  await page.waitForTimeout(1200);
  await page.evaluate((y) => window.scrollTo({ top: y, behavior: 'instant' }), SCROLL_TO);
  await page.waitForTimeout(900);

  for (const beat of BEATS) {
    const radio = page.getByRole('radio', { name: new RegExp(`^${beat.brand}`, 'i') }).first();
    await radio.click();
    process.stdout.write(`  ${beat.brand} — ${beat.note}\n`);
    await page.waitForTimeout(beat.hold);
  }

  // Finish in dark, on the brand the README's screenshots use.
  await page.getByRole('radio', { name: /^Vela/i }).first().click();
  await page.waitForTimeout(1400);
  await page.getByLabel('Dark', { exact: true }).click();
  process.stdout.write('  dark\n');
  await page.waitForTimeout(3600);
} finally {
  await ctx.close();
  await browser.close();
}

const files = (await readdir(videoDir)).filter((f) => f.endsWith('.webm'));
if (files.length === 0) throw new Error('Playwright wrote no video.');
const webm = path.join(videoDir, files[0]);

/**
 * Headless Chromium paints its own background below the page, so the clip carries a flat grey band along the
 * bottom. Its height is not stable across machines, so measure it instead of hardcoding a crop: take one frame
 * as raw RGB, walk up the middle column, and count the rows that are flat grey. `ffmpeg`'s own `cropdetect`
 * does not help here — the band is mid-grey, not black, and cropdetect looks for letterboxing near 0.
 */
function greyBandHeight(source, w, h) {
  const raw = path.join(videoDir, 'probe.raw');
  ffmpeg(['-y', '-ss', '5', '-i', source, '-frames:v', '1', '-f', 'rawvideo', '-pix_fmt', 'rgb24', raw]);
  const buf = readFileSync(raw);
  const mid = Math.floor(w / 2);
  let band = 0;
  for (let y = h - 1; y >= 0; y--) {
    const i = (y * w + mid) * 3;
    const flatGrey =
      Math.abs(buf[i] - 128) < 20 && Math.abs(buf[i + 1] - 128) < 20 && Math.abs(buf[i + 2] - 128) < 20;
    if (!flatGrey) break;
    band++;
  }
  return band;
}

const probe = spawnSync(
  'ffprobe',
  ['-v', 'error', '-select_streams', 'v', '-show_entries', 'stream=width,height', '-of', 'csv=p=0', webm],
  { encoding: 'utf8' },
);
const [vw, vh] = probe.stdout.trim().split(',').map(Number);
const band = greyBandHeight(webm, vw, vh);
if (band > 0) console.log(`  (cropping ${band}px of headless-browser background from the bottom)`);
// Crop to an even height: GIF encoders reject odd dimensions on some filter chains.
const cropped = band > 0 ? `crop=${vw}:${(vh - band) & ~1}:0:0,` : '';

// Two passes: build one palette for the whole clip, then apply it. A per-frame palette banded the ramps.
const palette = path.join(videoDir, 'palette.png');
const filters = `${cropped}fps=${FPS},scale=${GIF_WIDTH}:-1:flags=lanczos`;
ffmpeg(['-y', '-i', webm, '-vf', `${filters},palettegen=stats_mode=diff`, palette]);
ffmpeg([
  '-y',
  '-i', webm,
  '-i', palette,
  '-lavfi', `${filters}[x];[x][1:v]paletteuse=dither=bayer:bayer_scale=4:diff_mode=rectangle`,
  '-loop', '0',
  OUT,
]);

if (KEEP_WEBM) {
  await rename(webm, path.resolve(path.dirname(OUT), 'readme.webm'));
}
await rm(videoDir, { recursive: true, force: true });

const { size } = await stat(OUT);
const mb = size / 1024 / 1024;
console.log(`\n› ${path.relative(ROOT, OUT)} — ${mb.toFixed(1)} MB, ${GIF_WIDTH}px wide, ${FPS} fps`);
if (mb > 10) {
  console.error(`✗ ${mb.toFixed(1)} MB is over the 10 MB a README should carry. Lower GIF_WIDTH or FPS.`);
  process.exit(1);
}

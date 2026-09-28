#!/usr/bin/env node
/**
 * Does any glyph's ink leave its line box? (ADR-020)
 *
 *   node scripts/check-script-clipping.mjs                  every type pair, its own tokens, DPR 1 and 2; exit 1 on clipping
 *   node scripts/check-script-clipping.mjs --pairs=bilingual-devanagari,precise
 *   node scripts/check-script-clipping.mjs --lh=1.3          measure at this line height instead of the pair's tokens
 *   node scripts/check-script-clipping.mjs --sweep           per size: the smallest line height with no ink outside the box
 *   node scripts/check-script-clipping.mjs --json=<file>     also write every measurement as JSON
 *
 * For each type pair it renders hard strings in the pair's own script (Devanagari: stacked conjuncts, matras above
 * and below; Arabic: marks above and below) and Latin product copy, in the heading and body fonts at 400 and 700,
 * at every font size of the type scale and every line-height token, as the engine emits them (toCssVariables).
 * The fonts load from Google Fonts; the run fails if a font does not load, so a system fallback can't pass for it.
 *
 * Two layouts per case:
 *   single  one line, white-space: nowrap. The box is exactly one line box, the clip rect an overflow-hidden,
 *           ellipsis-truncated label would have. Ink above its top or below its bottom would be cut.
 *   wrapped a paragraph that wraps to several lines. The first line is painted red (::first-line), the rest blue,
 *           so each line's ink is checked against its own line box, and the container's first and last edges
 *           against what overflow: hidden or line-clamp would cut.
 *
 * Box edges are snapped to device pixels the way Chrome snaps an overflow clip (rounded). Ink = a device pixel at least 25% covered (a channel ≤ 191 for black on white). Fainter anti-aliasing
 * fringes are not counted: they are not visible when cut. Margins are in CSS px, floored to 0.01; negative = clipped.
 *
 * It also reports, for pairs with script tokens (and Inter for comparison):
 *   truncation   where text-overflow: ellipsis cuts each Devanagari string, and whether the cut leaves a half letter
 *                (a virama/halant) or separates a letter from its vowel sign or mark
 *   marks        the gap between the anusvara dot and the headline (कं) and between the nukta and its letter (ड़),
 *                at each font size, in device px (0 = the dot has merged)
 *   tracking     headline breaks per word at each tracking value the Latin curve would give
 *
 * Needs network access to fonts.googleapis.com. Uses the Chromium from scripts/launch-browser.mjs.
 */
import { createHash } from 'node:crypto';
import { writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { inflateSync } from 'node:zlib';
import { launchBrowser } from './launch-browser.mjs';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const args = process.argv.slice(2);
const option = (name) => args.find((a) => a.startsWith(`--${name}=`))?.split('=').slice(1).join('=');
const flag = (name) => args.includes(`--${name}`);
const SWEEP = flag('sweep');
const LH_OVERRIDE = option('lh') ? Number(option('lh')) : undefined;
const DPRS = (option('dpr') ?? '1,2').split(',').map(Number);
const JSON_OUT = option('json');
const OFFSETS = [0, 0.25, 0.5, 0.75];
const INK = 191; // ≤ 191 on any channel = ≥ 25% coverage for black on white
const COLOR_INK = 64; // red/blue ink: the channel difference for ≥ 25% coverage

/* ------------------------------------------------------------------ engine (TypeScript source, via tsx) */

const req = createRequire(path.join(ROOT, 'packages/theme-engine/package.json'));
const { tsImport } = await import(pathToFileURL(req.resolve('tsx/esm/api')).href);
const engine = await tsImport(path.join(ROOT, 'packages/theme-engine/src/index.ts'), import.meta.url);
const { TYPE_PAIRS, googleFontsHref, generateTheme, toCssVariables } = engine;

const PAIR_IDS = option('pairs') ? option('pairs').split(',') : option('candidates') ? [] : Object.keys(TYPE_PAIRS);
for (const id of PAIR_IDS) if (!TYPE_PAIRS[id]) throw new Error(`Unknown type pair "${id}". Use one of: ${Object.keys(TYPE_PAIRS).join(', ')}`);
/**
 * --candidates=Mukta,Hind: Google Fonts families measured as if each were the Devanagari pair's only family (same
 * tokens as bilingual-devanagari), to compare vertical metrics while choosing a pair. Never part of the default run.
 */
const CANDIDATES = (option('candidates') ?? '').split(',').filter(Boolean).map((family) => ({
  ...TYPE_PAIRS['bilingual-devanagari'],
  id: `candidate:${family}`,
  label: `Candidate — ${family}`,
  heading: `"${family}", sans-serif`,
  body: `"${family}", sans-serif`,
  googleFamilies: [family],
}));

/* ------------------------------------------------------------------ test strings */

const STRINGS = {
  devanagari: [
    'क्षत्रिय',
    'श्रृंखला',
    'हिंदी में खरीदारी',
    'ऑर्डर की पुष्टि',
    '₹1,84,250 का भुगतान',
    'ट्ठ ड्ड द्ध द्व्य ह्न ह्य पृथ्वी ऊँ कूँ',
    'र्द्ध र्क्ष कीं किं फ़ॉर्म ज़्यादा ऑफ़र',
    'कैशबैक ₹120 · SKU HT-2291 Cotton',
  ],
  /** Truncation only: commerce words full of half-forms (स्, क्, न्, ट्र) where a cut could land. */
  truncation: ['स्वागत है, प्रोडक्ट स्टॉक में', 'डिस्काउंट ट्रांसफ़र कस्टमर', 'क्वालिटी चेक पूरा, ऑफ़र्स सक्रिय', 'पेमेंट स्टेटस: प्रोसेसिंग', 'बच्चों के स्पोर्ट्स जूते'],
  arabic: ['تأكيد الطلب', 'إِلَى الْمَتْجَرِ', 'استرجاع المبلغ ٢٬٥٠٠ د.إ', 'نقاط الولاء QM-58213'],
  latin: ['Order confirmed', 'Payment of ₹1,84,250 received', 'SKU HT-2291 · Quality jumpy glyph', 'Returns & payouts (Q4) — 5 Oct'],
};
const scriptOf = (pair) => (pair.script?.name ?? (pair.supportsArabic ? 'arabic' : 'latin'));
const stringsFor = (pair) => {
  const s = scriptOf(pair);
  return s === 'latin' ? STRINGS.latin.map((t) => ({ script: 'latin', text: t })) : [...STRINGS[s].map((t) => ({ script: s, text: t })), ...STRINGS.latin.map((t) => ({ script: 'latin', text: t }))];
};

/* ------------------------------------------------------------------ PNG decode (8-bit RGB/RGBA, non-interlaced) */

function decodePng(buf) {
  let pos = 8;
  let width = 0, height = 0, colorType = 0;
  const idat = [];
  while (pos < buf.length) {
    const len = buf.readUInt32BE(pos);
    const type = buf.toString('ascii', pos + 4, pos + 8);
    const data = buf.subarray(pos + 8, pos + 8 + len);
    if (type === 'IHDR') {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      if (data[8] !== 8 || data[12] !== 0) throw new Error('PNG: expected 8-bit, non-interlaced');
      colorType = data[9];
    } else if (type === 'IDAT') idat.push(data);
    else if (type === 'IEND') break;
    pos += 12 + len;
  }
  const bpp = colorType === 6 ? 4 : colorType === 2 ? 3 : 0;
  if (!bpp) throw new Error(`PNG: unsupported colour type ${colorType}`);
  const raw = inflateSync(Buffer.concat(idat));
  const stride = width * bpp;
  const out = Buffer.alloc(width * height * 4);
  let prev = Buffer.alloc(stride);
  for (let y = 0; y < height; y++) {
    const f = raw[y * (stride + 1)];
    const line = Buffer.from(raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1)));
    for (let i = 0; i < stride; i++) {
      const a = i >= bpp ? line[i - bpp] : 0;
      const b = prev[i];
      const c = i >= bpp ? prev[i - bpp] : 0;
      let v = line[i];
      if (f === 1) v += a;
      else if (f === 2) v += b;
      else if (f === 3) v += (a + b) >> 1;
      else if (f === 4) {
        const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
        v += pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
      }
      line[i] = v & 255;
    }
    for (let x = 0; x < width; x++) {
      const o = (y * width + x) * 4;
      out[o] = line[x * bpp];
      out[o + 1] = line[x * bpp + 1];
      out[o + 2] = line[x * bpp + 2];
      out[o + 3] = 255;
    }
    prev = line;
  }
  return { width, height, data: out };
}

/** Topmost and bottommost ink rows (device px) inside a device-px rect; kind: 'black' | 'red' | 'blue' | 'any'. */
function inkRows(img, x0, y0, x1, y1, kind = 'black') {
  const is = (o) => {
    const r = img.data[o], g = img.data[o + 1], b = img.data[o + 2];
    if (kind === 'black') return Math.min(r, g, b) <= INK;
    if (kind === 'red') return r - b >= COLOR_INK;
    if (kind === 'blue') return b - r >= COLOR_INK;
    return Math.min(r, g, b) <= INK || Math.abs(r - b) >= COLOR_INK;
  };
  let top = -1, bottom = -1;
  const X0 = Math.max(0, Math.floor(x0)), X1 = Math.min(img.width, Math.ceil(x1));
  const Y0 = Math.max(0, Math.floor(y0)), Y1 = Math.min(img.height, Math.ceil(y1));
  for (let y = Y0; y < Y1; y++) {
    for (let x = X0; x < X1; x++) {
      if (is((y * img.width + x) * 4)) {
        if (top < 0) top = y;
        bottom = y + 1;
        break;
      }
    }
  }
  return top < 0 ? null : { top, bottom };
}

/* ------------------------------------------------------------------ page helpers */

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
const floor2 = (n) => Math.floor(n * 100 + 1e-9) / 100;

async function openPair(browser, pair, dpr) {
  const page = await browser.newPage({ viewport: { width: 1800, height: 900 }, deviceScaleFactor: dpr });
  const lang = { devanagari: 'hi', arabic: 'ar', latin: 'en' }[scriptOf(pair)];
  await page.setContent(
    `<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><link rel="stylesheet" href="${googleFontsHref(pair)}">` +
      `<style>html,body{margin:0;background:#fff;color:#000}#root{display:flex;flex-wrap:wrap;align-items:flex-start;gap:0 24px;padding:8px}` +
      `.cell{padding:1em 0}.box{white-space:nowrap;width:max-content}.wrap{color:#00f}.wrap::first-line{color:#f00}` +
      `.t{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}</style></head><body><div id="root"></div></body></html>`,
    { waitUntil: 'networkidle' },
  );
  // Load every family × weight with text from its script, then prove it loaded: a fallback must not pass for it.
  const families = [...new Set([pair.heading, pair.body].map((s) => s.match(/^"([^"]+)"/)?.[1]).filter(Boolean))];
  const sample = stringsFor(pair).map((s) => s.text).join(' ');
  const missing = await page.evaluate(
    async ({ families, sample }) => {
      const miss = [];
      for (const f of families) for (const w of [400, 700]) {
        await document.fonts.load(`${w} 16px "${f}"`, sample);
        if (!document.fonts.check(`${w} 16px "${f}"`, sample)) miss.push(`${f} ${w}`);
      }
      await document.fonts.ready;
      return miss;
    },
    { families, sample },
  );
  if (missing.length) throw new Error(`Fonts did not load for ${pair.id}: ${missing.join(', ')} (is fonts.googleapis.com reachable?)`);
  return page;
}

/** Renders cells, screenshots once, returns { img, rects } with rects in device px. */
async function renderCells(page, html, dpr) {
  const rects = await page.evaluate((html) => {
    const root = document.getElementById('root');
    root.innerHTML = html;
    const r = (el) => {
      const b = el.getBoundingClientRect();
      return { x: b.left + scrollX, y: b.top + scrollY, w: b.width, h: b.height };
    };
    return [...root.querySelectorAll('.cell')].map((cell) => {
      const box = cell.firstElementChild;
      return { cell: r(cell), box: r(box), lineHeight: parseFloat(getComputedStyle(box).lineHeight) };
    });
  }, html);
  const img = decodePng(await page.screenshot({ fullPage: true }));
  const scale = (o) => ({ x: o.x * dpr, y: o.y * dpr, w: o.w * dpr, h: o.h * dpr });
  return { img, rects: rects.map((r) => ({ cell: scale(r.cell), box: scale(r.box), lineHeight: r.lineHeight * dpr })) };
}

/* ------------------------------------------------------------------ clipping */

function fontsOf(pair) {
  const roles = [['body', pair.body]];
  if (pair.heading !== pair.body) roles.push(['heading', pair.heading]);
  return roles;
}

async function measurePair(browser, pair, dpr, vars) {
  const sizes = Object.keys(vars).filter((k) => k.startsWith('--strata-font-size-')).map((k) => [k.slice(19), parseFloat(vars[k])]);
  const lhs =
    LH_OVERRIDE !== undefined
      ? [['override', LH_OVERRIDE]]
      : Object.keys(vars).filter((k) => k.startsWith('--strata-line-height-')).map((k) => [k.slice(21), Number(vars[k])]);
  const strings = stringsFor(pair);
  const paragraph = strings.filter((s) => s.script !== 'latin').map((s) => s.text).join(' ') || strings.map((s) => s.text).join(' ');
  const page = await openPair(browser, pair, dpr);
  const results = [];
  for (const [sizeKey, size] of sizes) {
    // Four sub-pixel positions: where a line lands on the pixel grid moves its ink by up to a device pixel.
    // One screenshot per position keeps each image well under Chromium's 16,384 px limit.
    for (const [lhKey, lh] of lhs) for (const offset of OFFSETS) {
      const cases = [];
      let html = '';
      const cellStyle = `font-size:${size}px;padding-top:calc(1em + ${offset}px)`;
      for (const [role, stack] of fontsOf(pair)) {
        for (const weight of [400, 700]) {
          const font = `font:${weight} ${size}px/${lh} ${esc(stack)}`;
          for (const s of strings) {
            cases.push({ layout: 'single', role, weight, offset, ...s });
            html += `<div class="cell" style="${cellStyle}"><div class="box" style="${font}">${esc(s.text)}</div></div>`;
          }
          cases.push({ layout: 'wrapped', role, weight, offset, script: scriptOf(pair), text: paragraph });
          html += `<div class="cell" style="${cellStyle}"><div class="wrap" style="${font};width:9em">${esc(paragraph)}</div></div>`;
        }
      }
      const { img, rects } = await renderCells(page, html, dpr);
      cases.forEach((c, i) => {
        const { cell, box, lineHeight } = rects[i];
        const X0 = cell.x, X1 = cell.x + cell.w;
        // Chrome snaps a box's edges (and so an overflow clip) to whole device pixels: round, as it does.
        const top = Math.round(box.y), bottom = Math.round(box.y + box.h);
        const r = { pair: pair.id, dpr, size: sizeKey, px: size, lh: lhKey, lhValue: lh, ...c, text: c.layout === 'single' ? c.text : '(paragraph)' };
        const noInk = () => new Error(`No ink found for ${pair.id} ${size}px ${c.layout} "${c.text}" (cell at y ${cell.y}, image ${img.width}×${img.height})`);
        if (c.layout === 'single') {
          const ink = inkRows(img, X0, cell.y, X1, cell.y + cell.h, 'black');
          if (!ink) throw noInk();
          r.marginTop = (ink.top - top) / dpr;
          r.marginBottom = (bottom - ink.bottom) / dpr;
        } else {
          const lines = Math.round(box.h / lineHeight);
          r.lines = lines;
          r.uneven = Math.abs(box.h - lines * lineHeight) > 0.5;
          const red = inkRows(img, X0, cell.y, X1, cell.y + cell.h, 'red');
          const blue = inkRows(img, X0, cell.y, X1, cell.y + cell.h, 'blue');
          if (!red) throw noInk();
          const line1Bottom = Math.round(box.y + lineHeight);
          // Line 1 against its own box; lines 2..n against theirs; the container against its edges.
          r.marginTop = Math.min(red.top - top, blue ? blue.top - line1Bottom : Infinity) / dpr;
          r.marginBottom = Math.min(line1Bottom - red.bottom, blue ? bottom - blue.bottom : Infinity) / dpr;
        }
        r.margin = Math.min(r.marginTop, r.marginBottom);
        // Smallest line height that would have no ink outside the box: each side gains (ΔL × size) / 2.
        r.lhNeeded = lh - (2 * r.margin) / size;
        results.push(r);
      });
    }
  }
  await page.close();
  return results;
}

/* ------------------------------------------------------------------ truncation */

const VIRAMA = '्';
const isMark = (ch) => /\p{M}/u.test(ch);

async function truncation(browser, pair, sizePx) {
  const dpr = 2;
  const page = await openPair(browser, pair, dpr);
  await page.evaluate(() => {
    const r = document.getElementById('root');
    r.style.display = 'block';
    r.style.padding = '0';
  });
  const stack = pair.body;
  const out = [];
  for (const text of [...STRINGS.devanagari, ...STRINGS.truncation]) {
    const cps = [...text];
    // Advance of every code-point prefix, measured in context (shaped as part of the whole string).
    const { natural, advances } = await page.evaluate(
      ({ text, stack, sizePx }) => {
        const d = document.createElement('div');
        d.style.cssText = `font:400 ${sizePx}px/1.6 ${stack};white-space:nowrap;width:max-content`;
        d.textContent = text;
        document.body.append(d);
        const node = d.firstChild;
        const left = d.getBoundingClientRect().left;
        const advances = [];
        let offset = 0;
        for (const ch of [...text].slice(0, -1)) {
          offset += ch.length;
          const r = document.createRange();
          r.setStart(node, 0);
          r.setEnd(node, offset);
          advances.push(r.getBoundingClientRect().right - left);
        }
        const natural = d.getBoundingClientRect().width;
        d.remove();
        return { natural, advances };
      },
      { text, stack, sizePx },
    );
    const frameW = Math.ceil(natural + sizePx * 2);
    const rowH = Math.ceil(sizePx * 2);
    const row = (inner) => `<div class="cell" style="padding:0;width:${frameW}px;height:${rowH}px;font:400 ${sizePx}px/1.6 ${esc(stack)}">${inner}</div>`;
    // Each prefix drawn in context: the rest of the string is there (so shaping is the same) but transparent.
    const prefixes = advances.map((_, i) => cps.slice(0, i + 1).join(''));
    const widths = [];
    for (let w = Math.floor(natural) - 1; w >= Math.ceil(sizePx); w--) widths.push(w);
    // Prefixes that end on a virama, drawn alone: if that matches the in-context drawing, the word itself shows the
    // halant there (ट्स); if not, the cut leaves a half form the word never shows (स् of स्टॉक).
    const viramaEnds = prefixes.filter((p) => p.endsWith(VIRAMA));
    const html =
      prefixes.map((p) => row(`<div class="box">${esc(p)}<span style="color:transparent">${esc(text.slice(p.length))}</span></div>`)).join('') +
      widths.map((w) => row(`<div class="t" style="width:${w}px">${esc(text)}</div>`)).join('') +
      viramaEnds.map((p) => row(`<div class="box">${esc(p)}</div>`)).join('');
    const { img, rects } = await renderCells(page, html, dpr);
    // Same pixels in columns [0, upTo) of two rows?
    const same = (ra, rb, upTo) => {
      const h = Math.round(ra.cell.h);
      for (let y = 0; y < h; y++) {
        const oa = ((Math.round(ra.cell.y) + y) * img.width + Math.round(ra.cell.x)) * 4;
        const ob = ((Math.round(rb.cell.y) + y) * img.width + Math.round(rb.cell.x)) * 4;
        for (let i = 0; i < upTo * 4; i++) if (Math.abs(img.data[oa + i] - img.data[ob + i]) > 24) return false;
      }
      return true;
    };
    const cuts = new Map();
    let unmatched = 0;
    widths.forEach((w, j) => {
      const tr = rects[prefixes.length + j];
      let hit;
      // Longest prefix that fits and whose pixels the truncated line reproduces (the ellipsis follows it).
      for (let i = prefixes.length - 1; i >= 0; i--) {
        if (advances[i] > w) continue;
        const upTo = Math.floor(advances[i] * dpr) - 1;
        if (upTo > 0 && same(rects[i], tr, upTo)) {
          hit = prefixes[i];
          break;
        }
      }
      if (hit === undefined) unmatched++;
      else if (!cuts.has(hit)) cuts.set(hit, w);
    });
    const alone = new Map(viramaEnds.map((p, k) => [p, rects[prefixes.length + widths.length + k]]));
    const found = [...cuts.keys()].map((p) => {
      const next = cps[[...p].length];
      const inContext = rects[prefixes.indexOf(p)];
      const halfForm = p.endsWith(VIRAMA) && !same(inContext, alone.get(p), Math.round(inContext.cell.w));
      const problem = halfForm
        ? 'ends on a half form: shows a half letter the word does not show'
        : next === VIRAMA
          ? 'cuts a conjunct: shows the full letter where the word has its half form'
          : next && isMark(next)
            ? `splits a syllable: drops the mark U+${next.codePointAt(0).toString(16).toUpperCase().padStart(4, '0')} from the last letter`
            : null;
      return { visible: p, problem };
    });
    out.push({ text, cuts: found, unmatched, widthsTried: widths.length });
  }
  await page.close();
  return out;
}

/* ------------------------------------------------------------------ marks (legibility) */

/** Gap in device px between the first blob met from `side` (dot) and the next ink in the same columns. */
function dotGap(img, rect, side) {
  const X0 = Math.round(rect.x), X1 = Math.round(rect.x + rect.w);
  const Y0 = Math.round(rect.y), Y1 = Math.round(rect.y + rect.h);
  const inkAt = (x, y) => Math.min(img.data[(y * img.width + x) * 4], img.data[(y * img.width + x) * 4 + 1], img.data[(y * img.width + x) * 4 + 2]) <= INK;
  const rows = side === 'top' ? [...Array(Y1 - Y0).keys()].map((i) => Y0 + i) : [...Array(Y1 - Y0).keys()].map((i) => Y1 - 1 - i);
  let cols = null;
  let gap = 0;
  let state = 'seek';
  for (const y of rows) {
    const inkCols = [];
    for (let x = X0; x < X1; x++) if (inkAt(x, y)) inkCols.push(x);
    if (state === 'seek') {
      if (inkCols.length) {
        cols = new Set(inkCols);
        state = 'dot';
      }
    } else if (state === 'dot') {
      const hit = inkCols.filter((x) => cols.has(x) || cols.has(x - 1) || cols.has(x + 1));
      if (hit.length === 0) state = 'gap', (gap = 1);
      else for (const x of hit) cols.add(x);
    } else {
      if (inkCols.some((x) => cols.has(x))) return gap;
      gap++;
    }
  }
  return 0; // never met other ink: the dot merged into the letter and the walk swallowed it
}

async function marks(browser, pair, sizes, dpr) {
  const page = await openPair(browser, pair, dpr);
  const specimens = scriptOf(pair) === 'devanagari' ? [['anusvara', 'कं', 'top'], ['nukta', 'ड़', 'bottom']] : [['i-dot', 'i', 'top']];
  let html = '';
  const cases = [];
  for (const [name, text, side] of specimens) for (const [k, px] of sizes) {
    cases.push({ name, side, size: k, px });
    html += `<div class="cell" style="padding:${px}px"><div class="box" style="font:400 ${px}px/2 ${esc(pair.body)}">${text}</div></div>`;
  }
  const { img, rects } = await renderCells(page, html, dpr);
  await page.close();
  return cases.map((c, i) => ({ ...c, dpr, gap: dotGap(img, rects[i].cell, c.side) }));
}

/* ------------------------------------------------------------------ tracking (headline continuity) */

async function tracking(browser, pair, values) {
  const page = await openPair(browser, pair, 2);
  const words = ['कमल', 'नगर', 'समय', 'कपड़े', 'मनपसंद'];
  let html = '';
  const cases = [];
  for (const [label, px, em] of values) for (const w of words) {
    cases.push({ label, px, em, word: w });
    html += `<div class="cell"><div class="box" style="font:400 ${px}px/2 ${esc(pair.body)};letter-spacing:${em}em">${w}</div></div>`;
  }
  const { img, rects } = await renderCells(page, html, 2);
  await page.close();
  return cases.map((c, i) => {
    const r = rects[i].cell;
    const X0 = Math.round(r.x), X1 = Math.round(r.x + r.w), Y0 = Math.round(r.y), Y1 = Math.round(r.y + r.h);
    const inkAt = (x, y) => Math.min(img.data[(y * img.width + x) * 4], img.data[(y * img.width + x) * 4 + 1], img.data[(y * img.width + x) * 4 + 2]) <= INK;
    // The headline is the row with the most ink; a word's headline breaks wherever that band has an empty column.
    let best = Y0, bestN = -1;
    for (let y = Y0; y < Y1; y++) {
      let n = 0;
      for (let x = X0; x < X1; x++) if (inkAt(x, y)) n++;
      if (n > bestN) (bestN = n), (best = y);
    }
    const band = [best - 1, best, best + 1];
    let runs = 0, on = false;
    for (let x = X0; x < X1; x++) {
      const v = band.some((y) => inkAt(x, y));
      if (v && !on) runs++;
      on = v;
    }
    return { ...c, breaks: Math.max(0, runs - 1) };
  });
}

/* ------------------------------------------------------------------ main */

const browser = await launchBrowser();
const all = [];
const report = { command: `node scripts/check-script-clipping.mjs ${args.join(' ')}`.trim(), ink: '≥ 25% pixel coverage', pairs: {} };
let failed = 0;
try {
  for (const pair of [...PAIR_IDS.map((id) => TYPE_PAIRS[id]), ...CANDIDATES]) {
    const id = pair.id;
    const themePair = id.startsWith('candidate:') ? 'bilingual-devanagari' : id;
    const theme = generateTheme({ name: 'Clip', primary: '#3d45d6', neutral: 'neutral', shape: 'soft', typePair: themePair, density: 'comfortable' });
    const vars = toCssVariables(theme, 'light');
    const rows = [];
    for (const dpr of DPRS) rows.push(...(await measurePair(browser, pair, dpr, vars)));
    all.push(...rows);
    const bad = rows.filter((r) => r.margin < 0);
    failed += bad.length;
    const lhKeys = [...new Set(rows.map((r) => r.lh))];
    const scripts = [...new Set(rows.map((r) => r.script))];
    console.log(`\n${pair.label}  (${id})`);
    console.log(`  line heights ${lhKeys.map((k) => `${k} ${rows.find((r) => r.lh === k).lhValue}`).join(', ')} · sizes ${[...new Set(rows.map((r) => r.px))].join(', ')} px · DPR ${DPRS.join(', ')}`);
    console.log('  script      layout   ' + lhKeys.map((k) => `${k.padEnd(18)}`).join('') + 'cases  clipped');
    for (const script of scripts) for (const layout of ['single', 'wrapped']) {
      const sel = rows.filter((r) => r.script === script && r.layout === layout);
      if (!sel.length) continue;
      const cols = lhKeys.map((k) => {
        const m = Math.min(...sel.filter((r) => r.lh === k).map((r) => r.margin));
        return `min ${floor2(m).toFixed(2)} px`.padEnd(18);
      });
      console.log(`  ${script.padEnd(11)} ${layout.padEnd(8)} ${cols.join('')}${String(sel.length).padEnd(7)}${sel.filter((r) => r.margin < 0).length}`);
    }
    if (rows.some((r) => r.uneven)) console.log(`  note: ${rows.filter((r) => r.uneven).length} wrapped case(s) had lines of different heights (a fallback font grew a line box)`);
    for (const r of bad.slice(0, 12)) {
      console.log(`  CLIPPED  ${r.script} ${r.layout} ${r.role} ${r.weight} ${r.px}px lh ${r.lh}=${r.lhValue} DPR ${r.dpr}: ${r.marginTop < 0 ? `${floor2(-r.marginTop)} px above` : ''}${r.marginBottom < 0 ? ` ${floor2(-r.marginBottom)} px below` : ''}  "${r.text}"`);
    }
    if (bad.length > 12) console.log(`  … and ${bad.length - 12} more`);

    const entry = { label: pair.label, rows: rows.length, clipped: bad.length };
    if (SWEEP) {
      console.log('  sweep: smallest line height with no ink outside the box (max over strings, weights, fonts, DPRs, layouts)');
      const bySize = new Map();
      for (const r of rows) bySize.set(r.px, Math.max(bySize.get(r.px) ?? 0, r.lhNeeded));
      for (const script of scripts) {
        const line = [...bySize.keys()].map((px) => {
          const need = Math.max(...rows.filter((r) => r.px === px && r.script === script).map((r) => r.lhNeeded));
          return `${px}px ${need.toFixed(3)}`;
        });
        console.log(`    ${script.padEnd(11)} ${line.join('  ')}`);
      }
      entry.sweep = Object.fromEntries([...bySize.entries()].map(([px, v]) => [px, v]));
    }

    if (pair.script || id === 'precise') {
      const sizes = Object.keys(vars).filter((k) => k.startsWith('--strata-font-size-')).map((k) => [k.slice(19), parseFloat(vars[k])]);
      const allSizes = [[`10`, 10], [`11`, 11], ...sizes.filter(([, px]) => px <= 20)];
      const m = [];
      for (const dpr of DPRS) m.push(...(await marks(browser, pair, allSizes, dpr)));
      console.log('  marks: gap between a dot and its letter, device px (0 = merged)');
      for (const name of [...new Set(m.map((x) => x.name))]) for (const dpr of DPRS) {
        const sel = m.filter((x) => x.name === name && x.dpr === dpr);
        console.log(`    ${name.padEnd(9)} DPR ${dpr}  ${sel.map((x) => `${x.px}px ${x.gap}`).join('  ')}`);
      }
      entry.marks = m;
    }

    if (pair.script) {
      const values = [['caps 0.08em', 12, 0.08], ...[12, 14, 16, 24, 32, 48].map((px) => [`${px}px curve`, px, Math.round((-0.0223 + 0.185 * Math.exp(-0.1745 * px)) * 1000) / 1000]), ['zero', 16, 0]];
      const t = await tracking(browser, pair, values);
      console.log('  tracking: headline breaks inside words (5 words) at each letter-spacing');
      console.log('    ' + values.map(([label, , em]) => `${label} (${em}em) ${t.filter((x) => x.label === label).reduce((n, x) => n + x.breaks, 0)}`).join('  ·  '));
      entry.tracking = t;

      const trunc = await truncation(browser, pair, 16);
      const cuts = trunc.flatMap((t) => t.cuts);
      const bad = cuts.filter((c) => c.problem);
      console.log(`  truncation (16px, text-overflow: ellipsis): ${cuts.length} distinct cut points across ${trunc.length} strings; ${bad.length} change how the word reads; ${trunc.reduce((n, t) => n + t.unmatched, 0)} renders matched no prefix`);
      for (const t of trunc) for (const c of t.cuts.filter((c) => c.problem)) console.log(`    "${t.text}" → "${c.visible}…"  ${c.problem}`);
      entry.truncation = trunc;
    }
    report.pairs[id] = entry;
  }
} finally {
  await browser.close();
}

if (JSON_OUT) writeFileSync(path.resolve(JSON_OUT), JSON.stringify({ ...report, measurements: all }, null, 2) + '\n');
console.log(`\n${failed === 0 ? 'No clipping' : `${failed} clipped case(s)`} across ${all.length} cases (${PAIR_IDS.length + CANDIDATES.length} type pairs). Ink = ≥ 25% pixel coverage; margins floored to 0.01 CSS px.`);
if (failed > 0) process.exitCode = 1;

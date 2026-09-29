/**
 * Duotone tints are semi-transparent, so two tint parts that overlap paint ~29% where each paints 16% — a darker
 * patch inside what should read as one mass. This finds them: every twin with more than one tint part is drawn with
 * the outline removed and the tint forced to 50% blue on white, rasterised, and every pixel carrying two layers is
 * counted.
 *
 *   pnpm --filter @syntara/icons check:tints
 *
 * A seam a pixel or two wide where two masses abut is expected and harmless — the outline's own stroke covers it —
 * so the check reports the doubled area as a share of the tint and fails only above THRESHOLD. The detector proves
 * itself on two synthetic shapes before it runs, so a check that has quietly stopped seeing anything fails loudly.
 */
// @ts-expect-error — plain JS helper shared by the repo's scripts, no types.
import { launchBrowser } from '../../../scripts/launch-browser.mjs';
import * as all from '../src/index';
import type { Icon, IconNode } from '../src/create-icon';

const THRESHOLD = 0.02; // of the tinted area
const SIZE = 256;

interface Shot {
  name: string;
  svg: string;
}
interface Count {
  name: string;
  tint: number;
  doubled: number;
}

/** Runs in the page: rasterise each SVG on white and count tinted pixels, and those carrying two tint layers. */
async function measure({ items, size }: { items: Shot[]; size: number }): Promise<Count[]> {
  const out: Count[] = [];
  for (const { name, svg } of items) {
    const img = new Image();
    img.src = `data:image/svg+xml;base64,${btoa(svg)}`;
    await img.decode();
    const canvas = new OffscreenCanvas(size, size);
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, size, size);
    ctx.drawImage(img, 0, 0);
    const { data } = ctx.getImageData(0, 0, size, size);
    let tint = 0;
    let doubled = 0;
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i]!; // white 255, one tint layer ≈ 127, two ≈ 63
      if (r < 200) tint++;
      if (r < 100) doubled++;
    }
    out.push({ name, tint, doubled });
  }
  return out;
}

const icons = Object.entries(all).filter(([k]) => k.startsWith('Icon')) as [string, Icon][];
const tintPartsOf = (name: string, twin: Icon): IconNode => {
  const base = all[name.replace(/Duotone$/, '') as keyof typeof all] as Icon | undefined;
  return base ? twin.node.slice(0, twin.node.length - base.node.length) : [];
};
const candidates = icons
  .filter(([k]) => k.endsWith('Duotone'))
  .map(([name, twin]) => ({ name, parts: tintPartsOf(name, twin) }))
  .filter((c) => c.parts.length > 1);

const TINT = 'fill="rgba(0,0,255,0.5)"';
const wrap = (inner: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 24 24">${inner}</svg>`;
const svgOf = (parts: IconNode) =>
  wrap(
    parts
      .map(([tag, a]) => {
        const attrs = Object.entries(a)
          .filter(([k]) => k !== 'fill' && k !== 'stroke' && k !== 'strokeWidth')
          .map(([k, v]) => `${k.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`)}="${v}"`)
          .join(' ');
        return `<${tag} ${attrs} ${TINT} stroke="none"/>`;
      })
      .join(''),
  );

const browser = await launchBrowser();
const page = await browser.newPage();

// Prove the detector still detects: two discs that overlap must register, two that only touch must not.
const selfTest = await page.evaluate(measure, {
  items: [
    { name: 'overlapping', svg: wrap(`<circle cx="10" cy="12" r="6" ${TINT}/><circle cx="14" cy="12" r="6" ${TINT}/>`) },
    { name: 'abutting', svg: wrap(`<circle cx="6" cy="12" r="6" ${TINT}/><circle cx="18" cy="12" r="6" ${TINT}/>`) },
  ],
  size: SIZE,
});
const share = (name: string, counts: Count[]) => {
  const c = counts.find((x) => x.name === name)!;
  return c.tint ? c.doubled / c.tint : 0;
};
if (share('overlapping', selfTest) < 0.2 || share('abutting', selfTest) > 0.01) {
  console.error(
    `self-test failed — the detector is not measuring what it claims: overlapping ${share('overlapping', selfTest)}, abutting ${share('abutting', selfTest)}`,
  );
  await browser.close();
  process.exit(2);
}

const results = await page.evaluate(measure, {
  items: candidates.map((c) => ({ name: c.name, svg: svgOf(c.parts) })),
  size: SIZE,
});
await browser.close();

const pct = (c: Count) => (c.tint ? (100 * c.doubled) / c.tint : 0);
const bad = results.filter((c: Count) => pct(c) > THRESHOLD * 100);
for (const c of [...results].sort((a: Count, b: Count) => pct(b) - pct(a))) {
  if (pct(c) > 0.05) console.log(`${pct(c) > THRESHOLD * 100 ? 'FAIL' : 'ok  '} ${c.name.padEnd(34)} ${pct(c).toFixed(2)}% of its tint is painted twice`);
}
console.log(`\n${candidates.length} twins have more than one tint part; ${bad.length} overlap by more than ${THRESHOLD * 100}%.`);
process.exit(bad.length ? 1 : 0);

/**
 * Review sheet for ONE source file, for when a batch is being drawn and isn't exported yet:
 *   pnpm --filter @syntara/icons sheet:batch <src/icons basename> [out.html]
 * Same grid and sizes as sheet.tsx, scoped to one module. Open the HTML, or shoot it:
 *   node scripts/shoot.mjs "file://$PWD/out.html" out.png --width=1180 --full
 */
import { writeFileSync } from 'node:fs';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import type { Icon } from '../src/create-icon';

const [mod, out = `${process.argv[2]}.html`] = process.argv.slice(2);
if (!mod) {
  console.error('usage: sheet:batch <src/icons basename> [out.html]');
  process.exit(2);
}
const all = (await import(`../src/icons/${mod}.ts`)) as Record<string, Icon>;
const icons = Object.entries(all).filter(([k]) => k.startsWith('Icon'));
const grid = `<svg width="84" height="84" viewBox="0 0 24 24"><rect x="2" y="2" width="20" height="20" fill="none" stroke="#e5484d" stroke-width=".1"/><circle cx="12" cy="12" r="9" fill="none" stroke="#3e63dd" stroke-width=".1"/></svg>`;
const cell = ([, I]: [string, Icon]) =>
  `<div class="c"><div class="s">${grid}${renderToStaticMarkup(createElement(I, { size: 84 }))}</div><div class="r">${[16, 20, 24, 32]
    .map((s) => renderToStaticMarkup(createElement(I, { size: s })))
    .join('')}</div><div class="n">${I.iconName}</div></div>`;
const sec = (scheme: string) =>
  `<section class="${scheme}"><h2>${mod} — ${icons.length} icons (${scheme})</h2><div class="g">${icons.map(cell).join('')}</div></section>`;
writeFileSync(
  out,
  `<!doctype html><meta charset="utf-8"><title>${mod}</title><style>body{margin:0;font:12px/1.4 system-ui,sans-serif}section{padding:24px 28px}.light{background:#fbfbfc;color:#18181b}.dark{background:#0f0f11;color:#ececef}h2{margin:0 0 14px;font-size:14px}.g{display:grid;grid-template-columns:repeat(7,1fr);gap:10px}.c{border-radius:14px;padding:12px;background:rgba(127,127,127,.07);display:grid;gap:8px;justify-items:center}.s{position:relative;width:84px;height:84px}.s svg{position:absolute;inset:0}.r{display:flex;gap:10px;align-items:center}.n{opacity:.55;font-size:11px}</style>${sec('light')}${sec('dark')}`,
);
console.log(`${icons.length} icons → ${out}`);

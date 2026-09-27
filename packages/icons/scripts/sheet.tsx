/**
 * Review sheet for every icon: `pnpm --filter @strata/icons sheet [out.html]`.
 * Each icon large on the 24-grid (red = 20px live area, blue = circle r=9 and square keylines), then at 16 / 20 / 24px,
 * in light and dark. Open the HTML or screenshot it; this is how the set is reviewed before it ships.
 */
import { writeFileSync } from 'node:fs';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import * as all from '../src/index';
import type { Icon } from '../src/create-icon';

const icons = Object.entries(all).filter(([k]) => k.startsWith('Icon')) as [string, Icon][];
const out = process.argv[2] ?? 'icon-sheet.html';
const grid = `<svg width="96" height="96" viewBox="0 0 24 24"><rect x="2" y="2" width="20" height="20" fill="none" stroke="#e5484d" stroke-width=".1"/><circle cx="12" cy="12" r="9" fill="none" stroke="#3e63dd" stroke-width=".1"/><rect x="3.5" y="3.5" width="17" height="17" fill="none" stroke="#3e63dd" stroke-width=".1"/></svg>`;
const cell = ([name, I]: [string, Icon]) =>
  `<div class="cell"><div class="stack">${grid}${renderToStaticMarkup(createElement(I, { size: 96 }))}</div><div class="sizes">${[16, 20, 24]
    .map((s) => renderToStaticMarkup(createElement(I, { size: s })))
    .join('')}</div><div class="name">${name}</div></div>`;
const section = (scheme: string) => `<section class="${scheme}"><h2>@strata/icons — ${icons.length} icons (${scheme})</h2><div class="grid">${icons.map(cell).join('')}</div></section>`;
writeFileSync(
  out,
  `<!doctype html><meta charset="utf-8"><title>Strata icons</title><style>body{margin:0;font:12px/1.4 -apple-system,system-ui,sans-serif}section{padding:28px 32px}.light{background:#fafafa;color:#18181b}.dark{background:#0f0f11;color:#ececef}h2{margin:0 0 16px;font-size:16px}.grid{display:grid;grid-template-columns:repeat(8,1fr);gap:12px}.cell{border-radius:14px;padding:12px;background:rgba(127,127,127,.06);display:grid;gap:8px;justify-items:center}.stack{position:relative;width:96px;height:96px}.stack svg{position:absolute;inset:0}.sizes{display:flex;gap:12px;align-items:center}.name{opacity:.6;font-size:11px}</style>${section('light')}${section('dark')}`,
);
console.log(`${icons.length} icons → ${out}`);

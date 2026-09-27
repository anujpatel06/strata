import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import * as all from '../src/index';
import type { Icon } from '../src/create-icon';

const icons = Object.entries(all).filter(([k]) => k.startsWith('Icon')) as [string, Icon][];

/** Every coordinate a path or shape reaches, roughly (control points included), to catch drawings outside the live area. */
function extents(svg: string): number[] {
  const nums: number[] = [];
  for (const m of svg.matchAll(/ (?:cx|cy|x|y)="([\d.-]+)"/g)) nums.push(Number(m[1]));
  for (const m of svg.matchAll(/ d="M([\d.]+) ([\d.]+)/g)) nums.push(Number(m[1]), Number(m[2]));
  return nums;
}

describe('@strata/icons', () => {
  it('exports icons with unique names that match their export', () => {
    expect(icons.length).toBeGreaterThan(0);
    const names = new Set<string>();
    for (const [exp, I] of icons) {
      expect(I.displayName).toBe(exp);
      expect(names.has(I.iconName)).toBe(false);
      names.add(I.iconName);
    }
  });

  it.each(icons)('%s renders on the 24 grid, decorative by default', (_, I) => {
    const svg = renderToStaticMarkup(createElement(I));
    expect(svg).toContain('viewBox="0 0 24 24"');
    expect(svg).toContain('aria-hidden="true"');
    expect(svg).toContain('stroke="currentColor"');
    for (const n of extents(svg)) {
      expect(n).toBeGreaterThanOrEqual(1.5);
      expect(n).toBeLessThanOrEqual(22.5);
    }
  });

  it('becomes an image with a name when labelled; size and stroke props apply', () => {
    const svg = renderToStaticMarkup(createElement(all.IconBell, { 'aria-label': 'Notifications', size: 20, stroke: 2 }));
    expect(svg).toContain('role="img"');
    expect(svg).toContain('aria-label="Notifications"');
    expect(svg).not.toContain('aria-hidden');
    expect(svg).toContain('width="20"');
    expect(svg).toContain('stroke-width:2');
    expect(renderToStaticMarkup(createElement(all.IconBell))).toContain('stroke-width="1.5"');
  });
});

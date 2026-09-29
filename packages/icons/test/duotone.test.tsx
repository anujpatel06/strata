import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import * as all from '../src/index';
import { TINT } from '../src/icons/duotone-kit';
import type { Icon } from '../src/create-icon';

const entries = Object.entries(all).filter(([k]) => k.startsWith('Icon')) as [string, Icon][];
const duotones = entries.filter(([k]) => k.endsWith('Duotone'));
/** The outline set: what a duotone twin is owed. filled.ts is already a solid style, so it has no twin. */
const outlines = entries.filter(([k]) => !k.endsWith('Duotone') && !k.endsWith('Filled'));

describe('duotone (ADR-036)', () => {
  it('is 1:1 with the outline set, so a product can swap its whole icon layer', () => {
    expect(duotones.length).toBe(outlines.length);
    expect(duotones.length).toBeGreaterThan(200);
    for (const [name, I] of outlines) {
      const twin = all[`${name}Duotone` as keyof typeof all] as Icon | undefined;
      expect(twin, `${name} has no duotone twin`).toBeDefined();
      expect(twin!.iconName).toBe(`${I.iconName}-duotone`);
    }
  });

  it('has no twin of a filled icon (filled is already solid)', () => {
    expect(entries.filter(([k]) => k.includes('Filled') && k.includes('Duotone'))).toHaveLength(0);
  });

  it.each(duotones)('%s reuses its outline untouched and only adds tint in front of it', (name, D) => {
    const base = all[name.replace(/Duotone$/, '') as keyof typeof all] as Icon;
    // The outline's nodes are the tail of the duotone's, identical and in order: the drawing is never redrawn.
    expect(D.node.slice(D.node.length - base.node.length)).toEqual(base.node);
    // Everything before it is tint, and the tint is only ever the token — never a literal colour.
    for (const [, attrs] of D.node.slice(0, D.node.length - base.node.length)) {
      const painted = [attrs.fill, attrs.stroke].filter((v) => v != null && v !== 'none');
      expect(painted).not.toHaveLength(0);
      for (const v of painted) expect(v).toBe(TINT);
    }
  });

  it.each(duotones)('%s renders its tint behind the drawing', (_, D) => {
    const svg = renderToStaticMarkup(createElement(D));
    const tintAt = svg.indexOf(TINT);
    if (tintAt === -1) return; // untinted: a mark with no enclosed area (~37 of them), twin of the outline
    expect(tintAt).toBeLessThan(svg.indexOf('stroke="currentColor"') + svg.length);
    expect(svg.indexOf('currentColor', tintAt)).toBeGreaterThan(tintAt);
  });

  it('draws nothing extra when the tint is transparent, at any size', () => {
    const [, D] = duotones.find(([k]) => k === 'IconSearchDuotone')!;
    const svg = renderToStaticMarkup(createElement(D, { size: 32 }));
    expect(svg).toContain(TINT);
    expect(svg).toContain('width="32"');
    // The tint is one token with a sensible default, so an unthemed page still gets a second tone.
    expect(TINT).toBe('var(--syntara-icon-tint, color-mix(in oklab, currentColor 16%, transparent))');
  });
});

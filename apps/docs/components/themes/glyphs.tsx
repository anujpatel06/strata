/** Tiny monochrome glyphs for the shape and density toggles (ported from the Phase 1 generator). Decorative. */
import type { Density, Shape } from '@strata/theme-engine';

const CORNER_RADIUS: Record<Shape, number> = { sharp: 0, soft: 4, round: 8 };

/** A single corner stroke whose radius mirrors the shape (2px / 8px / 16px scaled to a 16px glyph). */
export function ShapeGlyph({ shape }: { shape: Shape }) {
  const r = CORNER_RADIUS[shape];
  const d = r === 0 ? 'M3 13V3h10' : `M3 13V${3 + r}a${r} ${r} 0 0 1 ${r}-${r}h${10 - r}`;
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" focusable="false">
      <path d={d} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Three rows, spaced loosely (comfortable) or tightly (compact). */
export function DensityGlyph({ density }: { density: Density }) {
  const ys = density === 'comfortable' ? [3, 8, 13] : [5, 8, 11];
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" focusable="false">
      {ys.map((y) => (
        <path key={y} d={`M3 ${y}h10`} stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
      ))}
    </svg>
  );
}

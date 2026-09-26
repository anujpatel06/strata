/** Tiny monochrome glyphs for the segmented controls. Decorative: always aria-hidden. */
import type { Density, Shape } from '@strata/theme-engine';

const CORNER_RADIUS: Record<Shape, number> = { sharp: 0, soft: 4, round: 8 };

/** A single corner stroke whose radius mirrors the shape (2px / 8px / 16px scaled to a 14px glyph). */
export function ShapeGlyph({ shape }: { shape: Shape }) {
  const r = CORNER_RADIUS[shape];
  const d = r === 0 ? 'M3 13V3h10' : `M3 13V${3 + r}a${r} ${r} 0 0 1 ${r}-${r}h${10 - r}`;
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d={d} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Three rows, spaced loosely (comfortable) or tightly (compact). */
export function DensityGlyph({ density }: { density: Density }) {
  const ys = density === 'comfortable' ? [3, 8, 13] : [5, 8, 11];
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      {ys.map((y) => (
        <path key={y} d={`M3 ${y}h10`} stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
      ))}
    </svg>
  );
}

/** Stacked, offset rounded layers — the Strata mark. */
export function StrataMark({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <rect x="1" y="3" width="12" height="4" rx="2" />
      <rect x="4" y="8" width="12" height="4" rx="2" fillOpacity="0.6" />
      <rect x="7" y="13" width="12" height="4" rx="2" fillOpacity="0.32" />
    </svg>
  );
}

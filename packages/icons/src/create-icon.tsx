/**
 * Syntara icons — style spec (ADR-014). Anuj chose the direction: "curvy and minimalist" (2026-09-27). Claude draws.
 *
 * Grid      24×24 viewBox; the drawing lives in the central 20×20 (2 → 22). Keylines: circle r=9 (±0.25),
 *           square 16–17, portrait 14×17, landscape 17×14. Nothing touches the viewBox edge.
 * Stroke    1.5 by default (one device pixel at 16px), round caps, round joins. Set per theme with
 *           --syntara-icon-stroke; the `stroke` prop overrides one icon.
 * Curves    Prefer an arc or a curve to a corner: rounded chevron tips, arc shoulders and handles, scalloped
 *           (not toothed) mechanical shapes. Box corners are 4.5 (large) / 3.25 (medium) / 2.5 (small), never sharp.
 * Minimal   Only the strokes needed to recognise the object: no inner detail lines, no decorative ticks, no
 *           shading. Aim for ≤ 3 subpaths. Dots are filled circles r≈1, not zero-length lines.
 * Metaphor  Common UI metaphors (people recognise them), drawn in this style. Brand logos are NOT redrawn.
 * Colour    currentColor only. Icons are decorative (aria-hidden) unless given an aria-label or title.
 * Duotone   An opt-in second layer (ADR-036, ./icons/duotone.ts): the outline is reused untouched and a tint layer
 *           is painted behind it. The outline drawing is never redrawn for duotone, which is why `node` is kept on
 *           the component — a duotone icon composes its twin's nodes rather than copying them.
 */
import type { JSX, SVGProps } from 'react';

export type IconNode = ReadonlyArray<readonly ['path' | 'circle' | 'rect' | 'line' | 'ellipse', Readonly<Record<string, string | number>>]>;

export interface IconProps extends Omit<SVGProps<SVGSVGElement>, 'stroke'> {
  /** Width and height. Number = px. Default '1.25em' so icons track the surrounding text size. */
  size?: number | string;
  /** Stroke width for this icon (wins over CSS). Default 1.5; CSS or --syntara-icon-stroke can restyle it. Same name as Tabler's prop. */
  stroke?: number | string;
  /** Accessible name. With it the icon is announced as an image; without it the icon is hidden from assistive tech. */
  'aria-label'?: string;
}

export type Icon = ((props: IconProps) => JSX.Element) & {
  displayName: string;
  iconName: string;
  /** The drawing this icon is built from. Kept so a duotone twin can reuse the outline instead of copying it. */
  node: IconNode;
};

export function createIcon(name: string, node: IconNode): Icon {
  const Component = ({ size = '1.25em', stroke, style, 'aria-label': label, ...rest }: IconProps): JSX.Element => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      // Default = presentation attribute, which any CSS rule (e.g. `stroke-width: var(--syntara-icon-stroke)`) overrides.
      // An explicit `stroke` prop is inline style, so it wins over CSS.
      strokeWidth={1.5}
      style={{ ...(stroke != null ? { strokeWidth: stroke } : null), flexShrink: 0, ...style }}
      data-syntara-icon={name}
      {...(label ? { role: 'img', 'aria-label': label } : { 'aria-hidden': true, focusable: false })}
      {...rest}
    >
      {node.map(([tag, attrs], i) => {
        const Tag = tag;
        return <Tag key={i} {...attrs} />;
      })}
    </svg>
  );
  const pascal = name.replace(/(^|-)([a-z0-9])/g, (_, __, c: string) => c.toUpperCase());
  Component.displayName = `Icon${pascal}`;
  Component.iconName = name;
  Component.node = node;
  return Component as Icon;
}

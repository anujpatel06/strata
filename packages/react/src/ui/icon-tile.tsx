'use client';

import type { HTMLAttributes, JSX, ReactNode, Ref } from 'react';
import { getAvatarTint, type AvatarTone } from './avatar';
import styles from './icon-tile.module.css';

const cx = (...c: Array<string | false | null | undefined>) => c.filter(Boolean).join(' ');

/**
 * Tile fills. Every tint is a background/foreground pair the theme engine contrast-checks in both schemes (the same
 * table as Avatar, see avatar.tsx and packages/theme-engine/src/contrast-pairs.json). The glyph is an icon, so it only
 * needs 3:1 (WCAG 1.4.11); every pair here is checked at 4.5:1.
 *
 *   tint      background                 foreground
 *   solid     action.primary.bg          action.primary.fg        (the brand fill, like a primary button)
 *   brand     action.secondary.bg        action.secondary.fg
 *   accent    accent.subtle              accent.text
 *   info …    feedback.<tone>.bg         feedback.<tone>.fg
 *   none      surface.sunken             text.default
 */
export type IconTileTint = 'auto' | 'none' | 'solid' | AvatarTone;
export type IconTileSize = 'sm' | 'md' | 'lg';

export interface IconTileProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'children'> {
  /** An icon from @syntara/icons (or any SVG). Ignored when `src` is set. */
  children?: ReactNode;
  /** An image instead of an icon, e.g. an asset or merchant logo. Needs `alt`. */
  src?: string;
  /**
   * Accessible name. With `src` it becomes the image's alt text. Without `alt` (and without `aria-label`) the tile is
   * decorative and hidden from assistive tech, which is right when a label sits next to it.
   */
  alt?: string;
  /**
   * Fill. `solid` = the brand fill; a tone = its soft, contrast-checked pair; `none` = neutral. `auto` picks a stable
   * tint from a hash of `name` (the same one Avatar uses), so an asset keeps its colour everywhere.
   * Defaults to `brand` for icons and `none` for images (a logo brings its own colours).
   */
  tint?: IconTileTint;
  /** Seed for `tint="auto"`, e.g. the asset's name. Falls back to `alt`. */
  name?: string;
  /** sm = 32px, md = 40px, lg = 48px. */
  size?: IconTileSize;
  ref?: Ref<HTMLSpanElement>;
}

/**
 * A rounded-square tile that holds an icon or a logo on a tinted or brand fill: asset lists, feature rows, nav
 * brand marks. Lit like glass: a rim light on the top-left edge and a top-edge sheen.
 */
export function IconTile({
  children,
  src,
  alt,
  tint,
  name,
  size = 'md',
  className,
  ...rest
}: IconTileProps): JSX.Element {
  const label = rest['aria-label'] ?? (src ? undefined : alt);
  const decorative = !label && !(src && alt);
  const picked = tint ?? (src ? 'none' : 'brand');
  const resolved = picked === 'auto' ? getAvatarTint(name ?? alt ?? '') : picked;

  return (
    <span
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={decorative || undefined}
      {...rest}
      data-tint={resolved}
      data-size={size}
      data-image={src ? true : undefined}
      className={cx(styles.tile, className)}
    >
      {src ? <img className={styles.image} src={src} alt={alt ?? ''} /> : children}
    </span>
  );
}

/**
 * Glass: a translucent, blurred surface for overlays (menus, popovers, dialogs, sticky nav).
 * Its opacity is solved, not picked: the lowest opacity at which text.default and text.subtle
 * still reach 4.5:1 on surface.raised composited over the WORST backdrop.
 *
 * Why black and white are the worst case: the composite's luminance rises monotonically with
 * each backdrop channel, and blur/saturate keep channels inside 0–255, so the darkest and
 * lightest composites come from a pure black or pure white backdrop. Browsers blend in 8-bit
 * sRGB (not linear light), so that's what we composite in, then round to hex like the checks do.
 */
import { contrastRatio, hexToRgb8, rgb8ToHex } from './color';
import type { Role, ResolvedColor, SchemeTheme } from './types';

/** Floor so glass still reads as a surface, not a tint. */
const GLASS_MIN_OPACITY = 0.6;
/** Backdrop blur, px. One value for every brand; blur doesn't affect the contrast guarantee. */
export const GLASS_BLUR = 20;
const TEXT_MIN = 4.5;
const BACKDROPS = ['#000000', '#ffffff'] as const;

/** surface over backdrop at `opacity`, blended per 8-bit sRGB channel. */
export function compositeHex(surfaceHex: string, backdropHex: string, opacity: number): string {
  const s = hexToRgb8(surfaceHex);
  const b = hexToRgb8(backdropHex);
  return rgb8ToHex([0, 1, 2].map((i) => s[i]! * opacity + b[i]! * (1 - opacity)) as [number, number, number]);
}

/** Lowest ratio of `textHex` on glass at `opacity`, across both worst-case backdrops. */
export function glassWorstRatio(surfaceHex: string, textHex: string, opacity: number): number {
  return Math.min(...BACKDROPS.map((bd) => contrastRatio(textHex, compositeHex(surfaceHex, bd, opacity))));
}

const GLASS_TEXT: readonly Role[] = ['text.default', 'text.subtle'];

export function solveGlass(roles: Record<Role, ResolvedColor>): SchemeTheme['glass'] {
  const surface = roles['surface.raised'].hex;
  const ok = (o: number) => GLASS_TEXT.every((r) => glassWorstRatio(surface, roles[r].hex, o) >= TEXT_MIN);
  // Hundredths so the token is a clean percentage; 1 is opaque and passes whenever the roles do.
  let opacity = 1;
  for (let p = Math.round(GLASS_MIN_OPACITY * 100); p <= 100; p++) {
    if (ok(p / 100)) {
      opacity = p / 100;
      break;
    }
  }
  return { opacity, blur: GLASS_BLUR };
}

/** Roles checked on glass (exported for the fuzz invariant). */
export const GLASS_TEXT_ROLES = GLASS_TEXT;

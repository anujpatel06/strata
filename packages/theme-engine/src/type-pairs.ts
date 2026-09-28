/**
 * Curated Google Fonts pairs. Stacks end with system fallbacks so text renders sensibly before
 * (or without) the web fonts. Arabic-capable pairs use headingTracking "0": letter-spacing breaks
 * joined Arabic script.
 */
import type { TypePair, TypePairId } from './types';

const SANS_FALLBACK = 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
const SERIF_FALLBACK = 'Georgia, Cambria, "Times New Roman", Times, serif';
const MONO_FALLBACK = 'ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace';
/** Tahoma and Segoe UI ship Arabic glyphs on Windows; system-ui covers macOS/iOS/Android. */
const ARABIC_FALLBACK = 'system-ui, -apple-system, "Segoe UI", Tahoma, "Geeza Pro", sans-serif';
/** Nirmala UI ships Devanagari on Windows, Kohinoor Devanagari on macOS/iOS; Android's system-ui is Noto. */
const DEVANAGARI_FALLBACK = 'system-ui, -apple-system, "Segoe UI", "Nirmala UI", "Kohinoor Devanagari", sans-serif';

const q = (family: string) => `"${family}"`;

export const TYPE_PAIRS: Record<TypePairId, TypePair> = {
  precise: {
    id: 'precise',
    label: 'Precise — Inter Tight / Inter',
    heading: `${q('Inter Tight')}, ${q('Inter')}, ${SANS_FALLBACK}`,
    body: `${q('Inter')}, ${SANS_FALLBACK}`,
    mono: `${q('JetBrains Mono')}, ${MONO_FALLBACK}`,
    headingTracking: '-0.01em',
    supportsArabic: false,
    googleFamilies: ['Inter Tight', 'Inter', 'JetBrains Mono'],
  },
  calm: {
    id: 'calm',
    label: 'Calm — Source Serif 4 / Source Sans 3',
    heading: `${q('Source Serif 4')}, ${SERIF_FALLBACK}`,
    body: `${q('Source Sans 3')}, ${SANS_FALLBACK}`,
    mono: `${q('Source Code Pro')}, ${MONO_FALLBACK}`,
    headingTracking: '0',
    supportsArabic: false,
    googleFamilies: ['Source Serif 4', 'Source Sans 3', 'Source Code Pro'],
  },
  friendly: {
    id: 'friendly',
    label: 'Friendly — Plus Jakarta Sans',
    heading: `${q('Plus Jakarta Sans')}, ${SANS_FALLBACK}`,
    body: `${q('Plus Jakarta Sans')}, ${SANS_FALLBACK}`,
    mono: `${q('JetBrains Mono')}, ${MONO_FALLBACK}`,
    headingTracking: '-0.01em',
    supportsArabic: false,
    googleFamilies: ['Plus Jakarta Sans', 'JetBrains Mono'],
  },
  technical: {
    id: 'technical',
    label: 'Technical — Space Grotesk / IBM Plex Sans',
    heading: `${q('Space Grotesk')}, ${SANS_FALLBACK}`,
    body: `${q('IBM Plex Sans')}, ${SANS_FALLBACK}`,
    mono: `${q('IBM Plex Mono')}, ${MONO_FALLBACK}`,
    headingTracking: '-0.01em',
    supportsArabic: false,
    googleFamilies: ['Space Grotesk', 'IBM Plex Sans', 'IBM Plex Mono'],
  },
  'bilingual-round': {
    id: 'bilingual-round',
    label: 'Bilingual round — Readex Pro / IBM Plex Sans Arabic',
    // Readex Pro and IBM Plex Sans Arabic both carry Latin glyphs; IBM Plex Sans is the Latin fallback.
    heading: `${q('Readex Pro')}, ${q('IBM Plex Sans Arabic')}, ${q('IBM Plex Sans')}, ${ARABIC_FALLBACK}`,
    body: `${q('IBM Plex Sans Arabic')}, ${q('IBM Plex Sans')}, ${ARABIC_FALLBACK}`,
    mono: `${q('IBM Plex Mono')}, ${MONO_FALLBACK}`,
    headingTracking: '0',
    supportsArabic: true,
    googleFamilies: ['Readex Pro', 'IBM Plex Sans Arabic', 'IBM Plex Mono'],
  },
  'bilingual-classic': {
    id: 'bilingual-classic',
    label: 'Bilingual classic — Noto Kufi Arabic / Noto Sans Arabic',
    // Noto Sans Arabic is Arabic-only, so Latin runs fall through to Noto Sans (loaded too).
    heading: `${q('Noto Kufi Arabic')}, ${q('Noto Sans Arabic')}, ${q('Noto Sans')}, ${ARABIC_FALLBACK}`,
    body: `${q('Noto Sans Arabic')}, ${q('Noto Sans')}, ${ARABIC_FALLBACK}`,
    mono: `${q('IBM Plex Mono')}, ${MONO_FALLBACK}`,
    headingTracking: '0',
    supportsArabic: true,
    googleFamilies: ['Noto Kufi Arabic', 'Noto Sans Arabic', 'Noto Sans', 'IBM Plex Mono'],
  },
  // Editorial: a variable serif with real italics for headings and numbers, a friendly grotesk for UI.
  // Anuj's KYB/care prototype voice (ADR-015). Fraunces' optical sizes keep display numbers crisp.
  editorial: {
    id: 'editorial',
    label: 'Editorial — Fraunces / DM Sans',
    heading: `${q('Fraunces')}, ${SERIF_FALLBACK}`,
    body: `${q('DM Sans')}, ${SANS_FALLBACK}`,
    mono: `${q('DM Mono')}, ${MONO_FALLBACK}`,
    headingTracking: '-0.01em',
    supportsArabic: false,
    googleFamilies: ['Fraunces', 'DM Sans', 'DM Mono'],
    italicFamilies: ['Fraunces'],
    opticalSizeFamilies: { Fraunces: '9..144' },
  },
  // Modern: Geist (Vercel, SIL OFL) for everything. Anuj picked it over Inter for the house brand after a
  // side-by-side of the free fonts premium product sites ship (2026-09-27).
  modern: {
    id: 'modern',
    label: 'Modern — Geist / Geist',
    heading: `${q('Geist')}, ${SANS_FALLBACK}`,
    body: `${q('Geist')}, ${SANS_FALLBACK}`,
    mono: `${q('Geist Mono')}, ${MONO_FALLBACK}`,
    headingTracking: '-0.01em',
    supportsArabic: false,
    googleFamilies: ['Geist', 'Geist Mono'],
  },
  // Devanagari + Latin (ADR-020): Hindi product copy mixes both (prices, SKUs, English brand words). Mukta (Ek Type, SIL OFL)
  // over Noto Sans Devanagari, Hind, Anek Devanagari, Poppins and Baloo 2, measured with scripts/check-script-clipping.mjs:
  // the lowest line height with no clipped ink, and Chrome's text-overflow ellipsis never leaves a half letter.
  // Claude recommended, pending Anuj.
  'bilingual-devanagari': {
    id: 'bilingual-devanagari',
    label: 'Bilingual Devanagari — Mukta',
    heading: `${q('Mukta')}, ${DEVANAGARI_FALLBACK}`,
    body: `${q('Mukta')}, ${DEVANAGARI_FALLBACK}`,
    mono: `${q('JetBrains Mono')}, ${MONO_FALLBACK}`,
    headingTracking: '-0.01em',
    supportsArabic: false,
    googleFamilies: ['Mukta', 'JetBrains Mono'],
    // Measured, not chosen: `node scripts/check-script-clipping.mjs --pairs=bilingual-devanagari --lh=<value>` renders
    // stacked conjuncts, matras above and below and mixed Latin at every size (12–48px), 400 and 700, DPR 1 and 2, four
    // sub-pixel positions. 1.43 clips (11 cases, ai-matra and reph tops at 12–14px); 1.44 is the smallest value with no
    // ink outside the line box (worst margin 0 px, 13px at DPR 1), and every value from 1.44 to 1.52 passes. So tight and
    // snug are 1.44 (both below it clip); normal keeps the Latin 1.5 (passes). Min size: the anusvara and nukta stay
    // separate from their letter down to 10px at DPR 2, so the scale's 12px floor stands. Caps tracking 0: 0.08em breaks
    // the headline 9 times in 5 words at 12px; the size curve (≤ 0.001em) breaks none.
    script: {
      name: 'devanagari',
      lineHeight: { tight: 1.44, snug: 1.44, normal: 1.5 },
      minFontSize: 12,
      capsTracking: '0',
    },
  },
};

const MONO_FAMILIES = new Set(['JetBrains Mono', 'Source Code Pro', 'IBM Plex Mono', 'DM Mono', 'Geist Mono']);

/**
 * Google Fonts css2 URL for a pair: text families at 400;500;600;700, mono at 400;500,
 * display=swap. Families are de-duplicated and kept in pair order.
 */
export function googleFontsHref(pair: TypePair): string {
  const families = [...new Set(pair.googleFamilies)];
  const params = families.map((family) => {
    const weights = MONO_FAMILIES.has(family) ? ['400', '500'] : ['400', '500', '600', '700'];
    const name = family.trim().replace(/\s+/g, '+');
    const opsz = pair.opticalSizeFamilies?.[family];
    if (opsz) {
      // Variable request: opsz + weight ranges, so the browser picks the optical cut per font-size.
      const wght = `${weights[0]}..${weights[weights.length - 1]}`;
      const ital = pair.italicFamilies?.includes(family);
      return ital
        ? `family=${name}:ital,opsz,wght@0,${opsz},${wght};1,${opsz},${wght}`
        : `family=${name}:opsz,wght@${opsz},${wght}`;
    }
    if (pair.italicFamilies?.includes(family)) {
      // Google's css2 axis order: ital,wght — upright tuples first, then italic ones.
      const tuples = [...weights.map((w) => `0,${w}`), ...weights.map((w) => `1,${w}`)];
      return `family=${name}:ital,wght@${tuples.join(';')}`;
    }
    return `family=${name}:wght@${weights.join(';')}`;
  });
  return `https://fonts.googleapis.com/css2?${params.join('&')}&display=swap`;
}

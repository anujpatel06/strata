import { useEffect } from 'react';
import { TYPE_PAIRS, googleFontsHref, type TypePair, type TypePairId } from '@syntara/theme-engine';

/** Stylesheet hrefs already injected into <head>. Module-level so each pair loads at most once per page. */
const injected = new Set<string>();

/** Injects the Google Fonts stylesheet for a type pair once. Safe to call repeatedly. */
export function loadTypePairFonts(pair: TypePair): void {
  if (typeof document === 'undefined') return;
  let href: string;
  try {
    href = googleFontsHref(pair);
  } catch {
    return;
  }
  if (!href || injected.has(href)) return;
  injected.add(href);
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = href;
  link.dataset.syntaraFonts = pair.id;
  document.head.appendChild(link);
}

export function findTypePair(id: string): TypePair | undefined {
  return Object.hasOwn(TYPE_PAIRS, id) ? TYPE_PAIRS[id as TypePairId] : undefined;
}

/**
 * Loads the selected pair on demand and preloads the given ids (the three tenant pairs) on start,
 * so switching presets never flashes fallback fonts.
 */
export function useTypePairFonts(selected: TypePairId, preload: readonly TypePairId[]): void {
  const preloadKey = preload.join('|');
  useEffect(() => {
    for (const id of preloadKey.split('|')) {
      const pair = findTypePair(id);
      if (pair) loadTypePairFonts(pair);
    }
  }, [preloadKey]);

  useEffect(() => {
    const pair = findTypePair(selected);
    if (pair) loadTypePairFonts(pair);
  }, [selected]);
}

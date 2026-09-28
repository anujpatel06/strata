'use client';

import { generateTheme, googleFontsHref, type BrandInput, type Theme } from '@syntara/theme-engine';
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type Dispatch,
  type ReactNode,
} from 'react';
import { brandDiff, findPreset, reducer, toSearch, type ThemePreset, type ThemesAction, type ThemesState } from './state';

interface ThemesContextValue {
  state: ThemesState;
  dispatch: Dispatch<ThemesAction>;
  presets: readonly ThemePreset[];
  /** The preset the inputs started from. Its locale and content stay while inputs are edited. */
  preset: ThemePreset;
  /** The generated theme (or the last good one if generation ever throws). */
  theme: Theme;
  /** True when any input differs from the preset. */
  edited: boolean;
  /** Each preset's own theme, for the preset cards. */
  presetThemes: Record<string, Theme>;
}

const ThemesContext = createContext<ThemesContextValue | null>(null);

export function useThemes(): ThemesContextValue {
  const value = useContext(ThemesContext);
  if (!value) throw new Error('useThemes() must be used inside <ThemesProvider>');
  return value;
}

function safeGenerate(input: BrandInput): Theme | null {
  try {
    return generateTheme(input);
  } catch (error) {
    console.error('Syntara /themes: could not generate a theme for', input, error);
    return null;
  }
}

/** Adds the type pair's Google Fonts stylesheet once. Same data attribute as the site's FontLoader, so neither loads it twice. */
function useTypePairFont(theme: Theme) {
  const href = useMemo(() => {
    try {
      return googleFontsHref(theme.typePair);
    } catch {
      return '';
    }
  }, [theme.typePair]);
  useEffect(() => {
    if (!href) return;
    if (document.querySelector(`link[data-syntara-font][href="${CSS.escape(href)}"]`)) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    link.dataset.syntaraFont = '';
    document.head.append(link);
  }, [href]);
}

/**
 * Returns `message` for a live region, but only once it has been stable for `delayMs`.
 * The first message is not announced, so screen readers don't hear a status on page load.
 */
export function useDebouncedAnnouncement(message: string, delayMs = 600): string {
  const [announced, setAnnounced] = useState('');
  const initial = useRef(message);
  const changed = useRef(false);
  useEffect(() => {
    if (!changed.current && message === initial.current) return;
    changed.current = true;
    const timer = window.setTimeout(() => setAnnounced(message), delayMs);
    return () => window.clearTimeout(timer);
  }, [message, delayMs]);
  return announced;
}

/**
 * Owns the /themes state. Initialised from the query string on the server, then mirrored back with
 * history.replaceState — Next's router picks that up without a server round trip, so typing a hex
 * doesn't refetch the page, and the scroll position never moves.
 */
export function ThemesProvider({
  presets,
  initial,
  children,
}: {
  presets: readonly ThemePreset[];
  initial: ThemesState;
  children: ReactNode;
}) {
  const [state, dispatch] = useReducer(reducer, initial);
  const preset = findPreset(presets, state.tenant);

  const presetThemes = useMemo(() => {
    const out: Record<string, Theme> = {};
    for (const p of presets) {
      const t = safeGenerate(p.brand);
      if (t) out[p.id] = t;
    }
    return out;
  }, [presets]);

  // Inputs only ever hold valid values, but if generation still fails keep the last good theme on screen.
  const generated = useMemo(() => safeGenerate(state.brand), [state.brand]);
  const lastGood = useRef<Theme | null>(generated);
  useEffect(() => {
    if (generated) lastGood.current = generated;
  }, [generated]);
  const theme = (generated ?? lastGood.current ?? presetThemes[preset.id]) as Theme;

  useTypePairFont(theme);

  useEffect(() => {
    try {
      const { pathname, search, hash } = window.location;
      const next = toSearch(state, presets, search);
      if (`?${next}` === search) return;
      window.history.replaceState(window.history.state, '', `${pathname}?${next}${hash}`);
    } catch {
      // Sandboxed frames can refuse history access. The page still works; the link just won't update.
    }
  }, [state, presets]);

  const edited = brandDiff(state.brand, preset).length > 0;

  const value = useMemo<ThemesContextValue>(
    () => ({ state, dispatch, presets, preset, theme, edited, presetThemes }),
    [state, presets, preset, theme, edited, presetThemes],
  );
  return <ThemesContext.Provider value={value}>{children}</ThemesContext.Provider>;
}

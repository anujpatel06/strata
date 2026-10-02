'use client';

import { useLocale } from '@syntara/react';
import ar from './ar.json';
import hi from './hi.json';

/**
 * Docs-only: the words in an example, in the preview's language. The preview's ThemeScope takes each tenant's
 * locale (Qamar ar-AE, Haat hi-IN), and `t('Save draft')` looks the English up in that language's list,
 * falling back to the English when there is no entry.
 *
 * The Code tab never shows this: apps/docs/lib/examples.ts strips the import, the `useCopy()` line and the
 * `t()` wrappers, so readers copy the plain English example. Keep calls to a single string literal,
 * `t('…')` or `t("…")`, so that stripping stays exact.
 */
const LISTS: Record<string, Record<string, string>> = { ar, hi };

export function useCopy(): (english: string) => string {
  const language = useLocale().locale.split('-')[0] ?? 'en';
  const list = LISTS[language];
  return (english) => list?.[english] ?? english;
}

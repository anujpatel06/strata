'use client';

import { useEffect } from 'react';

/**
 * Tenant type pairs are only needed inside previews, so their stylesheets load after hydration
 * instead of blocking first paint. The house pair is linked in <head>.
 */
export function FontLoader({ hrefs }: { hrefs: string[] }) {
  useEffect(() => {
    const add = () => {
      for (const href of hrefs) {
        if (document.querySelector(`link[data-syntara-font][href="${CSS.escape(href)}"]`)) continue;
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = href;
        link.dataset.syntaraFont = '';
        document.head.append(link);
      }
    };
    if ('requestIdleCallback' in window) {
      const id = window.requestIdleCallback(add, { timeout: 1500 });
      return () => window.cancelIdleCallback(id);
    }
    const id = setTimeout(add, 200);
    return () => clearTimeout(id);
  }, [hrefs]);
  return null;
}

'use client';

import { useEffect, useState } from 'react';

/** The site's effective colour scheme: <html data-strata-scheme>, or the OS preference when it is "auto". */
export function useSiteScheme(): 'light' | 'dark' {
  const [scheme, setScheme] = useState<'light' | 'dark'>('light');
  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const read = () => {
      const attr = document.documentElement.getAttribute('data-strata-scheme');
      setScheme(attr === 'dark' || (attr !== 'light' && media.matches) ? 'dark' : 'light');
    };
    read();
    const observer = new MutationObserver(read);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-strata-scheme'] });
    media.addEventListener('change', read);
    return () => {
      observer.disconnect();
      media.removeEventListener('change', read);
    };
  }, []);
  return scheme;
}

'use client';

import { IconDeviceDesktop, IconMoon, IconSun } from '@syntara/icons';
import { Button, Tooltip, TooltipTrigger } from '@syntara/react';
import { useEffect, useState } from 'react';
import { SCHEME_STORAGE_KEY, type SchemePreference } from '@/lib/scheme';
import styles from './site-header.module.css';

const NEXT: Record<SchemePreference, SchemePreference> = { light: 'dark', dark: 'auto', auto: 'light' };
const LABEL: Record<SchemePreference, string> = { light: 'Light', dark: 'Dark', auto: 'System' };

function read(): SchemePreference {
  const v = document.documentElement.getAttribute('data-syntara-scheme');
  return v === 'light' || v === 'dark' ? v : 'auto';
}

/**
 * Cycles light → dark → system. The icon is chosen by CSS from <html data-syntara-scheme>, so the
 * server-rendered button is already right before hydration.
 */
export function SchemeToggle() {
  const [scheme, setScheme] = useState<SchemePreference>('auto');
  useEffect(() => setScheme(read()), []);

  const cycle = () => {
    const next = NEXT[read()];
    document.documentElement.setAttribute('data-syntara-scheme', next);
    try {
      if (next === 'auto') localStorage.removeItem(SCHEME_STORAGE_KEY);
      else localStorage.setItem(SCHEME_STORAGE_KEY, next);
    } catch {
      /* storage unavailable (private mode) — the choice lasts for this page view */
    }
    setScheme(next);
  };

  const label = `Colour scheme: ${LABEL[scheme]}. Switch to ${LABEL[NEXT[scheme]].toLowerCase()}`;
  return (
    <TooltipTrigger delay={400}>
      <Button variant="ghost" size="icon" aria-label={label} onPress={cycle} className={styles.iconButton}>
        <IconSun className={styles.schemeLight} aria-hidden />
        <IconMoon className={styles.schemeDark} aria-hidden />
        <IconDeviceDesktop className={styles.schemeAuto} aria-hidden />
      </Button>
      <Tooltip>{LABEL[scheme]} theme</Tooltip>
    </TooltipTrigger>
  );
}

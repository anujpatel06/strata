'use client';

import { IconDeviceDesktop, IconMoon, IconSun } from '@tabler/icons-react';
import { Button, Tooltip, TooltipTrigger } from '@strata/react';
import { useEffect, useState } from 'react';
import { SCHEME_STORAGE_KEY, type SchemePreference } from '@/lib/scheme';
import styles from './site-header.module.css';

const NEXT: Record<SchemePreference, SchemePreference> = { light: 'dark', dark: 'auto', auto: 'light' };
const LABEL: Record<SchemePreference, string> = { light: 'Light', dark: 'Dark', auto: 'System' };

function read(): SchemePreference {
  const v = document.documentElement.getAttribute('data-strata-scheme');
  return v === 'light' || v === 'dark' ? v : 'auto';
}

/**
 * Cycles light → dark → system. The icon is chosen by CSS from <html data-strata-scheme>, so the
 * server-rendered button is already right before hydration.
 */
export function SchemeToggle() {
  const [scheme, setScheme] = useState<SchemePreference>('auto');
  useEffect(() => setScheme(read()), []);

  const cycle = () => {
    const next = NEXT[read()];
    document.documentElement.setAttribute('data-strata-scheme', next);
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
        <IconSun className={styles.schemeLight} aria-hidden stroke={1.75} />
        <IconMoon className={styles.schemeDark} aria-hidden stroke={1.75} />
        <IconDeviceDesktop className={styles.schemeAuto} aria-hidden stroke={1.75} />
      </Button>
      <Tooltip>{LABEL[scheme]} theme</Tooltip>
    </TooltipTrigger>
  );
}

'use client';

import { IconTerminal2 } from '@tabler/icons-react';
import { Tab, TabList, TabPanel, Tabs } from '@strata/react';
import { useEffect, useRef, useState, type Key } from 'react';
import { CopyButton } from './code-frame';
import styles from './package-tabs.module.css';
import code from './code.module.css';

export type PackageManager = 'pnpm' | 'npm' | 'yarn' | 'bun';
const MANAGERS: readonly PackageManager[] = ['pnpm', 'npm', 'yarn', 'bun'];
const STORAGE_KEY = 'strata-docs-pm';
const EVENT = 'strata-docs-pm';

function isManager(v: unknown): v is PackageManager {
  return typeof v === 'string' && (MANAGERS as readonly string[]).includes(v);
}

export function PackageTabs({ html }: { html: Record<PackageManager, string> }) {
  const [pm, setPm] = useState<PackageManager>('pnpm');
  const panels = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (isManager(stored)) setPm(stored);
    } catch {
      /* storage unavailable */
    }
    const sync = (e: Event) => {
      const next = (e as CustomEvent<unknown>).detail;
      if (isManager(next)) setPm(next);
    };
    window.addEventListener(EVENT, sync);
    return () => window.removeEventListener(EVENT, sync);
  }, []);

  const select = (key: Key) => {
    if (!isManager(key)) return;
    setPm(key);
    try {
      localStorage.setItem(STORAGE_KEY, key);
    } catch {
      /* storage unavailable */
    }
    window.dispatchEvent(new CustomEvent(EVENT, { detail: key }));
  };

  return (
    <div className={styles.root}>
      <Tabs selectedKey={pm} onSelectionChange={select} className={styles.tabs}>
        <div className={styles.bar}>
          <IconTerminal2 aria-hidden size={14} stroke={1.75} className={styles.icon} />
          <TabList aria-label="Package manager" className={styles.list}>
            {MANAGERS.map((m) => (
              <Tab key={m} id={m} className={styles.tab}>
                {m}
              </Tab>
            ))}
          </TabList>
          <CopyButton
            label="Copy command"
            getText={() => panels.current?.querySelector('pre')?.textContent ?? ''}
          />
        </div>
        <div ref={panels} className={code.body}>
          {MANAGERS.map((m) => (
            <TabPanel key={m} id={m} className={styles.panel}>
              <div dangerouslySetInnerHTML={{ __html: html[m] }} />
            </TabPanel>
          ))}
        </div>
      </Tabs>
    </div>
  );
}

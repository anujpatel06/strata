'use client';

import { IconFileCode } from '@tabler/icons-react';
import { Alert, Link, Tab, TabList, TabPanel, Tabs, ToggleButton, ToggleButtonGroup } from '@strata/react';
import { toCSS, toDTCG, toFigmaFiles, toShadcnCSS, type Theme } from '@strata/theme-engine';
import { useDeferredValue, useMemo, useState, type ReactNode } from 'react';
import type { Key, Selection } from 'react-aria-components';
import { CodeViewer, type ExportFile } from './code-viewer';
import { FORMATS, oneOf, type ExportFormat } from './state';
import { useThemes } from './themes-provider';
import styles from './panels.module.css';

export interface RegistryCommands {
  /** `shadcn add @strata/theme-<id>` — the shadcn bridge. */
  theme: ReactNode;
  /** `shadcn add @strata/strata-tokens-<id>` — Strata's own tokens. */
  tokens: ReactNode;
}

const FORMAT_LABEL: Record<ExportFormat, string> = {
  css: 'CSS',
  dtcg: 'DTCG 2025.10',
  figma: 'Figma',
  shadcn: 'shadcn',
  registry: 'Registry',
};

const NOTES: Record<Exclude<ExportFormat, 'registry'>, ReactNode> = {
  css: (
    <>
      Every <code>--strata-*</code> variable on <code>:root</code>: light, dark (<code>data-strata-scheme=&quot;dark&quot;</code>, or{' '}
      <code>&quot;auto&quot;</code> to follow the OS) and both densities.
    </>
  ),
  dtcg: (
    <>
      W3C Design Tokens Format Module 2025.10 — colour and dimension objects, <code>{'{alias}'}</code> references, Strata
      metadata under <code>$extensions</code>.
    </>
  ),
  figma: (
    <>
      One file per collection mode, for a Figma variables import plugin. Hex strings and plain numbers, because most plugins
      still read the older draft (ADR-010).
    </>
  ),
  shadcn: (
    <>
      Paste into your shadcn <code>globals.css</code> — it replaces the <code>:root</code> and <code>.dark</code> blocks. The same
      contrast-checked roles, as <code>oklch()</code>.
    </>
  ),
};

function buildFiles(theme: Theme, format: ExportFormat, slug: string): ExportFile[] {
  switch (format) {
    case 'css':
      return [{ name: `${slug}.css`, content: toCSS(theme), mime: 'text/css', lang: 'css' }];
    case 'dtcg':
      return [{ name: `${slug}.tokens.json`, content: JSON.stringify(toDTCG(theme), null, 2), mime: 'application/json', lang: 'json' }];
    case 'figma':
      return Object.entries(toFigmaFiles(theme)).map(([name, doc]) => ({
        name,
        content: JSON.stringify(doc, null, 2),
        mime: 'application/json',
        lang: 'json' as const,
      }));
    case 'shadcn':
      return [{ name: `${slug}.shadcn.css`, content: toShadcnCSS(theme), mime: 'text/css', lang: 'css' }];
    default:
      return [];
  }
}

function firstKey(keys: Selection): string | undefined {
  if (keys === 'all') return undefined;
  const [k] = keys;
  return k == null ? undefined : String(k);
}

function Files({ files }: { files: ExportFile[] }) {
  const [selected, setSelected] = useState<string | null>(null);
  const file = files.find((f) => f.name === selected) ?? files[0];
  if (!file) return null;
  if (files.length === 1) return <CodeViewer file={file} />;
  return (
    <div className={styles.fileSplit}>
      <ToggleButtonGroup
        aria-label="Figma variable files"
        orientation="vertical"
        size="sm"
        disallowEmptySelection
        selectedKeys={[file.name]}
        onSelectionChange={(keys) => {
          const next = firstKey(keys);
          if (next) setSelected(next);
        }}
        className={styles.fileList}
      >
        {files.map((f) => (
          <ToggleButton key={f.name} id={f.name} className={styles.fileItem}>
            <IconFileCode aria-hidden stroke={1.75} />
            <span className={styles.fileName}>{f.name}</span>
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
      <CodeViewer file={file} />
    </div>
  );
}

function Registry({ commands }: { commands: RegistryCommands | undefined }) {
  const { preset, edited } = useThemes();
  return (
    <div className={styles.registry}>
      <Alert tone={edited ? 'warning' : 'info'} title={edited ? 'Your edits aren’t in the registry' : 'Presets only'}>
        The registry serves each preset exactly as published. {edited ? `You’ve changed ${preset.label}’s inputs, so ` : 'For '}
        custom colours, copy the <strong>CSS</strong> export (or <strong>shadcn</strong> for a shadcn project) instead.
      </Alert>
      <section className={styles.install}>
        <h3 className={styles.h3}>Strata components</h3>
        <p className={styles.sub}>
          {preset.label}’s <code>--strata-*</code> tokens as <code>styles/strata-{preset.id}.css</code>. Needs the{' '}
          <code>@strata</code> namespace in <code>components.json</code> —{' '}
          <Link href="/docs/registry">set it up once</Link>.
        </p>
        {commands?.tokens}
      </section>
      <section className={styles.install}>
        <h3 className={styles.h3}>An existing shadcn/ui project</h3>
        <p className={styles.sub}>
          The shadcn bridge: {preset.label}’s roles as shadcn’s own variables, light and dark. No Strata components needed.
        </p>
        {commands?.theme}
      </section>
    </div>
  );
}

export function ExportPanel({ registry }: { registry: Record<string, RegistryCommands> }) {
  const { theme: liveTheme, state, dispatch, preset, edited } = useThemes();
  const theme = useDeferredValue(liveTheme);
  const slug = `${preset.id}${edited ? '-custom' : ''}`;
  const format = state.format;
  const files = useMemo(() => buildFiles(theme, format, slug), [theme, format, slug]);

  return (
    <Tabs
      variant="pill"
      selectedKey={format}
      onSelectionChange={(key: Key) => {
        const next = oneOf(String(key), FORMATS);
        if (next) dispatch({ type: 'setFormat', format: next });
      }}
      className={styles.exportTabs}
    >
      <TabList aria-label="Export format">
        {FORMATS.map((f) => (
          <Tab key={f} id={f}>
            {FORMAT_LABEL[f]}
          </Tab>
        ))}
      </TabList>
      {FORMATS.map((f) => (
        <TabPanel key={f} id={f} className={styles.exportPanel}>
          {f === 'registry' ? (
            <Registry commands={registry[preset.id]} />
          ) : (
            <>
              <p className={styles.sub}>{NOTES[f]}</p>
              <Files files={files} />
            </>
          )}
        </TabPanel>
      ))}
    </Tabs>
  );
}

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { IconAlertTriangle, IconDownload, IconMoon, IconSun } from '@strata/icons';
import { generateTheme, normalizeHex, type Scheme, type Theme } from '@strata/theme-engine';
import { AccessibilityPanel } from './components/AccessibilityPanel';
import { Header } from './components/Header';
import { InputsPanel } from './components/InputsPanel';
import type { PresetSwatches } from './components/PresetPicker';
import { PreviewPanel } from './components/PreviewPanel';
import { Segmented, type SegmentedOption } from './components/Segmented';
import { Tabs, panelId, tabId, type TabItem } from './components/Tabs';
import { TokensPanel } from './components/TokensPanel';
import ui from './components/ui.module.css';
import { useDebouncedAnnouncement } from './hooks/useDebouncedAnnouncement';
import { useTypePairFonts } from './hooks/useTypePairFonts';
import { TENANTS, getTenant, type TenantId } from './tenants';
import { TABS, brandDiff, useAppState, type Tab } from './url-state';
import styles from './App.module.css';

const TAB_PREFIX = 'gen';
const TAB_LABELS: Record<Tab, string> = { preview: 'Preview', accessibility: 'Accessibility', tokens: 'Tokens' };

const SCHEME_OPTIONS: ReadonlyArray<SegmentedOption<Scheme>> = [
  { value: 'light', label: 'Light', icon: <IconSun size={14} stroke={2} aria-hidden="true" /> },
  { value: 'dark', label: 'Dark', icon: <IconMoon size={14} stroke={2} aria-hidden="true" /> },
];

const TENANT_TYPE_PAIRS = TENANTS.map((t) => t.brand.typePair);

/** Preset themes are generated once: they feed the preset-card swatches and act as a last-resort fallback. */
function generatePresetThemes(): Record<TenantId, Theme> {
  const out = {} as Record<TenantId, Theme>;
  for (const t of TENANTS) out[t.id] = generateTheme(t.brand);
  return out;
}

function safeGenerate(input: Parameters<typeof generateTheme>[0]): Theme | null {
  try {
    return generateTheme(input);
  } catch (error) {
    console.error('Strata: could not generate a theme for', input, error);
    return null;
  }
}

export function App() {
  const [state, dispatch] = useAppState();
  const tenant = getTenant(state.tenant);
  const presetThemes = useMemo(generatePresetThemes, []);

  // Inputs only ever hold valid values (drafts live in the fields), but if generation still fails,
  // keep showing the last good theme rather than a broken preview.
  const generated = useMemo(() => safeGenerate(state.brand), [state.brand]);
  const lastGood = useRef<Theme>(generated ?? presetThemes[state.tenant]);
  useEffect(() => {
    if (generated) lastGood.current = generated;
  }, [generated]);
  const theme = generated ?? lastGood.current;

  useTypePairFonts(state.brand.typePair, TENANT_TYPE_PAIRS);

  const edited = brandDiff(state.brand, state.tenant).length > 0;

  const presetSwatches = useMemo(() => {
    const out = {} as Record<TenantId, PresetSwatches>;
    for (const t of TENANTS) {
      const primary = normalizeHex(t.brand.primary);
      out[t.id] = {
        primary,
        accent: t.brand.accent ? normalizeHex(t.brand.accent) : primary,
        canvas: presetThemes[t.id].schemes[state.scheme].roles['surface.canvas'].hex,
      };
    }
    return out;
  }, [presetThemes, state.scheme]);

  const { summary } = theme;
  const announcement = useDebouncedAnnouncement(
    `Theme updated: ${summary.passed} of ${summary.checks} checks pass, ${summary.adjustments} adjustment${
      summary.adjustments === 1 ? '' : 's'
    }.`,
  );

  // Tabs ------------------------------------------------------------------
  const mainRef = useRef<HTMLElement>(null);
  const [focusExport, setFocusExport] = useState(false);
  const onExportFocused = useCallback(() => setFocusExport(false), []);

  const selectTab = (tab: Tab) => {
    if (tab === state.tab) return;
    dispatch({ type: 'setTab', tab });
    // Desktop: main scrolls independently, so start each tab at the top. (No-op when the page scrolls.)
    if (mainRef.current) mainRef.current.scrollTop = 0;
  };

  const tabs: Array<TabItem<Tab>> = TABS.map((id) => {
    if (id !== 'accessibility') return { id, label: TAB_LABELS[id] };
    return {
      id,
      label: TAB_LABELS[id],
      badges: [
        { text: String(summary.adjustments), srText: summary.adjustments === 1 ? 'adjustment' : 'adjustments' },
        ...(summary.failed > 0
          ? [
              {
                text: String(summary.failed),
                srText: summary.failed === 1 ? 'failing check' : 'failing checks',
                tone: 'fail' as const,
                icon: <IconAlertTriangle size={12} stroke={2.25} aria-hidden="true" />,
              },
            ]
          : []),
      ],
    };
  });

  const onExport = () => {
    dispatch({ type: 'setTab', tab: 'tokens' });
    setFocusExport(true);
  };

  return (
    <div className={styles.app}>
      <a className={styles.skip} href={`#${panelId(TAB_PREFIX, state.tab)}`}>
        Skip to {TAB_LABELS[state.tab].toLowerCase()}
      </a>

      <Header summary={summary} />

      <div className={styles.body}>
        <aside className={styles.aside} aria-label="Brand inputs">
          <InputsPanel state={state} dispatch={dispatch} edited={edited} presetSwatches={presetSwatches} />
        </aside>

        <main ref={mainRef} className={styles.main}>
          <div className={styles.toolbar}>
            <div className={styles.toolbarInner}>
              <Tabs label="Generator views" idPrefix={TAB_PREFIX} tabs={tabs} selected={state.tab} onSelect={selectTab} />
              <div className={styles.toolbarEnd}>
                <Segmented
                  legend="Preview scheme"
                  legendHidden
                  size="sm"
                  options={SCHEME_OPTIONS}
                  value={state.scheme}
                  onChange={(scheme) => dispatch({ type: 'setScheme', scheme })}
                  className={styles.schemeToggle}
                />
                <button type="button" className={`${ui.btn} ${ui.btnInk} ${styles.exportBtn}`} onClick={onExport}>
                  <IconDownload size={16} aria-hidden="true" />
                  Export
                </button>
              </div>
            </div>
          </div>

          <div className={styles.panels}>
            {TABS.map((id) => {
              const active = id === state.tab;
              return (
                <div
                  key={id}
                  id={panelId(TAB_PREFIX, id)}
                  role="tabpanel"
                  aria-labelledby={tabId(TAB_PREFIX, id)}
                  tabIndex={0}
                  hidden={!active}
                  className={styles.panel}
                >
                  {active && id === 'preview' && (
                    <PreviewPanel theme={theme} scheme={state.scheme} density={state.brand.density} tenant={tenant} />
                  )}
                  {active && id === 'accessibility' && <AccessibilityPanel theme={theme} scheme={state.scheme} />}
                  {active && id === 'tokens' && (
                    <TokensPanel
                      theme={theme}
                      scheme={state.scheme}
                      tenant={state.tenant}
                      format={state.format}
                      onFormatChange={(format) => dispatch({ type: 'setFormat', format })}
                      figmaModes={state.figmaModes}
                      onFigmaModesChange={(figmaModes) => dispatch({ type: 'setFigmaModes', figmaModes })}
                      focusExport={focusExport}
                      onExportFocused={onExportFocused}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </main>
      </div>

      <div className={ui.srOnly} role="status" aria-live="polite" aria-atomic="true">
        {announcement}
      </div>
    </div>
  );
}

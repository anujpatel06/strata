'use client';

import { IconMoon, IconSun } from '@syntara/icons';
import { Tab, TabList, TabPanel, Tabs, ToggleButton, ToggleButtonGroup } from '@syntara/react';
import type { Key } from 'react-aria-components';
import { AccessibilityPanel } from './accessibility-panel';
import { ControlsPanel } from './controls-panel';
import { ExportPanel } from './export-panel';
import { plural } from './format';
import { PreviewPanel } from './preview-panel';
import { SCHEMES, TABS, oneOf, type Tab as TabId } from './state';
import { useThemes } from './themes-provider';
import { TokensPanel } from './tokens-panel';
import styles from './themes.module.css';

const TAB_LABEL: Record<TabId, string> = {
  preview: 'Preview',
  accessibility: 'Accessibility',
  tokens: 'Tokens',
  export: 'Export',
};

function SchemeToggle() {
  const { state, dispatch } = useThemes();
  return (
    <ToggleButtonGroup
      aria-label="Colour scheme"
      size="sm"
      disallowEmptySelection
      selectedKeys={[state.scheme]}
      onSelectionChange={(keys) => {
        const [first] = keys;
        const scheme = oneOf(first == null ? undefined : String(first), SCHEMES);
        if (scheme) dispatch({ type: 'setScheme', scheme });
      }}
      className={styles.schemeToggle}
    >
      <ToggleButton id="light">
        <IconSun aria-hidden />
        Light
      </ToggleButton>
      <ToggleButton id="dark">
        <IconMoon aria-hidden />
        Dark
      </ToggleButton>
    </ToggleButtonGroup>
  );
}

/** Inputs on the start side (sticky on wide screens), views of the generated theme in tabs on the end side. */
export function ThemesWorkspace() {
  const { state, dispatch, theme } = useThemes();
  const { adjustments } = theme.summary;

  return (
    <div className={styles.workspace}>
      <div className={styles.controls}>
        <ControlsPanel />
      </div>

      <Tabs
        selectedKey={state.tab}
        onSelectionChange={(key: Key) => {
          const tab = oneOf(String(key), TABS);
          if (tab) dispatch({ type: 'setTab', tab });
        }}
        className={styles.views}
      >
        <div className={styles.tabbar}>
          <TabList aria-label="Theme views" className={styles.tablist}>
            {TABS.map((id) =>
              id === 'accessibility' ? (
                <Tab key={id} id={id} count={adjustments} aria-label={`${TAB_LABEL[id]}, ${plural(adjustments, 'solver adjustment')}`}>
                  {TAB_LABEL[id]}
                </Tab>
              ) : (
                <Tab key={id} id={id}>
                  {TAB_LABEL[id]}
                </Tab>
              ),
            )}
          </TabList>
          {state.tab !== 'export' && <SchemeToggle />}
        </div>
        <TabPanel id="preview" className={styles.panel}>
          <PreviewPanel />
        </TabPanel>
        <TabPanel id="accessibility" className={styles.panel}>
          <AccessibilityPanel />
        </TabPanel>
        <TabPanel id="tokens" className={styles.panel}>
          <TokensPanel />
        </TabPanel>
        <TabPanel id="export" className={styles.panel}>
          <ExportPanel />
        </TabPanel>
      </Tabs>
    </div>
  );
}

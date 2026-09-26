'use client';

import { createContext, useContext, type JSX, type ReactNode } from 'react';
import {
  SelectionIndicator,
  Tab as RACTab,
  TabList as RACTabList,
  TabPanel as RACTabPanel,
  Tabs as RACTabs,
  composeRenderProps,
  type TabListProps as RACTabListProps,
  type TabPanelProps as RACTabPanelProps,
  type TabProps as RACTabProps,
  type TabsProps as RACTabsProps,
} from 'react-aria-components';
import styles from './tabs.module.css';

const cx = (...c: Array<string | false | null | undefined>) => c.filter(Boolean).join(' ');

export type TabsVariant = 'underline' | 'pill';

const VariantContext = createContext<TabsVariant>('underline');

export interface TabsProps extends RACTabsProps {
  /**
   * `underline` — a 2px indicator under the selected tab, for switching page sections.
   * `pill` — a segmented control on a sunken track, for switching views of the same data.
   */
  variant?: TabsVariant;
}

/** Organises content into panels, one visible at a time. Arrow keys move between tabs (mirrored in RTL). */
export function Tabs({ variant = 'underline', className, ...props }: TabsProps): JSX.Element {
  return (
    <VariantContext.Provider value={variant}>
      <RACTabs {...props} className={composeRenderProps(className, (c) => cx(styles.tabs, c))} />
    </VariantContext.Provider>
  );
}

export interface TabListProps<T extends object> extends RACTabListProps<T> {}

/** The row (or column) of tabs. Requires `aria-label` or `aria-labelledby`. Scrolls sideways inside itself when tabs overflow. */
export function TabList<T extends object>({ className, ...props }: TabListProps<T>): JSX.Element {
  const variant = useContext(VariantContext);
  return (
    <RACTabList
      {...props}
      className={composeRenderProps(className, (c) => cx(styles.list, variant === 'pill' ? styles.listPill : styles.listUnderline, c))}
    />
  );
}

export interface TabProps extends RACTabProps {
  /** A small count shown after the label, e.g. the number of open items in that view. */
  count?: ReactNode;
}

export function Tab({ className, children, count, ...props }: TabProps): JSX.Element {
  const variant = useContext(VariantContext);
  return (
    <RACTab
      {...props}
      className={composeRenderProps(className, (c) => cx(styles.tab, variant === 'pill' ? styles.tabPill : styles.tabUnderline, c))}
    >
      {composeRenderProps(children, (content) => (
        <>
          <span className={styles.label}>{content}</span>
          {count != null && count !== false && <span className={styles.count}>{count}</span>}
          <SelectionIndicator className={styles.indicator} />
        </>
      ))}
    </RACTab>
  );
}

export interface TabPanelProps extends RACTabPanelProps {}

export function TabPanel({ className, ...props }: TabPanelProps): JSX.Element {
  return <RACTabPanel {...props} className={composeRenderProps(className, (c) => cx(styles.panel, c))} />;
}

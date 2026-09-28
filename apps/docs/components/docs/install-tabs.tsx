'use client';

import { Tab, TabList, TabPanel, Tabs } from '@syntara/react';
import type { ReactNode } from 'react';

export interface InstallTab {
  id: string;
  label: string;
  content: ReactNode;
}

/**
 * The tabs of a component page's Installation section.
 *
 * This is a client component on purpose. React Aria builds the tab collection while it renders, and picks the
 * default tab from it. When a server component renders `Tabs` directly, the tabs cross the client boundary as
 * lazy references, the collection is still empty when the selection is chosen, and the server HTML has no selected
 * tab and no panel, so hydration fails (React error 418). Creating the tabs here keeps them in one render pass;
 * only the panel contents come from the server.
 */
export function InstallTabs({
  tabs,
  label,
  className,
  panelClassName,
}: {
  tabs: InstallTab[];
  /** Accessible name of the tab list. */
  label: string;
  className?: string;
  panelClassName?: string;
}) {
  return (
    <Tabs variant="pill" className={className}>
      <TabList aria-label={label}>
        {tabs.map((t) => (
          <Tab key={t.id} id={t.id}>
            {t.label}
          </Tab>
        ))}
      </TabList>
      {tabs.map((t) => (
        <TabPanel key={t.id} id={t.id} className={panelClassName}>
          {t.content}
        </TabPanel>
      ))}
    </Tabs>
  );
}

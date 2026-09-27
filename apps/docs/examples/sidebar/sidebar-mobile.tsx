'use client';

import { Button, DialogTrigger, Sheet, Sidebar, SidebarItem, SidebarSection } from '@strata/react';
import { IconBell, IconLayoutDashboard, IconMenu2, IconReceipt, IconSettings, IconWallet } from '@strata/icons';

/** Narrow screens: the same Sidebar inside a start-side Sheet. The Sheet's title replaces the brand block, and the
 *  Sidebar drops its own panel (background, edge, block padding) because the Sheet is the panel. */
export default function Example() {
  return (
    <DialogTrigger>
      <Button variant="outline" size="icon" aria-label="Open navigation">
        <IconMenu2 aria-hidden />
      </Button>
      <Sheet side="start" title="Ledger">
        <Sidebar aria-label="Main" style={{ inlineSize: '100%', paddingBlock: 0, background: 'transparent', boxShadow: 'none' }}>
          <SidebarSection title="Overview">
            <SidebarItem href="#dashboard" icon={<IconLayoutDashboard />} isCurrent>Dashboard</SidebarItem>
            <SidebarItem href="#wallets" icon={<IconWallet />}>Wallets</SidebarItem>
            <SidebarItem href="#statements" icon={<IconReceipt />} count={3}>Statements</SidebarItem>
          </SidebarSection>
          <SidebarSection title="Activity">
            <SidebarItem href="#alerts" icon={<IconBell />}>Alerts</SidebarItem>
            <SidebarItem href="#settings" icon={<IconSettings />}>Settings</SidebarItem>
          </SidebarSection>
        </Sidebar>
      </Sheet>
    </DialogTrigger>
  );
}

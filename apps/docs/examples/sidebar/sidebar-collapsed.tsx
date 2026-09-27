'use client';

import { useState } from 'react';
import { IconTile, Sidebar, SidebarHeader, SidebarItem, SidebarSection } from '@strata/react';
import { IconBell, IconLayoutDashboard, IconReceipt, IconSettings, IconSparkles, IconWallet } from '@strata/icons';

export default function Example() {
  const [collapsed, setCollapsed] = useState(true);
  return (
    <div style={{ blockSize: 440, display: 'flex', maxInlineSize: '100%' }}>
      <Sidebar aria-label="Main" variant="floating" collapsed={collapsed} onCollapsedChange={setCollapsed}>
        <SidebarHeader
          logo={<IconTile tint="solid" size="sm"><IconSparkles /></IconTile>}
          title="Ledger"
          subtitle="Wealth dashboard"
        />
        <SidebarSection title="Overview">
          <SidebarItem href="#dashboard" icon={<IconLayoutDashboard />}>Dashboard</SidebarItem>
          <SidebarItem href="#wallets" icon={<IconWallet />} isCurrent>Wallets</SidebarItem>
          <SidebarItem href="#statements" icon={<IconReceipt />} count={3}>Statements</SidebarItem>
        </SidebarSection>
        <SidebarSection title="Activity">
          <SidebarItem href="#alerts" icon={<IconBell />} badge="New">Alerts</SidebarItem>
          <SidebarItem href="#settings" icon={<IconSettings />}>Settings</SidebarItem>
        </SidebarSection>
      </Sidebar>
    </div>
  );
}

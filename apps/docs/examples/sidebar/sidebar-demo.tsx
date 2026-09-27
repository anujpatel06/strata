'use client';

import {
  Avatar,
  Button,
  IconTile,
  Sidebar,
  SidebarFooter,
  SidebarHeader,
  SidebarItem,
  SidebarSection,
  useSidebar,
} from '@strata/react';
import {
  IconArrowsExchange,
  IconBell,
  IconCreditCard,
  IconDots,
  IconLayoutDashboard,
  IconReceipt,
  IconSettings,
  IconSparkles,
  IconUsers,
  IconWallet,
} from '@strata/icons';

function Account() {
  const { collapsed } = useSidebar();
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--strata-space-3)', minInlineSize: 0 }}>
      <Avatar name="Priya Raman" size="sm" alt={collapsed ? 'Priya Raman' : ''} />
      {!collapsed && (
        <>
          <div style={{ display: 'grid', flex: 1, minInlineSize: 0, fontSize: 'var(--strata-font-size-sm)' }}>
            <span style={{ fontWeight: 'var(--strata-font-weight-medium)' }}>Priya Raman</span>
            <span style={{ color: 'var(--strata-color-text-subtle)', fontSize: 'var(--strata-font-size-xs)' }}>Personal account</span>
          </div>
          <Button variant="ghost" size="icon" aria-label="Account options">
            <IconDots aria-hidden />
          </Button>
        </>
      )}
    </div>
  );
}

export default function Example() {
  return (
    <div style={{ blockSize: 620, display: 'flex' }}>
      <Sidebar aria-label="Main" variant="floating" defaultCollapsed={false}>
        <SidebarHeader
          logo={<IconTile tint="solid" size="sm"><IconSparkles /></IconTile>}
          title="Ledger"
          subtitle="Wealth dashboard"
        />
        <SidebarSection title="Overview">
          <SidebarItem href="#dashboard" icon={<IconLayoutDashboard />} isCurrent>Dashboard</SidebarItem>
          <SidebarItem href="#wallets" icon={<IconWallet />}>Wallets</SidebarItem>
          <SidebarItem href="#transfers" icon={<IconArrowsExchange />} badge="New">Transfers</SidebarItem>
        </SidebarSection>
        <SidebarSection title="Account">
          <SidebarItem href="#cards" icon={<IconCreditCard />}>Cards</SidebarItem>
          <SidebarItem href="#statements" icon={<IconReceipt />} count={3}>Statements</SidebarItem>
          <SidebarItem href="#members" icon={<IconUsers />} badge="Beta">Members</SidebarItem>
        </SidebarSection>
        <SidebarSection title="Activity">
          <SidebarItem href="#alerts" icon={<IconBell />} count={12}>Alerts</SidebarItem>
          <SidebarItem href="#settings" icon={<IconSettings />}>Settings</SidebarItem>
        </SidebarSection>
        <SidebarFooter>
          <Account />
        </SidebarFooter>
      </Sidebar>
    </div>
  );
}

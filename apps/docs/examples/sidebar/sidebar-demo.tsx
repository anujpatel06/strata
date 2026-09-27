'use client';

import { useEffect, useState } from 'react';
import {
  CommandDialog,
  CommandItem,
  IconTile,
  Menu,
  MenuItem,
  MenuSeparator,
  Sidebar,
  SidebarFooter,
  SidebarHeader,
  SidebarItem,
  SidebarSearch,
  SidebarSection,
  SidebarUser,
} from '@strata/react';
import {
  IconBuilding,
  IconClock,
  IconFileText,
  IconHeadphones,
  IconLayoutGrid,
  IconNews,
  IconPlug,
  IconSettings,
  IconShieldLock,
  IconSparkles,
  IconUsers,
} from '@strata/icons';

export default function Example() {
  // The search is a launcher: it opens a command palette, and ⌘K / Ctrl+K opens it too.
  const [searching, setSearching] = useState(false);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setSearching(true);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);
  return (
    <div style={{ blockSize: 840, display: 'flex', maxInlineSize: '100%', minInlineSize: 0 }}>
      <Sidebar aria-label="Main" variant="floating" defaultCollapsed={false}>
        <SidebarHeader logo={<IconTile tint="none" size="md"><IconSparkles /></IconTile>} title="Tempo" subtitle="Plan the team's week" />
        <SidebarSearch shortcut="⌘K" onPress={() => setSearching(true)} />
        <SidebarSection title="General">
          <SidebarItem href="#overview" icon={<IconLayoutGrid />}>Overview</SidebarItem>
          <SidebarItem href="#tasks" icon={<IconFileText />}>Daily tasks</SidebarItem>
          <SidebarItem href="#compliance" icon={<IconShieldLock />}>Compliance</SidebarItem>
        </SidebarSection>
        <SidebarSection title="Management">
          <SidebarItem href="#organization" icon={<IconBuilding />}>Organization</SidebarItem>
          <SidebarItem icon={<IconUsers />} label="Employees" count={2}>
            <SidebarItem href="#jonah">Jonah Adams</SidebarItem>
            <SidebarItem href="#yuri" isCurrent>Yuri Jackson</SidebarItem>
          </SidebarItem>
          <SidebarItem href="#time" icon={<IconClock />}>Time tracking</SidebarItem>
        </SidebarSection>
        <SidebarSection title="Other">
          <SidebarItem href="#integrations" icon={<IconPlug />}>Integrations</SidebarItem>
          <SidebarItem href="#whats-new" icon={<IconNews />}>What's new</SidebarItem>
        </SidebarSection>
        <SidebarFooter>
          <SidebarItem href="#support" icon={<IconHeadphones />} badge="New">Need support?</SidebarItem>
          <SidebarItem href="#settings" icon={<IconSettings />}>Settings</SidebarItem>
          <SidebarUser
            name="Maya Chen"
            description="maya@example.com"
            menu={
              <Menu placement="top start">
                <MenuItem id="profile">Profile</MenuItem>
                <MenuItem id="billing">Billing</MenuItem>
                <MenuSeparator />
                <MenuItem id="sign-out">Sign out</MenuItem>
              </Menu>
            }
          />
        </SidebarFooter>
      </Sidebar>
      <CommandDialog isOpen={searching} onOpenChange={setSearching} placeholder="Search people and pages…">
        <CommandItem id="yuri">Yuri Jackson</CommandItem>
        <CommandItem id="time">Time tracking</CommandItem>
      </CommandDialog>
    </div>
  );
}

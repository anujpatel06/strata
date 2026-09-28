'use client';

import { useState } from 'react';
import {
  IconTile,
  Sidebar,
  SidebarFooter,
  SidebarHeader,
  SidebarItem,
  SidebarSearch,
  SidebarSection,
  SidebarUser,
} from '@syntara/react';
import {
  IconBuilding,
  IconClock,
  IconFileText,
  IconHeadphones,
  IconLayoutGrid,
  IconSettings,
  IconSparkles,
  IconUsers,
} from '@syntara/icons';

/** The icon rail. Tooltips name every icon; the Employees group opens its people in a popover. */
export default function Example() {
  const [collapsed, setCollapsed] = useState(true);
  return (
    <div style={{ blockSize: 640, display: 'flex', maxInlineSize: '100%', minInlineSize: 0 }}>
      <Sidebar aria-label="Main" variant="floating" collapsed={collapsed} onCollapsedChange={setCollapsed}>
        <SidebarHeader logo={<IconTile tint="none" size="md"><IconSparkles /></IconTile>} title="Tempo" subtitle="Plan the team's week" />
        <SidebarSearch shortcut="⌘K" />
        <SidebarSection title="General">
          <SidebarItem href="#overview" icon={<IconLayoutGrid />} isCurrent>Overview</SidebarItem>
          <SidebarItem href="#tasks" icon={<IconFileText />} count={4}>Daily tasks</SidebarItem>
        </SidebarSection>
        <SidebarSection title="Management">
          <SidebarItem href="#organization" icon={<IconBuilding />}>Organization</SidebarItem>
          <SidebarItem icon={<IconUsers />} label="Employees" count={2}>
            <SidebarItem href="#jonah">Jonah Adams</SidebarItem>
            <SidebarItem href="#yuri">Yuri Jackson</SidebarItem>
          </SidebarItem>
          <SidebarItem href="#time" icon={<IconClock />}>Time tracking</SidebarItem>
        </SidebarSection>
        <SidebarFooter>
          <SidebarItem href="#support" icon={<IconHeadphones />}>Need support?</SidebarItem>
          <SidebarItem href="#settings" icon={<IconSettings />}>Settings</SidebarItem>
          <SidebarUser name="Maya Chen" description="maya@example.com" />
        </SidebarFooter>
      </Sidebar>
    </div>
  );
}

'use client';

import { Sidebar, SidebarHeader, SidebarItem, SidebarSection } from '@strata/react';
import { IconFolder, IconHome, IconInbox, IconSettings, IconUsers } from '@strata/icons';

/** App chrome: full height, a hairline at the inline end, content beside it. */
export default function Example() {
  return (
    <div style={{ display: 'flex', blockSize: 380, inlineSize: '100%', border: '1px solid var(--strata-color-border-subtle)', borderRadius: 'var(--strata-radius-container)', overflow: 'hidden' }}>
      <Sidebar aria-label="Workspace" defaultCollapsed={false}>
        <SidebarHeader title="Product team" subtitle="Shared workspace" />
        <SidebarSection>
          <SidebarItem href="#home" icon={<IconHome />}>Home</SidebarItem>
          <SidebarItem href="#inbox" icon={<IconInbox />} count={5} isCurrent>Inbox</SidebarItem>
          <SidebarItem href="#projects" icon={<IconFolder />}>Projects</SidebarItem>
        </SidebarSection>
        <SidebarSection title="Admin">
          <SidebarItem href="#people" icon={<IconUsers />}>People</SidebarItem>
          <SidebarItem icon={<IconSettings />} onPress={() => {}}>Preferences</SidebarItem>
        </SidebarSection>
      </Sidebar>
      <div style={{ flex: 1, padding: 'var(--strata-space-6)', color: 'var(--strata-color-text-subtle)', fontSize: 'var(--strata-font-size-sm)' }}>
        5 unread messages
      </div>
    </div>
  );
}

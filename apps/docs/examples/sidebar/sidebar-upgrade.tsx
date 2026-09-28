'use client';

import {
  Button,
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  IconTile,
  Sidebar,
  SidebarFooter,
  SidebarHeader,
  SidebarItem,
  SidebarSection,
} from '@syntara/react';
import { IconLayoutDashboard, IconSparkles, IconTrendingUp, IconWallet } from '@syntara/icons';

export default function Example() {
  return (
    <div style={{ blockSize: 520, display: 'flex', maxInlineSize: '100%', minInlineSize: 0 }}>
      <Sidebar aria-label="Main" variant="floating">
        <SidebarHeader logo={<IconTile tint="solid" size="sm"><IconSparkles /></IconTile>} title="Ledger" subtitle="Free plan" />
        <SidebarSection title="Overview">
          <SidebarItem href="#dashboard" icon={<IconLayoutDashboard />} isCurrent>Dashboard</SidebarItem>
          <SidebarItem href="#wallets" icon={<IconWallet />}>Wallets</SidebarItem>
          <SidebarItem href="#insights" icon={<IconTrendingUp />} badge="Pro">Insights</SidebarItem>
        </SidebarSection>
        <SidebarFooter>
          <Card variant="feature" stars>
            <CardHeader>
              <CardTitle level={2}>Go further with Pro</CardTitle>
              <CardDescription>Forecasts, shared wallets and priority support.</CardDescription>
            </CardHeader>
            <CardFooter>
              <Button size="sm">Upgrade</Button>
            </CardFooter>
          </Card>
        </SidebarFooter>
      </Sidebar>
    </div>
  );
}

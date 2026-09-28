'use client';

import { Tab, TabList, TabPanel, Tabs } from '@syntara/react';

const text = { margin: 0, color: 'var(--syntara-color-text-subtle)', fontSize: 'var(--syntara-font-size-md)' };

export default function Example() {
  return (
    <Tabs orientation="vertical" defaultSelectedKey="profile">
      <TabList aria-label="Settings">
        <Tab id="profile">Profile</Tab>
        <Tab id="security">Security</Tab>
        <Tab id="notifications">Notifications</Tab>
        <Tab id="billing">Billing</Tab>
      </TabList>
      <TabPanel id="profile"><p style={text}>Your name, photo and contact details.</p></TabPanel>
      <TabPanel id="security"><p style={text}>Password, two-step verification and active sessions.</p></TabPanel>
      <TabPanel id="notifications"><p style={text}>Choose which updates reach you by email or SMS.</p></TabPanel>
      <TabPanel id="billing"><p style={text}>Payment methods, invoices and plan.</p></TabPanel>
    </Tabs>
  );
}

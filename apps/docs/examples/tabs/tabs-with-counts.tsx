'use client';

import { IconAlertTriangle, IconCircleCheck, IconInbox } from '@syntara/icons';
import { Tab, TabList, TabPanel, Tabs } from '@syntara/react';

const text = { margin: 0, color: 'var(--syntara-color-text-subtle)', fontSize: 'var(--syntara-font-size-md)' };

export default function Example() {
  return (
    <Tabs defaultSelectedKey="open">
      <TabList aria-label="Requests">
        <Tab id="open" count={12}>
          <IconInbox aria-hidden="true" />
          Open
        </Tab>
        <Tab id="action" count={3}>
          <IconAlertTriangle aria-hidden="true" />
          Needs action
        </Tab>
        <Tab id="closed" count={128}>
          <IconCircleCheck aria-hidden="true" />
          Closed
        </Tab>
        <Tab id="archived" isDisabled>
          Archived
        </Tab>
      </TabList>
      <TabPanel id="open"><p style={text}>12 requests are waiting for review.</p></TabPanel>
      <TabPanel id="action"><p style={text}>3 requests need a document from you.</p></TabPanel>
      <TabPanel id="closed"><p style={text}>128 requests closed this year.</p></TabPanel>
    </Tabs>
  );
}

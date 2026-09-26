'use client';

import { Tab, TabList, TabPanel, Tabs } from '@strata/react';

const text = { margin: 0, color: 'var(--strata-color-text-subtle)', fontSize: 'var(--strata-font-size-md)' };

export default function Example() {
  return (
    <Tabs defaultSelectedKey="overview">
      <TabList aria-label="Claim details">
        <Tab id="overview">Overview</Tab>
        <Tab id="documents">Documents</Tab>
        <Tab id="payments">Payments</Tab>
        <Tab id="history">History</Tab>
      </TabList>
      <TabPanel id="overview">
        <p style={text}>Submitted on 12 September. A reviewer is checking the treatment summary.</p>
      </TabPanel>
      <TabPanel id="documents">
        <p style={text}>3 files attached: invoice, prescription and discharge summary.</p>
      </TabPanel>
      <TabPanel id="payments">
        <p style={text}>No payments yet. Approved amounts are paid within 5 working days.</p>
      </TabPanel>
      <TabPanel id="history">
        <p style={text}>Claim created, documents uploaded, review started.</p>
      </TabPanel>
    </Tabs>
  );
}

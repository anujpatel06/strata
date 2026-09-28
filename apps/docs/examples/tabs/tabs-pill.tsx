'use client';

import { Tab, TabList, TabPanel, Tabs } from '@syntara/react';

const text = { margin: 0, color: 'var(--syntara-color-text-subtle)', fontSize: 'var(--syntara-font-size-md)' };

export default function Example() {
  return (
    <Tabs variant="pill" defaultSelectedKey="month">
      <TabList aria-label="Reporting period">
        <Tab id="week">Week</Tab>
        <Tab id="month">Month</Tab>
        <Tab id="quarter">Quarter</Tab>
        <Tab id="year">Year</Tab>
      </TabList>
      <TabPanel id="week">
        <p style={text}>Spending for the last 7 days.</p>
      </TabPanel>
      <TabPanel id="month">
        <p style={text}>Spending for September, compared with August.</p>
      </TabPanel>
      <TabPanel id="quarter">
        <p style={text}>Spending for July to September.</p>
      </TabPanel>
      <TabPanel id="year">
        <p style={text}>Spending for the last 12 months.</p>
      </TabPanel>
    </Tabs>
  );
}

'use client';

import { ToggleButton, ToggleButtonGroup } from '@syntara/react';

// A narrow column, like a phone screen or a side panel. The five segments don't fit on one row, so they wrap onto a
// second row inside the track. Every label stays whole, and nothing scrolls sideways.
export default function Example() {
  return (
    <div style={{ inlineSize: '100%', maxInlineSize: 240 }}>
      <ToggleButtonGroup aria-label="Chart range" defaultSelectedKeys={['quarter']} disallowEmptySelection>
        <ToggleButton id="day">Day</ToggleButton>
        <ToggleButton id="week">Week</ToggleButton>
        <ToggleButton id="month">Month</ToggleButton>
        <ToggleButton id="quarter">Quarter</ToggleButton>
        <ToggleButton id="year">Year</ToggleButton>
      </ToggleButtonGroup>
    </div>
  );
}

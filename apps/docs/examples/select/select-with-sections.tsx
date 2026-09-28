'use client';

import { Select, SelectItem, SelectSection } from '@syntara/react';

export default function Example() {
  return (
    <Select label="Time zone" defaultSelectedKey="Europe/London" style={{ inlineSize: '100%', maxInlineSize: 320 }}>
      <SelectSection title="Americas">
        <SelectItem id="America/New_York">Eastern Time (New York)</SelectItem>
        <SelectItem id="America/Chicago">Central Time (Chicago)</SelectItem>
        <SelectItem id="America/Los_Angeles">Pacific Time (Los Angeles)</SelectItem>
      </SelectSection>
      <SelectSection title="Europe">
        <SelectItem id="Europe/London">Greenwich Mean Time (London)</SelectItem>
        <SelectItem id="Europe/Berlin">Central European Time (Berlin)</SelectItem>
      </SelectSection>
      <SelectSection title="Asia">
        <SelectItem id="Asia/Kolkata">India Standard Time (Kolkata)</SelectItem>
        <SelectItem id="Asia/Singapore">Singapore Time</SelectItem>
      </SelectSection>
    </Select>
  );
}

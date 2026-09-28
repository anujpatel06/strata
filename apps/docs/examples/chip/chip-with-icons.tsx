'use client';

import { Avatar, Chip, ChipGroup } from '@syntara/react';
import { IconHospital, IconPill, IconTestTube, IconVideo } from '@syntara/icons';

// A leading icon gives way to the check when selected; an avatar is covered by a check disc.
export default function Example() {
  return (
    <div style={{ display: 'grid', gap: 'var(--syntara-space-5)' }}>
      <ChipGroup label="Where" defaultSelectedKeys={['video']}>
        <Chip id="video" icon={<IconVideo />}>Video</Chip>
        <Chip id="clinic" icon={<IconHospital />}>In clinic</Chip>
        <Chip id="lab" icon={<IconTestTube />}>Lab</Chip>
        <Chip id="pharmacy" icon={<IconPill />}>Pharmacy</Chip>
      </ChipGroup>
      <ChipGroup label="For" defaultSelectedKeys={['priya']}>
        <Chip id="arjun" avatar={<Avatar name="Arjun Shah" alt="" />}>Arjun</Chip>
        <Chip id="priya" avatar={<Avatar name="Priya Shah" alt="" />}>Priya</Chip>
        <Chip id="aarav" avatar={<Avatar name="Aarav Shah" alt="" />}>Aarav</Chip>
      </ChipGroup>
    </div>
  );
}

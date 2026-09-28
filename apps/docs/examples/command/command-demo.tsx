'use client';

import { useState } from 'react';
import { Button, CommandDialog, CommandItem, CommandSection, Kbd, useCommandShortcut } from '@syntara/react';
import { IconArrowsExchange, IconCreditCard, IconFileText, IconSearch, IconSettings, IconUser } from '@syntara/icons';

export default function Example() {
  const [isOpen, setOpen] = useState(false);
  useCommandShortcut(() => setOpen(true));
  return (
    <>
      <Button variant="outline" onPress={() => setOpen(true)}>
        <IconSearch aria-hidden />
        Search…
        <Kbd>⌘K</Kbd>
      </Button>
      <CommandDialog isOpen={isOpen} onOpenChange={setOpen} placeholder="Search pages and actions…" onAction={(key) => console.log(key)}>
        <CommandSection title="Pages">
          <CommandItem id="statements" icon={<IconFileText />} meta="Accounts">Statements</CommandItem>
          <CommandItem id="cards" icon={<IconCreditCard />} meta="Accounts">Cards</CommandItem>
          <CommandItem id="profile" icon={<IconUser />} meta="Settings">Profile</CommandItem>
        </CommandSection>
        <CommandSection title="Actions">
          <CommandItem id="transfer" icon={<IconArrowsExchange />} description="Between your own accounts" textValue="Transfer money move">
            Transfer money
          </CommandItem>
          <CommandItem id="preferences" icon={<IconSettings />} meta="⌘,">Open preferences</CommandItem>
        </CommandSection>
      </CommandDialog>
    </>
  );
}

'use client';

import { useState } from 'react';
import { Button, CommandDialog, CommandItem } from '@syntara/react';

const people = [
  { id: 'pr', name: 'Priya Raman', team: 'Finance' },
  { id: 'jm', name: 'Jonas Meyer', team: 'Support' },
  { id: 'ak', name: 'Aisha Khan', team: 'Engineering' },
  { id: 'lt', name: 'Luis Torres', team: 'Design' },
];

export default function Example() {
  const [isOpen, setOpen] = useState(false);
  return (
    <>
      <Button variant="outline" onPress={() => setOpen(true)}>
        Assign reviewer
      </Button>
      <CommandDialog aria-label="Assign reviewer" placeholder="Search people…" isOpen={isOpen} onOpenChange={setOpen} items={people}>
        {(person) => (
          <CommandItem id={person.id} textValue={`${person.name} ${person.team}`} meta={person.team}>
            {person.name}
          </CommandItem>
        )}
      </CommandDialog>
    </>
  );
}

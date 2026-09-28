'use client';

import { Button, Checkbox, CheckboxGroup, DialogTrigger, Sheet, TextField } from '@syntara/react';
import { IconAdjustmentsHorizontal } from '@syntara/icons';

export default function Example() {
  return (
    <DialogTrigger>
      <Button variant="outline">
        <IconAdjustmentsHorizontal aria-hidden />
        Filters
      </Button>
      <Sheet
        title="Filter claims"
        description="Show only the claims that match."
        footer={({ close }) => (
          <>
            <Button variant="ghost" onPress={close}>
              Reset
            </Button>
            <Button onPress={close}>Show results</Button>
          </>
        )}
      >
        <TextField label="Reference" placeholder="e.g. CLM-20418" />
        <CheckboxGroup label="Status" defaultValue={['submitted', 'review']}>
          <Checkbox value="submitted">Submitted</Checkbox>
          <Checkbox value="review">In review</Checkbox>
          <Checkbox value="approved">Approved</Checkbox>
          <Checkbox value="declined">Declined</Checkbox>
        </CheckboxGroup>
      </Sheet>
    </DialogTrigger>
  );
}

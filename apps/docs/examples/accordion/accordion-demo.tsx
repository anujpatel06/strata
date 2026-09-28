'use client';

import { Accordion, AccordionItem } from '@syntara/react';

export default function Example() {
  return (
    <Accordion defaultExpandedKeys={['documents']}>
      <AccordionItem id="documents" title="Which documents do I need?">
        An itemised invoice, the prescription or referral, and a discharge summary for hospital stays.
      </AccordionItem>
      <AccordionItem id="timeline" title="How long does a review take?">
        Most claims are reviewed within 3 working days. We email you if we need anything else.
      </AccordionItem>
      <AccordionItem id="payment" title="When will I be paid?">
        Approved amounts reach your bank account within 5 working days of approval.
      </AccordionItem>
    </Accordion>
  );
}

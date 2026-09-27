'use client';

import { IconBuildingBank, IconCreditCard, IconWallet } from '@strata/icons';
import { Combobox, ComboboxItem, ComboboxSection } from '@strata/react';

export default function Example() {
  return (
    <Combobox label="Pay from" placeholder="Search accounts…" style={{ inlineSize: '100%', maxInlineSize: 320 }}>
      <ComboboxSection title="Bank accounts">
        <ComboboxItem id="current" textValue="Current account" icon={<IconBuildingBank />} description="•••• 4821">
          Current account
        </ComboboxItem>
        <ComboboxItem id="savings" textValue="Savings account" icon={<IconBuildingBank />} description="•••• 1937">
          Savings account
        </ComboboxItem>
      </ComboboxSection>
      <ComboboxSection title="Cards">
        <ComboboxItem id="debit" textValue="Debit card" icon={<IconCreditCard />} description="Expires 08/28">
          Debit card
        </ComboboxItem>
        <ComboboxItem id="wallet" textValue="Wallet balance" icon={<IconWallet />} description="Instant, no fees">
          Wallet balance
        </ComboboxItem>
      </ComboboxSection>
    </Combobox>
  );
}

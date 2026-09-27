'use client';

import { useState } from 'react';
import { Badge, Button, DataTable, DataTableToolbar, SearchField, type DataTableColumn, type DataTableSelection } from '@strata/react';

type Claim = { id: string; member: string; type: string; status: 'In review' | 'Approved' | 'Needs info'; amount: number };

const members = ['Asha Menon', 'Daniel Okafor', 'Mei Lin', 'Omar Haddad', 'Sofia Rossi', 'Kiran Rao', 'Lucas Martin'];
const types = ['Outpatient', 'Pharmacy', 'Dental', 'Hospital stay', 'Vision'];
const statuses = ['In review', 'Approved', 'In review', 'Needs info'] as const;
const tones = { 'In review': 'info', Approved: 'success', 'Needs info': 'warning' } as const;
const claims: Claim[] = Array.from({ length: 24 }, (_, i) => ({
  id: `CLM-${20480 + i}`,
  member: members[(i * 4) % members.length]!,
  type: types[(i * 3) % types.length]!,
  status: statuses[(i * 3) % statuses.length]!,
  amount: ((i * 3571) % 90000) / 100 + 25,
}));

const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
const columns: DataTableColumn<Claim>[] = [
  { id: 'id', header: 'Claim', isRowHeader: true, cell: (r) => r.id },
  { id: 'member', header: 'Member', cell: (r) => r.member },
  { id: 'type', header: 'Type', cell: (r) => r.type },
  { id: 'status', header: 'Status', cell: (r) => <Badge variant="status" tone={tones[r.status]}>{r.status}</Badge> },
  { id: 'amount', header: 'Amount', align: 'end', cell: (r) => money.format(r.amount) },
];

export default function Example() {
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<DataTableSelection>(new Set(['CLM-20481', 'CLM-20483']));
  const rows = claims.filter((c) => `${c.id} ${c.member}`.toLowerCase().includes(query.trim().toLowerCase()));
  const count = selected === 'all' ? rows.length : selected.size;
  return (
    <div style={{ display: 'grid', gap: 12, inlineSize: '100%' }}>
      <DataTableToolbar>
        <SearchField aria-label="Search claims" placeholder="Search member or claim" value={query} onChange={setQuery} />
        <Button variant={count ? 'primary' : 'outline'} isDisabled={!count} onPress={() => setSelected(new Set())}>
          {count ? `Approve ${count}` : 'Approve'}
        </Button>
      </DataTableToolbar>
      <DataTable aria-label="Claims" columns={columns} rows={rows} getRowId={(r) => r.id} selectionMode="multiple" selectedKeys={selected} onSelectionChange={setSelected} maxBlockSize={400} />
    </div>
  );
}

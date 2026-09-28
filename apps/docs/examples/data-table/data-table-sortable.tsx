'use client';

import { useState } from 'react';
import { DataTable, useSortedRows, type DataTableColumn, type DataTableSortDescriptor } from '@syntara/react';

type Order = { id: string; customer: string; placed: Date; items: number; total: number };

const customers = ['Asha Menon', 'Daniel Okafor', 'Mei Lin', 'Omar Haddad', 'Sofia Rossi', 'Kiran Rao', 'Lucas Martin', 'Nadia Karim'];
const rows: Order[] = Array.from({ length: 30 }, (_, i) => ({
  id: `ORD-${7310 + i}`,
  customer: customers[(i * 5) % customers.length]!,
  placed: new Date(Date.UTC(2026, 7, 1 + ((i * 11) % 30), 9 + (i % 8))),
  items: 1 + ((i * 7) % 9),
  total: ((i * 6547) % 32000) / 100 + 8,
}));

const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
const when = new Intl.DateTimeFormat('en-US', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', timeZone: 'UTC' });
const accessors = { id: (r: Order) => r.id, customer: (r: Order) => r.customer, placed: (r: Order) => r.placed, items: (r: Order) => r.items, total: (r: Order) => r.total };
const columns: DataTableColumn<Order>[] = [
  { id: 'id', header: 'Order', isRowHeader: true, allowsSorting: true, cell: (r) => r.id },
  { id: 'customer', header: 'Customer', allowsSorting: true, cell: (r) => r.customer },
  { id: 'placed', header: 'Placed', allowsSorting: true, cell: (r) => when.format(r.placed) },
  { id: 'items', header: 'Items', align: 'end', allowsSorting: true, cell: (r) => r.items },
  { id: 'total', header: 'Total', align: 'end', allowsSorting: true, cell: (r) => money.format(r.total) },
];

/** Sticky header: the table scrolls inside a 360px frame. */
export default function Example() {
  const [sort, setSort] = useState<DataTableSortDescriptor>({ column: 'total', direction: 'descending' });
  const sorted = useSortedRows(rows, sort, accessors);
  return (
    <DataTable aria-label="Orders" columns={columns} rows={sorted} getRowId={(r) => r.id} sortDescriptor={sort} onSortChange={setSort} maxBlockSize={360} />
  );
}

'use client';

import { useState } from 'react';
import { Badge, DataTable, DataTablePagination, useSortedRows, type DataTableColumn, type DataTableSortDescriptor } from '@strata/react';

type Payment = { id: string; date: Date; payee: string; method: string; status: 'Paid' | 'Pending' | 'Failed' | 'Refunded'; amount: number };

const payees = ['City Pharmacy', 'Riverside Clinic', 'Corner Grocery', 'Metro Transit', 'Hilltop Books', 'Northside Fuel', 'Lakeview Dental'];
const statuses = ['Paid', 'Paid', 'Pending', 'Paid', 'Failed', 'Refunded'] as const;
const tones = { Paid: 'success', Pending: 'warning', Failed: 'danger', Refunded: 'neutral' } as const;
const rows: Payment[] = Array.from({ length: 48 }, (_, i) => ({
  id: `PAY-${4821 - i}`,
  date: new Date(Date.UTC(2026, 8, 26 - Math.floor(i / 2))),
  payee: payees[(i * 3) % payees.length]!,
  method: ['Card', 'Bank transfer', 'Wallet'][i % 3]!,
  status: statuses[(i * 5) % statuses.length]!,
  amount: ((i * 7919) % 48000) / 100 + 12,
}));

const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
const day = new Intl.DateTimeFormat('en-US', { day: 'numeric', month: 'short', timeZone: 'UTC' });
const accessors = { date: (r: Payment) => r.date, payee: (r: Payment) => r.payee, amount: (r: Payment) => r.amount };
const columns: DataTableColumn<Payment>[] = [
  { id: 'id', header: 'Reference', isRowHeader: true, cell: (r) => r.id },
  { id: 'date', header: 'Date', allowsSorting: true, cell: (r) => day.format(r.date) },
  { id: 'payee', header: 'Payee', allowsSorting: true, cell: (r) => r.payee },
  { id: 'method', header: 'Method', cell: (r) => r.method },
  { id: 'status', header: 'Status', cell: (r) => <Badge tone={tones[r.status]}>{r.status}</Badge> },
  { id: 'amount', header: 'Amount', align: 'end', allowsSorting: true, cell: (r) => money.format(r.amount) },
];

export default function Example() {
  const [sort, setSort] = useState<DataTableSortDescriptor>({ column: 'date', direction: 'descending' });
  const [page, setPage] = useState(1);
  const sorted = useSortedRows(rows, sort, accessors);
  return (
    <div style={{ display: 'grid', gap: 12, inlineSize: '100%' }}>
      <DataTable aria-label="Payments" columns={columns} rows={sorted.slice((page - 1) * 10, page * 10)} getRowId={(r) => r.id} sortDescriptor={sort} onSortChange={setSort} />
      <DataTablePagination page={page} pageSize={10} totalCount={rows.length} onPageChange={setPage} />
    </div>
  );
}

'use client';

import { DataTable, type DataTableColumn } from '@strata/react';

type Transfer = { id: string; recipient: string; date: string; status: string; amount: string };

const columns: DataTableColumn<Transfer>[] = [
  { id: 'id', header: 'Reference', isRowHeader: true, cell: (r) => r.id },
  { id: 'recipient', header: 'Recipient', cell: (r) => r.recipient },
  { id: 'date', header: 'Date', cell: (r) => r.date },
  { id: 'status', header: 'Status', cell: (r) => r.status },
  { id: 'amount', header: 'Amount', align: 'end', cell: (r) => r.amount },
];

export default function Example() {
  return <DataTable aria-label="Transfers" columns={columns} rows={[]} getRowId={(r) => r.id} selectionMode="multiple" isLoading loadingRowCount={5} />;
}

'use client';

import { IconReceipt } from '@strata/icons';
import { Button, DataTable, EmptyState, type DataTableColumn } from '@strata/react';

type Invoice = { id: string; issued: string; amount: string };

const columns: DataTableColumn<Invoice>[] = [
  { id: 'id', header: 'Invoice', isRowHeader: true, cell: (r) => r.id },
  { id: 'issued', header: 'Issued', cell: (r) => r.issued },
  { id: 'amount', header: 'Amount', align: 'end', cell: (r) => r.amount },
];

export default function Example() {
  return (
    <DataTable
      aria-label="Invoices"
      columns={columns}
      rows={[]}
      getRowId={(r) => r.id}
      emptyState={
        <EmptyState
          size="sm"
          icon={<IconReceipt />}
          title="No invoices yet"
          description="Invoices appear here after your first billing cycle closes."
          action={<Button variant="outline" size="sm">View billing settings</Button>}
        />
      }
    />
  );
}

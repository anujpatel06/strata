'use client';

import { useState } from 'react';
import {
  AlertDialog,
  Avatar,
  Badge,
  Button,
  DataTable,
  DataTableToolbar,
  DialogTrigger,
  Tooltip,
  TooltipTrigger,
  useSortedRows,
  type DataTableColumn,
  type DataTableSelection,
  type DataTableSortDescriptor,
} from '@syntara/react';
import { IconPencil, IconTrash } from '@syntara/icons';
import styles from './Screen.module.css';

type Beneficiary = {
  id: string;
  name: string;
  bank: string;
  last4: string;
  addedAt: Date;
};

const initialBeneficiaries: Beneficiary[] = [
  { id: 'ben-1', name: 'Asha Menon', bank: 'Horizon Trust', last4: '4821', addedAt: new Date(2026, 1, 14) },
  { id: 'ben-2', name: 'Daniel Okafor', bank: 'Meridian Bank', last4: '0739', addedAt: new Date(2025, 10, 3) },
  { id: 'ben-3', name: 'Mei Lin', bank: 'Northgate Savings', last4: '5502', addedAt: new Date(2026, 4, 22) },
  { id: 'ben-4', name: 'Omar Haddad', bank: 'Horizon Trust', last4: '9187', addedAt: new Date(2025, 7, 9) },
  { id: 'ben-5', name: 'Sofia Rossi', bank: 'Cedar Union', last4: '2264', addedAt: new Date(2026, 2, 28) },
  { id: 'ben-6', name: 'Kiran Rao', bank: 'Meridian Bank', last4: '3390', addedAt: new Date(2026, 6, 11) },
  { id: 'ben-7', name: 'Lucas Martin', bank: 'Cedar Union', last4: '6648', addedAt: new Date(2025, 11, 30) },
  { id: 'ben-8', name: 'Nadia Karim', bank: 'Northgate Savings', last4: '1123', addedAt: new Date(2026, 0, 5) },
];

const dateFormatter = new Intl.DateTimeFormat('en-US', { day: 'numeric', month: 'short', year: 'numeric' });

const accessors = {
  name: (row: Beneficiary) => row.name,
  addedAt: (row: Beneficiary) => row.addedAt,
};

export default function Screen() {
  const [beneficiaries, setBeneficiaries] = useState(initialBeneficiaries);
  const [sort, setSort] = useState<DataTableSortDescriptor>({ column: 'name', direction: 'ascending' });
  const [selected, setSelected] = useState<DataTableSelection>(new Set());

  const sorted = useSortedRows(beneficiaries, sort, accessors);
  const selectedCount = selected === 'all' ? sorted.length : selected.size;

  function removeOne(id: string) {
    setBeneficiaries((rows) => rows.filter((row) => row.id !== id));
    setSelected((prev) => {
      if (prev === 'all') return prev;
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }

  function removeSelected() {
    const ids = selected === 'all' ? new Set(sorted.map((row) => row.id)) : selected;
    setBeneficiaries((rows) => rows.filter((row) => !ids.has(row.id)));
    setSelected(new Set());
  }

  const columns: DataTableColumn<Beneficiary>[] = [
    {
      id: 'name',
      header: 'Name',
      isRowHeader: true,
      allowsSorting: true,
      cell: (row) => (
        <div className={styles.nameCell}>
          <Avatar name={row.name} size="sm" alt="" />
          <span>{row.name}</span>
        </div>
      ),
    },
    { id: 'bank', header: 'Bank', cell: (row) => row.bank },
    { id: 'account', header: 'Account', align: 'end', cell: (row) => <span className={styles.account}>•••• {row.last4}</span> },
    {
      id: 'addedAt',
      header: 'Added',
      allowsSorting: true,
      cell: (row) => dateFormatter.format(row.addedAt),
    },
    {
      id: 'actions',
      header: 'Actions',
      align: 'end',
      cell: (row) => (
        <div className={styles.actions}>
          <TooltipTrigger>
            <Button variant="ghost" size="icon" aria-label={`Edit ${row.name}`}>
              <IconPencil aria-hidden />
            </Button>
            <Tooltip>Edit</Tooltip>
          </TooltipTrigger>
          <DialogTrigger>
            <TooltipTrigger>
              <Button variant="ghost" size="icon" tone="danger" aria-label={`Remove ${row.name}`}>
                <IconTrash aria-hidden />
              </Button>
              <Tooltip>Remove</Tooltip>
            </TooltipTrigger>
            <AlertDialog title={`Remove ${row.name}?`} actionLabel="Remove beneficiary" tone="danger" onAction={() => removeOne(row.id)}>
              You'll need to add {row.name} again to send them a payment.
            </AlertDialog>
          </DialogTrigger>
        </div>
      ),
    },
  ];

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Beneficiaries</h1>
        <Badge tone="neutral" variant="soft">{beneficiaries.length}</Badge>
      </header>

      {selectedCount > 0 && (
        <DataTableToolbar>
          <span className={styles.selectionText}>{selectedCount} selected</span>
          <DialogTrigger>
            <Button variant="outline" tone="danger">Remove selected</Button>
            <AlertDialog
              title={`Remove ${selectedCount} beneficiar${selectedCount === 1 ? 'y' : 'ies'}?`}
              actionLabel="Remove beneficiaries"
              tone="danger"
              onAction={removeSelected}
            >
              You'll need to add them again to send a payment.
            </AlertDialog>
          </DialogTrigger>
        </DataTableToolbar>
      )}

      <DataTable
        aria-label="Beneficiaries"
        columns={columns}
        rows={sorted}
        getRowId={(row) => row.id}
        selectionMode="multiple"
        selectedKeys={selected}
        onSelectionChange={setSelected}
        sortDescriptor={sort}
        onSortChange={setSort}
        emptyState="No beneficiaries yet."
      />
    </div>
  );
}

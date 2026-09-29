import { useState } from 'react';
import {
  Avatar,
  Button,
  DataTable,
  DataTableToolbar,
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
  addedOn: Date;
};

const initialBeneficiaries: Beneficiary[] = [
  { id: 'ben-1', name: 'Asha Menon', bank: 'Horizon Trust Bank', last4: '4821', addedOn: new Date(2026, 1, 12) },
  { id: 'ben-2', name: 'Daniel Okafor', bank: 'Meridian Federal', last4: '0093', addedOn: new Date(2025, 10, 3) },
  { id: 'ben-3', name: 'Mei Lin', bank: 'Northgate Savings', last4: '7714', addedOn: new Date(2026, 4, 21) },
  { id: 'ben-4', name: 'Omar Haddad', bank: 'Horizon Trust Bank', last4: '2258', addedOn: new Date(2025, 7, 29) },
  { id: 'ben-5', name: 'Sofia Rossi', bank: 'Union Coastal Bank', last4: '6640', addedOn: new Date(2026, 2, 6) },
  { id: 'ben-6', name: 'Kiran Rao', bank: 'Meridian Federal', last4: '3305', addedOn: new Date(2025, 11, 18) },
  { id: 'ben-7', name: 'Lucas Martin', bank: 'Northgate Savings', last4: '9187', addedOn: new Date(2026, 0, 9) },
];

const dateFormatter = new Intl.DateTimeFormat('en-US', { day: 'numeric', month: 'short', year: 'numeric' });

const accessors = {
  name: (row: Beneficiary) => row.name,
  addedOn: (row: Beneficiary) => row.addedOn,
};

export default function Screen() {
  const [rows, setRows] = useState(initialBeneficiaries);
  const [selected, setSelected] = useState<DataTableSelection>(new Set());
  const [sort, setSort] = useState<DataTableSortDescriptor>({ column: 'name', direction: 'ascending' });

  const sortedRows = useSortedRows(rows, sort, accessors);
  const selectedCount = selected === 'all' ? rows.length : selected.size;

  function removeRows(ids: ReadonlySet<string>) {
    setRows((prev) => prev.filter((row) => !ids.has(row.id)));
    setSelected((prev) => {
      if (prev === 'all') return new Set();
      const next = new Set(prev);
      ids.forEach((id) => next.delete(id));
      return next;
    });
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
    { id: 'account', header: 'Account', cell: (row) => `•••• ${row.last4}` },
    {
      id: 'addedOn',
      header: 'Added',
      allowsSorting: true,
      cell: (row) => dateFormatter.format(row.addedOn),
    },
    {
      id: 'actions',
      header: 'Actions',
      align: 'end',
      cell: (row) => (
        <div className={styles.actionsCell}>
          <TooltipTrigger>
            <Button variant="ghost" size="icon" aria-label={`Edit ${row.name}`}>
              <IconPencil aria-hidden />
            </Button>
            <Tooltip>Edit</Tooltip>
          </TooltipTrigger>
          <TooltipTrigger>
            <Button variant="ghost" size="icon" tone="danger" aria-label={`Remove ${row.name}`} onPress={() => removeRows(new Set([row.id]))}>
              <IconTrash aria-hidden />
            </Button>
            <Tooltip>Remove</Tooltip>
          </TooltipTrigger>
        </div>
      ),
    },
  ];

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Beneficiaries</h1>
        <p className={styles.subtitle}>People you can send money to.</p>
      </div>

      {selectedCount > 0 && (
        <DataTableToolbar>
          <span className={styles.selectionCount}>{selectedCount} selected</span>
          <Button
            variant="outline"
            tone="danger"
            onPress={() => removeRows(selected === 'all' ? new Set(rows.map((r) => r.id)) : new Set(selected))}
          >
            <IconTrash aria-hidden />
            Remove selected
          </Button>
        </DataTableToolbar>
      )}

      <DataTable
        aria-label="Beneficiaries"
        columns={columns}
        rows={sortedRows}
        getRowId={(row) => row.id}
        selectionMode="multiple"
        selectedKeys={selected}
        onSelectionChange={setSelected}
        sortDescriptor={sort}
        onSortChange={setSort}
        emptyState="No beneficiaries added yet."
      />
    </div>
  );
}

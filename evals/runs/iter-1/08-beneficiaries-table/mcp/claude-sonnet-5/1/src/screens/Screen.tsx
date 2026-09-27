'use client';

import { useState } from 'react';
import {
  AlertDialog,
  Avatar,
  Button,
  DataTable,
  DataTableToolbar,
  Dialog,
  DialogTrigger,
  TextField,
  useSortedRows,
  type DataTableColumn,
  type DataTableSelection,
  type DataTableSortDescriptor,
} from '@strata/react';
import { IconPencil, IconTrash } from '@strata/icons';
import styles from './Screen.module.css';

type Beneficiary = {
  id: string;
  name: string;
  bank: string;
  last4: string;
  addedAt: Date;
};

const initialBeneficiaries: Beneficiary[] = [
  { id: 'b1', name: 'Asha Menon', bank: 'HDFC Bank', last4: '4821', addedAt: new Date(Date.UTC(2026, 1, 12)) },
  { id: 'b2', name: 'Daniel Okafor', bank: 'Standard Chartered', last4: '2290', addedAt: new Date(Date.UTC(2025, 10, 3)) },
  { id: 'b3', name: 'Mei Lin', bank: 'DBS Bank', last4: '7734', addedAt: new Date(Date.UTC(2026, 4, 21)) },
  { id: 'b4', name: 'Omar Haddad', bank: 'Emirates NBD', last4: '3305', addedAt: new Date(Date.UTC(2025, 7, 29)) },
  { id: 'b5', name: 'Sofia Rossi', bank: 'ICICI Bank', last4: '9012', addedAt: new Date(Date.UTC(2026, 2, 8)) },
  { id: 'b6', name: 'Kiran Rao', bank: 'Axis Bank', last4: '5567', addedAt: new Date(Date.UTC(2025, 11, 17)) },
  { id: 'b7', name: 'Lucas Martin', bank: 'Barclays', last4: '1148', addedAt: new Date(Date.UTC(2026, 0, 5)) },
  { id: 'b8', name: 'Nadia Karim', bank: 'Wells Fargo', last4: '6623', addedAt: new Date(Date.UTC(2025, 9, 14)) },
];

const added = new Intl.DateTimeFormat('en-US', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
const accessors = {
  name: (r: Beneficiary) => r.name,
  addedAt: (r: Beneficiary) => r.addedAt,
};

function digitsOnly(value: string) {
  return value.replace(/\D/g, '').slice(0, 4);
}

function EditBeneficiaryDialog({ beneficiary, onSave }: { beneficiary: Beneficiary; onSave: (b: Beneficiary) => void }) {
  const [name, setName] = useState(beneficiary.name);
  const [bank, setBank] = useState(beneficiary.bank);
  const [last4, setLast4] = useState(beneficiary.last4);

  return (
    <Dialog
      title={`Edit ${beneficiary.name}`}
      footer={({ close }) => (
        <>
          <Button variant="outline" onPress={close}>
            Cancel
          </Button>
          <Button
            onPress={() => {
              onSave({ ...beneficiary, name, bank, last4 });
              close();
            }}
          >
            Save changes
          </Button>
        </>
      )}
    >
      <TextField label="Name" value={name} onChange={setName} isRequired />
      <TextField label="Bank" value={bank} onChange={setBank} isRequired />
      <TextField label="Last four digits" value={last4} onChange={(v) => setLast4(digitsOnly(v))} isRequired />
    </Dialog>
  );
}

export default function Screen() {
  const [beneficiaries, setBeneficiaries] = useState(initialBeneficiaries);
  const [sort, setSort] = useState<DataTableSortDescriptor>({ column: 'addedAt', direction: 'descending' });
  const [selected, setSelected] = useState<DataTableSelection>(new Set());

  const sorted = useSortedRows(beneficiaries, sort, accessors);
  const selectedCount = selected === 'all' ? sorted.length : selected.size;
  const selectedIds = selected === 'all' ? sorted.map((r) => r.id) : Array.from(selected).map(String);

  function saveBeneficiary(updated: Beneficiary) {
    setBeneficiaries((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
  }

  function removeOne(id: string) {
    setBeneficiaries((prev) => prev.filter((b) => b.id !== id));
    setSelected((prev) => (prev === 'all' ? prev : new Set(Array.from(prev).filter((k) => k !== id))));
  }

  function removeSelected() {
    const ids = new Set(selectedIds);
    setBeneficiaries((prev) => prev.filter((b) => !ids.has(b.id)));
    setSelected(new Set());
  }

  const columns: DataTableColumn<Beneficiary>[] = [
    {
      id: 'name',
      header: 'Name',
      isRowHeader: true,
      allowsSorting: true,
      cell: (r) => (
        <div className={styles.person}>
          <Avatar name={r.name} alt="" size="sm" />
          {r.name}
        </div>
      ),
    },
    { id: 'bank', header: 'Bank', cell: (r) => r.bank },
    { id: 'account', header: 'Account', cell: (r) => `•••• ${r.last4}` },
    { id: 'addedAt', header: 'Added', allowsSorting: true, cell: (r) => added.format(r.addedAt) },
    {
      id: 'actions',
      header: 'Actions',
      align: 'end',
      cell: (r) => (
        <div className={styles.actions}>
          <DialogTrigger>
            <Button variant="ghost" size="icon" aria-label={`Edit ${r.name}`}>
              <IconPencil aria-hidden />
            </Button>
            <EditBeneficiaryDialog beneficiary={r} onSave={saveBeneficiary} />
          </DialogTrigger>
          <DialogTrigger>
            <Button variant="ghost" tone="danger" size="icon" aria-label={`Remove ${r.name}`}>
              <IconTrash aria-hidden />
            </Button>
            <AlertDialog
              title={`Remove ${r.name}?`}
              actionLabel="Remove"
              tone="danger"
              onAction={() => removeOne(r.id)}
            >
              They will no longer appear in your beneficiaries list. You can add them again later.
            </AlertDialog>
          </DialogTrigger>
        </div>
      ),
    },
  ];

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Beneficiaries</h1>
        <p className={styles.count}>{beneficiaries.length} beneficiaries</p>
      </div>

      {selectedCount > 0 && (
        <DataTableToolbar>
          <p className={styles.selectionCount}>{selectedCount} selected</p>
          <DialogTrigger>
            <Button variant="outline" tone="danger">
              Remove selected
            </Button>
            <AlertDialog
              title={`Remove ${selectedCount} ${selectedCount === 1 ? 'beneficiary' : 'beneficiaries'}?`}
              actionLabel="Remove"
              tone="danger"
              onAction={removeSelected}
            >
              They will no longer appear in your beneficiaries list. You can add them again later.
            </AlertDialog>
          </DialogTrigger>
        </DataTableToolbar>
      )}

      <DataTable
        aria-label="Beneficiaries"
        columns={columns}
        rows={sorted}
        getRowId={(r) => r.id}
        sortDescriptor={sort}
        onSortChange={setSort}
        selectionMode="multiple"
        selectedKeys={selected}
        onSelectionChange={setSelected}
      />
    </div>
  );
}

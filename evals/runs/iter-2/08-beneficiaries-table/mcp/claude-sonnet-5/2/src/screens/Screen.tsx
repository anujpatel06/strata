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
  Tooltip,
  TooltipTrigger,
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
  { id: 'b1', name: 'Priya Raman', bank: 'Horizon Bank', last4: '4821', addedAt: new Date('2026-08-14') },
  { id: 'b2', name: 'Daniel Okafor', bank: 'Meridian Trust', last4: '0932', addedAt: new Date('2026-03-02') },
  { id: 'b3', name: 'Mei Lin', bank: 'Northfield Savings', last4: '7710', addedAt: new Date('2025-12-19') },
  { id: 'b4', name: 'Omar Haddad', bank: 'Horizon Bank', last4: '5567', addedAt: new Date('2026-06-30') },
  { id: 'b5', name: 'Sofia Rossi', bank: 'Coastal Union', last4: '2284', addedAt: new Date('2026-01-08') },
  { id: 'b6', name: 'Kiran Rao', bank: 'Meridian Trust', last4: '9013', addedAt: new Date('2026-09-11') },
  { id: 'b7', name: 'Lucas Martin', bank: 'Northfield Savings', last4: '3345', addedAt: new Date('2025-11-27') },
];

const dateFormat = new Intl.DateTimeFormat('en-US', { day: 'numeric', month: 'short', year: 'numeric' });

const accessors = {
  name: (r: Beneficiary) => r.name,
  addedAt: (r: Beneficiary) => r.addedAt,
};

function EditBeneficiaryDialog({
  beneficiary,
  onSave,
}: {
  beneficiary: Beneficiary;
  onSave: (id: string, update: Omit<Beneficiary, 'id' | 'addedAt'>) => void;
}) {
  const [name, setName] = useState(beneficiary.name);
  const [bank, setBank] = useState(beneficiary.bank);
  const [last4, setLast4] = useState(beneficiary.last4);

  return (
    <Dialog
      title="Edit beneficiary"
      description="Update this beneficiary's details."
      footer={({ close }) => (
        <Button
          onPress={() => {
            onSave(beneficiary.id, { name, bank, last4 });
            close();
          }}
        >
          Save changes
        </Button>
      )}
    >
      <TextField label="Name" value={name} onChange={setName} isRequired />
      <TextField label="Bank" value={bank} onChange={setBank} isRequired />
      <TextField label="Last four digits" value={last4} onChange={setLast4} maxLength={4} isRequired />
    </Dialog>
  );
}

export default function Screen() {
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>(initialBeneficiaries);
  const [selectedKeys, setSelectedKeys] = useState<DataTableSelection>(new Set());
  const [sort, setSort] = useState<DataTableSortDescriptor>({ column: 'name', direction: 'ascending' });

  const sortedRows = useSortedRows(beneficiaries, sort, accessors);
  const selectedCount = selectedKeys === 'all' ? beneficiaries.length : selectedKeys.size;

  function updateBeneficiary(id: string, update: Omit<Beneficiary, 'id' | 'addedAt'>) {
    setBeneficiaries((rows) => rows.map((r) => (r.id === id ? { ...r, ...update } : r)));
  }

  function removeBeneficiaries(ids: Set<string>) {
    setBeneficiaries((rows) => rows.filter((r) => !ids.has(r.id)));
    setSelectedKeys(new Set());
  }

  const columns: DataTableColumn<Beneficiary>[] = [
    {
      id: 'name',
      header: 'Name',
      isRowHeader: true,
      allowsSorting: true,
      cell: (r) => (
        <div className={styles.nameCell}>
          <Avatar name={r.name} size="sm" />
          <span>{r.name}</span>
        </div>
      ),
    },
    { id: 'bank', header: 'Bank', cell: (r) => r.bank },
    { id: 'account', header: 'Account', cell: (r) => <span className={styles.account}>•••• {r.last4}</span> },
    { id: 'addedAt', header: 'Added', allowsSorting: true, cell: (r) => dateFormat.format(r.addedAt) },
    {
      id: 'actions',
      header: 'Actions',
      align: 'end',
      cell: (r) => (
        <div className={styles.actions}>
          <DialogTrigger>
            <TooltipTrigger>
              <Button variant="ghost" size="icon" aria-label={`Edit ${r.name}`}>
                <IconPencil aria-hidden />
              </Button>
              <Tooltip>Edit</Tooltip>
            </TooltipTrigger>
            <EditBeneficiaryDialog beneficiary={r} onSave={updateBeneficiary} />
          </DialogTrigger>
          <DialogTrigger>
            <TooltipTrigger>
              <Button variant="ghost" tone="danger" size="icon" aria-label={`Remove ${r.name}`}>
                <IconTrash aria-hidden />
              </Button>
              <Tooltip>Remove</Tooltip>
            </TooltipTrigger>
            <AlertDialog
              title="Remove beneficiary?"
              tone="danger"
              actionLabel="Remove"
              onAction={() => removeBeneficiaries(new Set([r.id]))}
            >
              {r.name} will be removed from your beneficiaries. You'll need to add them again to send money.
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
        <p className={styles.subtitle}>People you can send money to instantly.</p>
      </header>

      {selectedCount > 0 && (
        <DataTableToolbar>
          <span className={styles.selectionSummary}>{selectedCount} selected</span>
          <DialogTrigger>
            <Button variant="outline" tone="danger">
              Remove selected
            </Button>
            <AlertDialog
              title="Remove selected beneficiaries?"
              tone="danger"
              actionLabel="Remove selected"
              onAction={() => {
                const ids =
                  selectedKeys === 'all'
                    ? new Set(beneficiaries.map((r) => r.id))
                    : new Set(Array.from(selectedKeys, String));
                removeBeneficiaries(ids);
              }}
            >
              {selectedCount === 1
                ? 'This beneficiary will be removed. You will need to add them again to send money.'
                : `These ${selectedCount} beneficiaries will be removed. You will need to add them again to send money.`}
            </AlertDialog>
          </DialogTrigger>
        </DataTableToolbar>
      )}

      <DataTable
        aria-label="Beneficiaries"
        columns={columns}
        rows={sortedRows}
        getRowId={(r) => r.id}
        selectionMode="multiple"
        selectedKeys={selectedKeys}
        onSelectionChange={setSelectedKeys}
        sortDescriptor={sort}
        onSortChange={setSort}
      />
    </div>
  );
}

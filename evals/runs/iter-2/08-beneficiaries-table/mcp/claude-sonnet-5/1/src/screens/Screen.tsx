import { useRef, useState } from 'react';
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
  { id: 'b1', name: 'Meera Nair', bank: 'Union Trust Bank', last4: '4821', addedAt: new Date('2025-01-14') },
  { id: 'b2', name: 'Carlos Duarte', bank: 'Northfield Savings', last4: '0132', addedAt: new Date('2024-11-02') },
  { id: 'b3', name: 'Aiko Tanaka', bank: 'Meridian Bank', last4: '9987', addedAt: new Date('2025-06-30') },
  { id: 'b4', name: "Liam O'Connor", bank: 'Harbor Credit Union', last4: '5560', addedAt: new Date('2025-03-22') },
  { id: 'b5', name: 'Fatima Al-Sayed', bank: 'Crestview Bank', last4: '2214', addedAt: new Date('2023-09-10') },
  { id: 'b6', name: 'Noah Bergstrom', bank: 'Union Trust Bank', last4: '7788', addedAt: new Date('2025-08-05') },
  { id: 'b7', name: 'Priya Chandran', bank: 'Northfield Savings', last4: '3345', addedAt: new Date('2024-04-18') },
  { id: 'b8', name: 'Ethan Walsh', bank: 'Meridian Bank', last4: '6602', addedAt: new Date('2025-02-01') },
];

const dateFormat = new Intl.DateTimeFormat('en-US', { day: 'numeric', month: 'short', year: 'numeric' });

const accessors = {
  name: (r: Beneficiary) => r.name,
  addedAt: (r: Beneficiary) => r.addedAt,
};

function RowActions({
  beneficiary,
  onSave,
  onRemove,
}: {
  beneficiary: Beneficiary;
  onSave: (updated: Beneficiary) => void;
  onRemove: (id: string) => void;
}) {
  const nameRef = useRef<HTMLInputElement>(null);
  const bankRef = useRef<HTMLInputElement>(null);
  const last4Ref = useRef<HTMLInputElement>(null);

  return (
    <div className={styles.rowActions}>
      <DialogTrigger>
        <Button variant="ghost" size="icon" aria-label={`Edit ${beneficiary.name}`}>
          <IconPencil aria-hidden />
        </Button>
        <Dialog
          title="Edit beneficiary"
          footer={({ close }) => (
            <>
              <Button variant="outline" onPress={close}>
                Cancel
              </Button>
              <Button
                onPress={() => {
                  onSave({
                    ...beneficiary,
                    name: nameRef.current?.value.trim() || beneficiary.name,
                    bank: bankRef.current?.value.trim() || beneficiary.bank,
                    last4: last4Ref.current?.value.trim() || beneficiary.last4,
                  });
                  close();
                }}
              >
                Save changes
              </Button>
            </>
          )}
        >
          <TextField label="Full name" defaultValue={beneficiary.name} inputRef={nameRef} autoFocus />
          <TextField label="Bank" defaultValue={beneficiary.bank} inputRef={bankRef} />
          <TextField label="Last four digits" description="4 digits" defaultValue={beneficiary.last4} inputRef={last4Ref} />
        </Dialog>
      </DialogTrigger>
      <DialogTrigger>
        <Button variant="ghost" size="icon" aria-label={`Remove ${beneficiary.name}`}>
          <IconTrash aria-hidden />
        </Button>
        <AlertDialog
          title={`Remove ${beneficiary.name}?`}
          tone="danger"
          actionLabel="Remove"
          onAction={() => onRemove(beneficiary.id)}
        >
          They will no longer appear in your saved beneficiaries.
        </AlertDialog>
      </DialogTrigger>
    </div>
  );
}

export default function Screen() {
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>(initialBeneficiaries);
  const [selected, setSelected] = useState<DataTableSelection>(new Set());
  const [sort, setSort] = useState<DataTableSortDescriptor | undefined>({ column: 'name', direction: 'ascending' });

  const sorted = useSortedRows(beneficiaries, sort, accessors);
  const selectedCount = selected === 'all' ? beneficiaries.length : selected.size;

  const handleRemoveMany = (keys: DataTableSelection) => {
    setBeneficiaries((prev) => (keys === 'all' ? [] : prev.filter((b) => !keys.has(b.id))));
    setSelected(new Set());
  };

  const handleRemoveOne = (id: string) => {
    setBeneficiaries((prev) => prev.filter((b) => b.id !== id));
    setSelected((prev) => {
      if (prev === 'all') return prev;
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const handleSave = (updated: Beneficiary) => {
    setBeneficiaries((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
  };

  const columns: DataTableColumn<Beneficiary>[] = [
    {
      id: 'name',
      header: 'Name',
      isRowHeader: true,
      allowsSorting: true,
      textValue: (r) => r.name,
      cell: (r) => (
        <div className={styles.nameCell}>
          <Avatar name={r.name} size="sm" />
          <span>{r.name}</span>
        </div>
      ),
    },
    { id: 'bank', header: 'Bank', cell: (r) => r.bank },
    { id: 'account', header: 'Account', align: 'end', cell: (r) => <span className={styles.account}>•••• {r.last4}</span> },
    { id: 'addedAt', header: 'Added', allowsSorting: true, cell: (r) => dateFormat.format(r.addedAt) },
    {
      id: 'actions',
      header: 'Actions',
      align: 'end',
      cell: (r) => <RowActions beneficiary={r} onSave={handleSave} onRemove={handleRemoveOne} />,
    },
  ];

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Beneficiaries</h1>
        <p className={styles.subtitle}>People and accounts you can send money to.</p>
      </div>
      {selectedCount > 0 && (
        <DataTableToolbar>
          <span className={styles.selectionSummary}>{selectedCount} selected</span>
          <DialogTrigger>
            <Button variant="outline" tone="danger">
              Remove selected
            </Button>
            <AlertDialog
              title={`Remove ${selectedCount} ${selectedCount === 1 ? 'beneficiary' : 'beneficiaries'}?`}
              tone="danger"
              actionLabel="Remove"
              onAction={() => handleRemoveMany(selected)}
            >
              They will no longer appear in your saved beneficiaries.
            </AlertDialog>
          </DialogTrigger>
        </DataTableToolbar>
      )}
      <DataTable
        aria-label="Beneficiaries"
        columns={columns}
        rows={sorted}
        getRowId={(r) => r.id}
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

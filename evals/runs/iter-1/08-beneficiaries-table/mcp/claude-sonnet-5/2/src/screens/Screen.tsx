import { useMemo, useState } from 'react';
import {
  AlertDialog,
  Avatar,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  DataTable,
  DataTableToolbar,
  Dialog,
  DialogTrigger,
  EmptyState,
  TextField,
  useSortedRows,
  type DataTableColumn,
  type DataTableSelection,
  type DataTableSortDescriptor,
} from '@strata/react';
import { IconPencil, IconTrash, IconUsers } from '@strata/icons';
import styles from './Screen.module.css';

type Beneficiary = {
  id: string;
  name: string;
  bank: string;
  last4: string;
  addedAt: Date;
};

const initialBeneficiaries: Beneficiary[] = [
  { id: 'ben-1', name: 'Asha Menon', bank: 'HDFC Bank', last4: '4821', addedAt: new Date(Date.UTC(2026, 1, 12)) },
  { id: 'ben-2', name: 'Daniel Okafor', bank: 'Access Bank', last4: '0193', addedAt: new Date(Date.UTC(2026, 4, 3)) },
  { id: 'ben-3', name: 'Mei Lin', bank: 'DBS Bank', last4: '7765', addedAt: new Date(Date.UTC(2025, 10, 28)) },
  { id: 'ben-4', name: 'Omar Haddad', bank: 'Emirates NBD', last4: '3340', addedAt: new Date(Date.UTC(2026, 6, 19)) },
  { id: 'ben-5', name: 'Sofia Rossi', bank: 'Intesa Sanpaolo', last4: '5502', addedAt: new Date(Date.UTC(2026, 2, 8)) },
  { id: 'ben-6', name: 'Kiran Rao', bank: 'ICICI Bank', last4: '2287', addedAt: new Date(Date.UTC(2026, 8, 1)) },
  { id: 'ben-7', name: 'Lucas Martin', bank: 'BNP Paribas', last4: '9014', addedAt: new Date(Date.UTC(2025, 9, 15)) },
];

const dateFormat = new Intl.DateTimeFormat('en-US', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });

const accessors = {
  name: (r: Beneficiary) => r.name,
  addedAt: (r: Beneficiary) => r.addedAt,
};

function EditBeneficiaryAction({
  beneficiary,
  onSave,
}: {
  beneficiary: Beneficiary;
  onSave: (id: string, updates: { name: string; bank: string; last4: string }) => void;
}) {
  const [name, setName] = useState(beneficiary.name);
  const [bank, setBank] = useState(beneficiary.bank);
  const [last4, setLast4] = useState(beneficiary.last4);
  const isValid = name.trim().length > 0 && bank.trim().length > 0 && last4.length === 4;

  return (
    <DialogTrigger
      onOpenChange={(isOpen) => {
        if (isOpen) {
          setName(beneficiary.name);
          setBank(beneficiary.bank);
          setLast4(beneficiary.last4);
        }
      }}
    >
      <Button variant="ghost" size="icon" aria-label={`Edit ${beneficiary.name}`}>
        <IconPencil aria-hidden />
      </Button>
      <Dialog
        title="Edit beneficiary"
        description="Update their name, bank and account details."
        footer={({ close }) => (
          <>
            <Button variant="outline" onPress={close}>
              Cancel
            </Button>
            <Button
              isDisabled={!isValid}
              onPress={() => {
                onSave(beneficiary.id, { name: name.trim(), bank: bank.trim(), last4 });
                close();
              }}
            >
              Save changes
            </Button>
          </>
        )}
      >
        <TextField label="Full name" value={name} onChange={setName} autoFocus />
        <TextField label="Bank" value={bank} onChange={setBank} />
        <TextField
          label="Last four digits"
          value={last4}
          onChange={(v) => setLast4(v.replace(/\D/g, '').slice(0, 4))}
          inputMode="numeric"
          description="4 digits, e.g. 4821"
        />
      </Dialog>
    </DialogTrigger>
  );
}

function RemoveBeneficiaryAction({ beneficiary, onRemove }: { beneficiary: Beneficiary; onRemove: (id: string) => void }) {
  return (
    <DialogTrigger>
      <Button variant="ghost" size="icon" tone="danger" aria-label={`Remove ${beneficiary.name}`}>
        <IconTrash aria-hidden />
      </Button>
      <AlertDialog
        title={`Remove ${beneficiary.name}?`}
        tone="danger"
        actionLabel="Remove"
        onAction={() => onRemove(beneficiary.id)}
      >
        You'll need to add {beneficiary.name} again before you can send them money.
      </AlertDialog>
    </DialogTrigger>
  );
}

export default function Screen() {
  const [beneficiaries, setBeneficiaries] = useState(initialBeneficiaries);
  const [sort, setSort] = useState<DataTableSortDescriptor>({ column: 'name', direction: 'ascending' });
  const [selected, setSelected] = useState<DataTableSelection>(new Set());

  const sorted = useSortedRows(beneficiaries, sort, accessors);
  const selectedCount = selected === 'all' ? beneficiaries.length : selected.size;

  const saveBeneficiary = (id: string, updates: { name: string; bank: string; last4: string }) => {
    setBeneficiaries((rows) => rows.map((r) => (r.id === id ? { ...r, ...updates } : r)));
  };

  const removeOne = (id: string) => {
    setBeneficiaries((rows) => rows.filter((r) => r.id !== id));
    setSelected((prev) => {
      if (prev === 'all') return prev;
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const removeSelected = () => {
    const ids = selected === 'all' ? new Set(beneficiaries.map((r) => r.id)) : selected;
    setBeneficiaries((rows) => rows.filter((r) => !ids.has(r.id)));
    setSelected(new Set());
  };

  const columns = useMemo<DataTableColumn<Beneficiary>[]>(
    () => [
      {
        id: 'name',
        header: 'Name',
        isRowHeader: true,
        allowsSorting: true,
        cell: (r) => (
          <span className={styles.nameCell}>
            <Avatar name={r.name} alt="" size="sm" />
            {r.name}
          </span>
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
            <EditBeneficiaryAction beneficiary={r} onSave={saveBeneficiary} />
            <RemoveBeneficiaryAction beneficiary={r} onRemove={removeOne} />
          </div>
        ),
      },
    ],
    [],
  );

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Beneficiaries</h1>
        <p className={styles.description}>People you can send money to.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle level={2}>
            {beneficiaries.length} {beneficiaries.length === 1 ? 'beneficiary' : 'beneficiaries'}
          </CardTitle>
          <CardDescription>Sort by name or date added. Select rows to remove several at once.</CardDescription>
        </CardHeader>

        {selectedCount > 0 && (
          <DataTableToolbar>
            <span className={styles.selectionCount} aria-live="polite">
              {selectedCount} selected
            </span>
            <DialogTrigger>
              <Button variant="outline" tone="danger" size="sm">
                <IconTrash aria-hidden />
                Remove selected
              </Button>
              <AlertDialog
                title={`Remove ${selectedCount} ${selectedCount === 1 ? 'beneficiary' : 'beneficiaries'}?`}
                tone="danger"
                actionLabel="Remove"
                onAction={removeSelected}
              >
                You'll need to add them again before you can send them money.
              </AlertDialog>
            </DialogTrigger>
          </DataTableToolbar>
        )}

        <CardContent variant="inset">
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
            emptyState={
              <EmptyState
                size="sm"
                level={3}
                icon={<IconUsers />}
                title="No beneficiaries"
                description="Beneficiaries you add will appear here."
              />
            }
          />
        </CardContent>
      </Card>
    </div>
  );
}

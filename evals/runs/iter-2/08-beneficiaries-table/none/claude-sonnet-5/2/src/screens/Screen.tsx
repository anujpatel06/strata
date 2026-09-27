import { useMemo, useState } from 'react';
import { useLocale } from 'react-aria-components';
import {
  AlertDialog,
  Avatar,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Dialog,
  DialogTrigger,
  EmptyState,
  IconTile,
  Select,
  SelectItem,
  TextField,
  DataTable,
  useSortedRows,
  type DataTableColumn,
  type DataTableSelection,
  type DataTableSortDescriptor,
} from '@strata/react';
import { IconBuildingBank, IconPencil, IconTrash, IconUsers } from '@strata/icons';
import styles from './Screen.module.css';

interface Beneficiary {
  id: string;
  name: string;
  bank: string;
  last4: string;
  addedOn: Date;
}

const BANKS = [
  'HDFC Bank',
  'ICICI Bank',
  'State Bank of India',
  'Axis Bank',
  'Kotak Mahindra Bank',
  'Yes Bank',
  'Punjab National Bank',
  'IndusInd Bank',
];

const INITIAL_BENEFICIARIES: Beneficiary[] = [
  { id: 'b1', name: 'Ananya Rao', bank: 'HDFC Bank', last4: '4821', addedOn: new Date('2025-11-02') },
  { id: 'b2', name: 'Vikram Sethi', bank: 'ICICI Bank', last4: '1076', addedOn: new Date('2026-01-14') },
  { id: 'b3', name: 'Meera Nair', bank: 'State Bank of India', last4: '3390', addedOn: new Date('2025-08-27') },
  { id: 'b4', name: 'Karan Malhotra', bank: 'Axis Bank', last4: '7742', addedOn: new Date('2026-03-05') },
  { id: 'b5', name: 'Priya Chatterjee', bank: 'Kotak Mahindra Bank', last4: '2258', addedOn: new Date('2025-12-19') },
  { id: 'b6', name: 'Rohan Kapoor', bank: 'Yes Bank', last4: '9014', addedOn: new Date('2026-02-08') },
  { id: 'b7', name: 'Ishaan Verma', bank: 'Punjab National Bank', last4: '5567', addedOn: new Date('2025-09-30') },
  { id: 'b8', name: 'Divya Menon', bank: 'IndusInd Bank', last4: '6683', addedOn: new Date('2026-04-21') },
];

const sortAccessors = {
  name: (row: Beneficiary) => row.name,
  addedOn: (row: Beneficiary) => row.addedOn,
};

function formatDate(date: Date, locale: string) {
  return new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(date);
}

interface EditFormProps {
  beneficiary: Beneficiary;
  onSave: (updated: Beneficiary) => void;
  close: () => void;
}

function EditBeneficiaryForm({ beneficiary, onSave, close }: EditFormProps) {
  const [name, setName] = useState(beneficiary.name);
  const [bank, setBank] = useState(beneficiary.bank);
  const [last4, setLast4] = useState(beneficiary.last4);

  const isValid = name.trim().length > 0 && /^\d{4}$/.test(last4);

  return (
    <form
      className={styles.editForm}
      onSubmit={(event) => {
        event.preventDefault();
        if (!isValid) return;
        onSave({ ...beneficiary, name: name.trim(), bank, last4 });
        close();
      }}
    >
      <TextField label="Name" value={name} onChange={setName} isRequired autoFocus />
      <Select
        label="Bank"
        selectedKey={bank}
        onSelectionChange={(key) => {
          if (key != null) setBank(String(key));
        }}
      >
        {BANKS.map((b) => (
          <SelectItem key={b} id={b}>
            {b}
          </SelectItem>
        ))}
      </Select>
      <TextField
        label="Account number (last 4 digits)"
        value={last4}
        onChange={(value) => setLast4(value.replace(/\D/g, '').slice(0, 4))}
        inputMode="numeric"
        maxLength={4}
        isRequired
      />
      <div className={styles.editFormActions}>
        <Button type="button" variant="outline" onPress={close}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" isDisabled={!isValid}>
          Save
        </Button>
      </div>
    </form>
  );
}

interface RowActionsProps {
  beneficiary: Beneficiary;
  onSave: (updated: Beneficiary) => void;
  onRemove: (id: string) => void;
}

function RowActions({ beneficiary, onSave, onRemove }: RowActionsProps) {
  return (
    <div className={styles.rowActions}>
      <DialogTrigger>
        <Button size="icon" variant="ghost" aria-label={`Edit ${beneficiary.name}`} title="Edit">
          <IconPencil />
        </Button>
        <Dialog title={`Edit ${beneficiary.name}`} size="sm">
          {({ close }) => <EditBeneficiaryForm beneficiary={beneficiary} onSave={onSave} close={close} />}
        </Dialog>
      </DialogTrigger>
      <DialogTrigger>
        <Button size="icon" variant="ghost" tone="danger" aria-label={`Remove ${beneficiary.name}`} title="Remove">
          <IconTrash />
        </Button>
        <AlertDialog
          title={`Remove ${beneficiary.name}?`}
          actionLabel="Remove"
          tone="danger"
          onAction={() => onRemove(beneficiary.id)}
        >
          They will no longer appear in your beneficiaries list. This can't be undone.
        </AlertDialog>
      </DialogTrigger>
    </div>
  );
}

export default function Screen() {
  const { locale } = useLocale();
  const [rows, setRows] = useState<Beneficiary[]>(INITIAL_BENEFICIARIES);
  const [selectedKeys, setSelectedKeys] = useState<DataTableSelection>(new Set<string>());
  const [sortDescriptor, setSortDescriptor] = useState<DataTableSortDescriptor>({
    column: 'name',
    direction: 'ascending',
  });
  const [pendingRemoveIds, setPendingRemoveIds] = useState<string[] | null>(null);

  const sortedRows = useSortedRows(rows, sortDescriptor, sortAccessors);

  const selectedCount = selectedKeys === 'all' ? rows.length : selectedKeys.size;

  const selectedIds = useMemo(
    () => (selectedKeys === 'all' ? new Set(rows.map((r) => r.id)) : new Set([...selectedKeys].map(String))),
    [selectedKeys, rows],
  );

  function updateBeneficiary(updated: Beneficiary) {
    setRows((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
  }

  function removeOne(id: string) {
    setRows((prev) => prev.filter((r) => r.id !== id));
    setSelectedKeys((prev) => {
      if (prev === 'all') return prev;
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }

  function confirmRemoveSelected() {
    if (!pendingRemoveIds) return;
    const ids = new Set(pendingRemoveIds);
    setRows((prev) => prev.filter((r) => !ids.has(r.id)));
    setSelectedKeys(new Set<string>());
  }

  const columns: DataTableColumn<Beneficiary>[] = [
    {
      id: 'name',
      header: 'Name',
      isRowHeader: true,
      allowsSorting: true,
      cell: (row) => (
        <div className={styles.nameCell}>
          <Avatar name={row.name} size="sm" />
          <span className={styles.name}>{row.name}</span>
        </div>
      ),
    },
    {
      id: 'bank',
      header: 'Bank',
      cell: (row) => (
        <div className={styles.bankCell}>
          <IconTile size="sm" tint="none">
            <IconBuildingBank />
          </IconTile>
          <span>{row.bank}</span>
        </div>
      ),
    },
    {
      id: 'account',
      header: 'Account',
      cell: (row) => <span className={styles.account}>•••• {row.last4}</span>,
    },
    {
      id: 'addedOn',
      header: 'Added',
      allowsSorting: true,
      cell: (row) => <span className={styles.addedOn}>{formatDate(row.addedOn, locale)}</span>,
    },
    {
      id: 'actions',
      header: <span className={styles.visuallyHidden}>Actions</span>,
      textValue: 'Actions',
      align: 'end',
      width: 96,
      cell: (row) => <RowActions beneficiary={row} onSave={updateBeneficiary} onRemove={removeOne} />,
    },
  ];

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <h1 className={styles.title}>Beneficiaries</h1>
        <p className={styles.subtitle}>People you've added to send money to.</p>
      </header>

      <Card>
        <CardHeader divider>
          <CardTitle level={2}>{rows.length} beneficiaries</CardTitle>
          <CardDescription>Select rows to remove more than one at a time.</CardDescription>
        </CardHeader>

        {selectedCount > 0 && (
          <div className={styles.selectionBar}>
            <span className={styles.selectionCount}>{selectedCount} selected</span>
            <div className={styles.selectionActions}>
              <Button variant="ghost" size="sm" onPress={() => setSelectedKeys(new Set<string>())}>
                Clear
              </Button>
              <Button
                variant="primary"
                tone="danger"
                size="sm"
                onPress={() => setPendingRemoveIds([...selectedIds])}
              >
                Remove selected
              </Button>
            </div>
          </div>
        )}

        <CardContent variant="inset">
          <DataTable
            aria-label="Beneficiaries"
            columns={columns}
            rows={sortedRows}
            getRowId={(row) => row.id}
            selectionMode="multiple"
            selectedKeys={selectedKeys}
            onSelectionChange={setSelectedKeys}
            sortDescriptor={sortDescriptor}
            onSortChange={setSortDescriptor}
            emptyState={
              <EmptyState
                size="sm"
                icon={<IconUsers />}
                title="No beneficiaries"
                description="Everyone you've added has been removed."
              />
            }
          />
        </CardContent>
      </Card>

      <AlertDialog
        isOpen={pendingRemoveIds !== null}
        onOpenChange={(open) => {
          if (!open) setPendingRemoveIds(null);
        }}
        title={`Remove ${pendingRemoveIds?.length ?? 0} beneficiaries?`}
        actionLabel="Remove"
        tone="danger"
        onAction={confirmRemoveSelected}
      >
        They will no longer appear in your beneficiaries list. This can't be undone.
      </AlertDialog>
    </div>
  );
}

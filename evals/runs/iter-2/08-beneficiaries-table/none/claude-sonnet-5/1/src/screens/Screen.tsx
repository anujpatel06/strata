import { useState } from 'react';
import type { Key } from 'react-aria-components';
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
  type DataTableColumn,
  type DataTableSelection,
  type DataTableSortDescriptor,
  Dialog,
  EmptyState,
  TextField,
  Tooltip,
  TooltipTrigger,
  useSortedRows,
} from '@strata/react';
import { IconPencil, IconTrash, IconUsers } from '@strata/icons';
import styles from './Screen.module.css';

interface Beneficiary {
  id: string;
  name: string;
  bank: string;
  last4: string;
  addedOn: string;
}

const initialBeneficiaries: Beneficiary[] = [
  { id: 'b1', name: 'Priya Sharma', bank: 'HDFC Bank', last4: '4521', addedOn: '2026-08-14' },
  { id: 'b2', name: 'Arjun Mehta', bank: 'ICICI Bank', last4: '7790', addedOn: '2026-02-03' },
  { id: 'b3', name: 'Fatima Khan', bank: 'Axis Bank', last4: '3306', addedOn: '2026-06-27' },
  { id: 'b4', name: 'Rohan Deshmukh', bank: 'State Bank of India', last4: '1188', addedOn: '2025-11-19' },
  { id: 'b5', name: 'Ananya Iyer', bank: 'Kotak Mahindra Bank', last4: '9042', addedOn: '2026-01-30' },
  { id: 'b6', name: 'Vikram Nair', bank: 'Yes Bank', last4: '5567', addedOn: '2026-05-08' },
  { id: 'b7', name: 'Sara Ahmed', bank: 'HDFC Bank', last4: '2214', addedOn: '2025-09-22' },
];

const sortAccessors = {
  name: (row: Beneficiary) => row.name,
  addedOn: (row: Beneficiary) => new Date(row.addedOn),
};

const dateFormatter = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

function resolveSelectedIds(selection: DataTableSelection, rows: Beneficiary[]): string[] {
  if (selection === 'all') return rows.map((row) => row.id);
  return Array.from(selection as Set<Key>, (key) => String(key));
}

export default function Screen() {
  const [rows, setRows] = useState(initialBeneficiaries);
  const [sortDescriptor, setSortDescriptor] = useState<DataTableSortDescriptor>({
    column: 'name',
    direction: 'ascending',
  });
  const [selectedKeys, setSelectedKeys] = useState<DataTableSelection>(new Set());
  const [editing, setEditing] = useState<Beneficiary | null>(null);
  const [editName, setEditName] = useState('');
  const [editBank, setEditBank] = useState('');
  const [removeTarget, setRemoveTarget] = useState<{ ids: string[]; description: string } | null>(null);

  const sortedRows = useSortedRows(rows, sortDescriptor, sortAccessors);
  const selectedCount = selectedKeys === 'all' ? rows.length : selectedKeys.size;

  function openEdit(row: Beneficiary) {
    setEditing(row);
    setEditName(row.name);
    setEditBank(row.bank);
  }

  function saveEdit() {
    if (!editing) return;
    setRows((prev) =>
      prev.map((row) => (row.id === editing.id ? { ...row, name: editName.trim() || row.name, bank: editBank.trim() || row.bank } : row)),
    );
    setEditing(null);
  }

  function confirmRemove() {
    if (!removeTarget) return;
    const ids = new Set(removeTarget.ids);
    setRows((prev) => prev.filter((row) => !ids.has(row.id)));
    setSelectedKeys(new Set());
    setRemoveTarget(null);
  }

  const columns: DataTableColumn<Beneficiary>[] = [
    {
      id: 'name',
      header: 'Name',
      isRowHeader: true,
      allowsSorting: true,
      cell: (row) => (
        <div className={styles.person}>
          <Avatar name={row.name} size="sm" />
          <span>{row.name}</span>
        </div>
      ),
    },
    {
      id: 'bank',
      header: 'Bank',
      cell: (row) => row.bank,
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
      cell: (row) => dateFormatter.format(new Date(row.addedOn)),
    },
    {
      id: 'actions',
      header: <span className={styles.srOnly}>Actions</span>,
      textValue: 'Actions',
      align: 'end',
      width: 96,
      cell: (row) => (
        <div className={styles.actions}>
          <TooltipTrigger delay={300}>
            <Button size="icon" variant="ghost" aria-label={`Edit ${row.name}`} onPress={() => openEdit(row)}>
              <IconPencil />
            </Button>
            <Tooltip>Edit</Tooltip>
          </TooltipTrigger>
          <TooltipTrigger delay={300}>
            <Button
              size="icon"
              variant="ghost"
              tone="danger"
              aria-label={`Remove ${row.name}`}
              onPress={() => setRemoveTarget({ ids: [row.id], description: row.name })}
            >
              <IconTrash />
            </Button>
            <Tooltip>Remove</Tooltip>
          </TooltipTrigger>
        </div>
      ),
    },
  ];

  return (
    <Card>
      <CardHeader divider>
        <CardTitle>Beneficiaries</CardTitle>
        <CardDescription>
          {rows.length} {rows.length === 1 ? 'person' : 'people'} you've added for transfers.
        </CardDescription>
      </CardHeader>

      {selectedCount > 0 && (
        <div className={styles.selectionBar} aria-live="polite">
          <span className={styles.selectionCount}>
            {selectedCount} selected
          </span>
          <div className={styles.selectionActions}>
            <Button size="sm" variant="ghost" onPress={() => setSelectedKeys(new Set())}>
              Cancel
            </Button>
            <Button
              size="sm"
              variant="outline"
              tone="danger"
              onPress={() =>
                setRemoveTarget({
                  ids: resolveSelectedIds(selectedKeys, rows),
                  description: `${selectedCount} beneficiaries`,
                })
              }
            >
              <IconTrash />
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
              description="Add someone to start sending them money."
            />
          }
        />
      </CardContent>

      <Dialog
        title="Edit beneficiary"
        size="sm"
        isOpen={editing !== null}
        onOpenChange={(open) => {
          if (!open) setEditing(null);
        }}
        footer={({ close }) => (
          <>
            <Button variant="ghost" onPress={close}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onPress={() => {
                saveEdit();
                close();
              }}
            >
              Save
            </Button>
          </>
        )}
      >
        <div className={styles.editForm}>
          <TextField label="Name" value={editName} onChange={setEditName} />
          <TextField label="Bank" value={editBank} onChange={setEditBank} />
        </div>
      </Dialog>

      <AlertDialog
        title={removeTarget && removeTarget.ids.length > 1 ? `Remove ${removeTarget.ids.length} beneficiaries?` : `Remove ${removeTarget?.description ?? 'this beneficiary'}?`}
        actionLabel="Remove"
        cancelLabel="Cancel"
        tone="danger"
        isOpen={removeTarget !== null}
        onOpenChange={(open) => {
          if (!open) setRemoveTarget(null);
        }}
        onAction={confirmRemove}
      >
        They'll need to be added again before you can send them money.
      </AlertDialog>
    </Card>
  );
}

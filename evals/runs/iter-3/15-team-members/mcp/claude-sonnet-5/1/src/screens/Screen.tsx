import { useState } from 'react';
import {
  AlertDialog,
  Avatar,
  Badge,
  Button,
  DataTable,
  Dialog,
  DialogTrigger,
  Menu,
  MenuItem,
  MenuSection,
  MenuSeparator,
  MenuTrigger,
  Select,
  SelectItem,
  TextField,
  type DataTableColumn,
  type Key,
} from '@syntara/react';
import { IconDotsVertical, IconUserPlus } from '@syntara/icons';
import styles from './Screen.module.css';

type Role = 'owner' | 'admin' | 'member';

type Person = {
  id: string;
  name: string;
  email: string;
  role: Role;
  lastActive: string;
};

const initialPeople: Person[] = [
  { id: 'p1', name: 'Amara Osei', email: 'amara.osei@northwind.io', role: 'owner', lastActive: 'Active now' },
  { id: 'p2', name: 'Diego Fernandez', email: 'diego.fernandez@northwind.io', role: 'admin', lastActive: '2 hours ago' },
  { id: 'p3', name: 'Priya Raman', email: 'priya.raman@northwind.io', role: 'admin', lastActive: 'Yesterday' },
  { id: 'p4', name: 'Mei Lin', email: 'mei.lin@northwind.io', role: 'member', lastActive: '3 days ago' },
  { id: 'p5', name: 'Omar Haddad', email: 'omar.haddad@northwind.io', role: 'member', lastActive: '1 week ago' },
  { id: 'p6', name: 'Sofia Kowalski', email: 'sofia.kowalski@northwind.io', role: 'member', lastActive: '3 weeks ago' },
  { id: 'p7', name: 'Ethan Brooks', email: 'ethan.brooks@northwind.io', role: 'member', lastActive: '2 months ago' },
];

const roleLabel: Record<Role, string> = {
  owner: 'Owner',
  admin: 'Admin',
  member: 'Member',
};

const roleTone: Record<Role, 'brand' | 'info' | 'neutral'> = {
  owner: 'brand',
  admin: 'info',
  member: 'neutral',
};

let nextId = initialPeople.length + 1;

export default function Screen() {
  const [people, setPeople] = useState<Person[]>(initialPeople);
  const [removeTarget, setRemoveTarget] = useState<Person | null>(null);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<Key>('member');

  const isInviteEmailValid = /\S+@\S+\.\S+/.test(inviteEmail.trim());

  function handleMenuAction(person: Person, key: Key) {
    if (key === 'remove') {
      setRemoveTarget(person);
      return;
    }
    const role = String(key).replace('role-', '') as Role;
    setPeople((prev) => prev.map((p) => (p.id === person.id ? { ...p, role } : p)));
  }

  function handleInvite() {
    if (!isInviteEmailValid) {
      return;
    }
    const email = inviteEmail.trim();
    const name = email
      .split('@')[0]
      .replace(/[._]/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());
    setPeople((prev) => [
      ...prev,
      { id: `p${nextId++}`, name, email, role: inviteRole as Role, lastActive: 'Invited, not yet active' },
    ]);
  }

  const columns: DataTableColumn<Person>[] = [
    {
      id: 'name',
      header: 'Name',
      isRowHeader: true,
      cell: (row) => (
        <div className={styles.member}>
          <Avatar name={row.name} size="sm" />
          <span>{row.name}</span>
        </div>
      ),
    },
    {
      id: 'email',
      header: 'Email',
      cell: (row) => row.email,
    },
    {
      id: 'role',
      header: 'Role',
      cell: (row) => (
        <Badge variant="status" tone={roleTone[row.role]}>
          {roleLabel[row.role]}
        </Badge>
      ),
    },
    {
      id: 'lastActive',
      header: 'Last active',
      cell: (row) => <span className={styles.subtle}>{row.lastActive}</span>,
    },
    {
      id: 'actions',
      header: 'Actions',
      align: 'end',
      cell: (row) => (
        <MenuTrigger>
          <Button variant="ghost" size="icon" aria-label={`Actions for ${row.name}`}>
            <IconDotsVertical aria-hidden />
          </Button>
          <Menu onAction={(key) => handleMenuAction(row, key)} disabledKeys={[`role-${row.role}`]}>
            <MenuSection title="Change role">
              <MenuItem id="role-owner">Owner</MenuItem>
              <MenuItem id="role-admin">Admin</MenuItem>
              <MenuItem id="role-member">Member</MenuItem>
            </MenuSection>
            <MenuSeparator />
            <MenuItem id="remove" tone="danger">
              Remove from workspace
            </MenuItem>
          </Menu>
        </MenuTrigger>
      ),
    },
  ];

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Team members</h1>
          <p className={styles.subtitle}>{people.length} people have access to this workspace.</p>
        </div>
        <DialogTrigger
          onOpenChange={(isOpen) => {
            if (!isOpen) {
              setInviteEmail('');
              setInviteRole('member');
            }
          }}
        >
          <Button>
            <IconUserPlus aria-hidden />
            Invite
          </Button>
          <Dialog
            title="Invite a member"
            description="They'll get an email to join this workspace."
            footer={({ close }) => (
              <>
                <Button variant="ghost" onPress={close}>
                  Cancel
                </Button>
                <Button
                  onPress={() => {
                    handleInvite();
                    close();
                  }}
                  isDisabled={!isInviteEmailValid}
                >
                  Send invite
                </Button>
              </>
            )}
          >
            <TextField
              label="Email"
              type="email"
              isRequired
              value={inviteEmail}
              onChange={setInviteEmail}
            />
            <Select
              label="Role"
              placeholder="Choose a role"
              selectedKey={inviteRole}
              onSelectionChange={(key) => key !== null && setInviteRole(key)}
            >
              <SelectItem id="admin">Admin</SelectItem>
              <SelectItem id="member">Member</SelectItem>
            </Select>
          </Dialog>
        </DialogTrigger>
      </header>

      <DataTable aria-label="Team members" columns={columns} rows={people} getRowId={(row) => row.id} />

      <AlertDialog
        isOpen={removeTarget !== null}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            setRemoveTarget(null);
          }
        }}
        title={removeTarget ? `Remove ${removeTarget.name}?` : ''}
        tone="danger"
        actionLabel="Remove member"
        onAction={() => {
          if (removeTarget) {
            setPeople((prev) => prev.filter((p) => p.id !== removeTarget.id));
          }
          setRemoveTarget(null);
        }}
      >
        {removeTarget ? `${removeTarget.name} will lose access to this workspace immediately. This can't be undone.` : null}
      </AlertDialog>
    </div>
  );
}

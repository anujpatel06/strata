'use client';

import { useState } from 'react';
import {
  Avatar,
  Badge,
  Button,
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  DataTable,
  type DataTableColumn,
  Dialog,
  DialogTrigger,
  AlertDialog,
  Menu,
  MenuItem,
  MenuSection,
  MenuSeparator,
  MenuTrigger,
  Select,
  SelectItem,
  TextField,
} from '@strata/react';
import { IconDotsVertical, IconUserPlus } from '@strata/icons';
import styles from './Screen.module.css';

type Role = 'owner' | 'admin' | 'member';

type Member = {
  id: string;
  name: string;
  email: string;
  role: Role;
  lastActive: string;
};

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

const initialMembers: Member[] = [
  {
    id: 'm1',
    name: 'Priya Raman',
    email: 'priya.raman@example.com',
    role: 'owner',
    lastActive: 'Active now',
  },
  {
    id: 'm2',
    name: 'Daniel Okafor',
    email: 'daniel.okafor@example.com',
    role: 'admin',
    lastActive: '2 hours ago',
  },
  {
    id: 'm3',
    name: 'Mei Lin',
    email: 'mei.lin@example.com',
    role: 'admin',
    lastActive: 'Yesterday',
  },
  {
    id: 'm4',
    name: 'Omar Haddad',
    email: 'omar.haddad@example.com',
    role: 'member',
    lastActive: '3 days ago',
  },
  {
    id: 'm5',
    name: 'Anjali Sharma',
    email: 'anjali.sharma@example.com',
    role: 'member',
    lastActive: '1 week ago',
  },
  {
    id: 'm6',
    name: 'Lucas Ferreira',
    email: 'lucas.ferreira@example.com',
    role: 'member',
    lastActive: '2 weeks ago',
  },
  {
    id: 'm7',
    name: 'Sara Novak',
    email: 'sara.novak@example.com',
    role: 'member',
    lastActive: '1 month ago',
  },
];

export default function Screen() {
  const [members, setMembers] = useState<Member[]>(initialMembers);
  const [memberToRemove, setMemberToRemove] = useState<Member | null>(null);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<Role>('member');
  const [isInviteOpen, setIsInviteOpen] = useState(false);

  function changeRole(id: string, role: Role) {
    setMembers((current) => current.map((m) => (m.id === id ? { ...m, role } : m)));
  }

  function removeMember(id: string) {
    setMembers((current) => current.filter((m) => m.id !== id));
    setMemberToRemove(null);
  }

  function sendInvite() {
    const email = inviteEmail.trim();
    if (!email) return;
    setMembers((current) => [
      ...current,
      {
        id: `invited-${Date.now()}`,
        name: email,
        email,
        role: inviteRole,
        lastActive: 'Invited, not yet active',
      },
    ]);
    setInviteEmail('');
    setInviteRole('member');
    setIsInviteOpen(false);
  }

  const columns: DataTableColumn<Member>[] = [
    {
      id: 'name',
      header: 'Name',
      isRowHeader: true,
      cell: (row) => (
        <div className={styles.person}>
          <Avatar name={row.name} size="sm" />
          <div className={styles.personText}>
            <span className={styles.personName}>{row.name}</span>
            <span className={styles.personEmail}>{row.email}</span>
          </div>
        </div>
      ),
    },
    {
      id: 'role',
      header: 'Role',
      cell: (row) => (
        <Badge tone={roleTone[row.role]} variant="status">
          {roleLabel[row.role]}
        </Badge>
      ),
    },
    {
      id: 'lastActive',
      header: 'Last active',
      cell: (row) => <span className={styles.lastActive}>{row.lastActive}</span>,
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
          <Menu>
            <MenuSection
              title="Role"
              selectionMode="single"
              selectedKeys={[row.role]}
              onSelectionChange={(keys) => {
                if (keys === 'all') return;
                const [next] = keys;
                if (next) changeRole(row.id, next as Role);
              }}
            >
              <MenuItem id="owner">Owner</MenuItem>
              <MenuItem id="admin">Admin</MenuItem>
              <MenuItem id="member">Member</MenuItem>
            </MenuSection>
            <MenuSeparator />
            <MenuItem id="remove" tone="danger" onAction={() => setMemberToRemove(row)}>
              Remove from team
            </MenuItem>
          </Menu>
        </MenuTrigger>
      ),
    },
  ];

  return (
    <div className={styles.page}>
      <Card>
        <CardHeader>
          <CardTitle level={1}>Team members</CardTitle>
          <CardDescription>People with access to this workspace.</CardDescription>
          <CardAction>
            <DialogTrigger isOpen={isInviteOpen} onOpenChange={setIsInviteOpen}>
              <Button>
                <IconUserPlus aria-hidden />
                Invite
              </Button>
              <Dialog
                title="Invite a member"
                description="They'll get an email with a link to join this workspace."
                footer={({ close }) => (
                  <>
                    <Button variant="outline" onPress={close}>
                      Cancel
                    </Button>
                    <Button onPress={sendInvite}>Send invite</Button>
                  </>
                )}
              >
                <TextField
                  label="Email"
                  type="email"
                  value={inviteEmail}
                  onChange={setInviteEmail}
                  autoFocus
                  isRequired
                />
                <Select
                  label="Role"
                  selectedKey={inviteRole}
                  onSelectionChange={(key) => key && setInviteRole(key as Role)}
                >
                  <SelectItem id="admin">Admin</SelectItem>
                  <SelectItem id="member">Member</SelectItem>
                </Select>
              </Dialog>
            </DialogTrigger>
          </CardAction>
        </CardHeader>
        <CardContent variant="inset">
          <DataTable aria-label="Team members" columns={columns} rows={members} getRowId={(row) => row.id} />
        </CardContent>
      </Card>

      <AlertDialog
        title={memberToRemove ? `Remove ${memberToRemove.name}?` : 'Remove member?'}
        actionLabel="Remove"
        tone="danger"
        isOpen={memberToRemove !== null}
        onOpenChange={(open) => {
          if (!open) setMemberToRemove(null);
        }}
        onAction={() => {
          if (memberToRemove) removeMember(memberToRemove.id);
        }}
      >
        They will lose access to this workspace immediately. This can't be undone.
      </AlertDialog>
    </div>
  );
}

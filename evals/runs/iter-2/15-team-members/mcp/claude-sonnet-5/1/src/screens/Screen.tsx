'use client';

import { useState } from 'react';
import {
  AlertDialog,
  Avatar,
  Button,
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  DataTable,
  Dialog,
  DialogTrigger,
  Menu,
  MenuItem,
  MenuSeparator,
  MenuTrigger,
  Select,
  SelectItem,
  SubmenuTrigger,
  Tag,
  TextField,
  useSortedRows,
  type DataTableColumn,
  type DataTableSortDescriptor,
} from '@strata/react';
import { IconDotsVertical, IconUserPlus } from '@strata/icons';
import styles from './Screen.module.css';

type Role = 'owner' | 'admin' | 'member';

type Member = {
  id: string;
  name: string;
  email: string;
  role: Role;
  lastActive: Date;
};

const now = new Date();
const hoursAgo = (h: number) => new Date(now.getTime() - h * 60 * 60 * 1000);
const daysAgo = (d: number) => hoursAgo(d * 24);

const initialMembers: Member[] = [
  { id: 'm1', name: 'Maya Chen', email: 'maya.chen@brightpath.io', role: 'owner', lastActive: hoursAgo(0.25) },
  { id: 'm2', name: 'Owen Bright', email: 'owen.bright@brightpath.io', role: 'admin', lastActive: daysAgo(1) },
  { id: 'm3', name: 'Priya Raman', email: 'priya.raman@brightpath.io', role: 'admin', lastActive: daysAgo(3) },
  { id: 'm4', name: 'Daniel Okafor', email: 'daniel.okafor@brightpath.io', role: 'member', lastActive: hoursAgo(2) },
  { id: 'm5', name: 'Sofia Marín', email: 'sofia.marin@brightpath.io', role: 'member', lastActive: daysAgo(8) },
  { id: 'm6', name: 'Ravi Shah', email: 'ravi.shah@brightpath.io', role: 'member', lastActive: daysAgo(21) },
  { id: 'm7', name: 'Layla Haddad', email: 'layla.haddad@brightpath.io', role: 'member', lastActive: daysAgo(62) },
];

const roleLabels: Record<Role, string> = { owner: 'Owner', admin: 'Admin', member: 'Member' };
const roleTones: Record<Role, 'brand' | 'info' | 'neutral'> = { owner: 'brand', admin: 'info', member: 'neutral' };

const dateFormatter = new Intl.DateTimeFormat('en-US', { day: 'numeric', month: 'short', year: 'numeric' });

function formatLastActive(date: Date): string {
  const minutes = Math.round((now.getTime() - date.getTime()) / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.round(hours / 24);
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  const weeks = Math.round(days / 7);
  if (weeks < 5) return `${weeks} week${weeks === 1 ? '' : 's'} ago`;
  return dateFormatter.format(date);
}

const sortAccessors = {
  name: (m: Member) => m.name,
  role: (m: Member) => m.role,
  lastActive: (m: Member) => m.lastActive,
};

export default function Screen() {
  const [members, setMembers] = useState<Member[]>(initialMembers);
  const [sort, setSort] = useState<DataTableSortDescriptor>({ column: 'lastActive', direction: 'descending' });
  const [pendingRemovalId, setPendingRemovalId] = useState<string | null>(null);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('member');
  const [inviteError, setInviteError] = useState('');

  const sortedMembers = useSortedRows(members, sort, sortAccessors);

  const changeRole = (id: string, role: Role) => {
    setMembers((prev) => prev.map((m) => (m.id === id ? { ...m, role } : m)));
  };

  const removeMember = (id: string) => {
    setMembers((prev) => prev.filter((m) => m.id !== id));
  };

  const resetInviteForm = () => {
    setInviteEmail('');
    setInviteRole('member');
    setInviteError('');
  };

  const sendInvite = () => {
    const email = inviteEmail.trim();
    if (!email || !email.includes('@')) {
      setInviteError('Enter a valid email address.');
      return;
    }
    const role: Role = inviteRole === 'admin' ? 'admin' : 'member';
    setMembers((prev) => [
      ...prev,
      { id: `m${Date.now()}`, name: email.split('@')[0]!, email, role, lastActive: now },
    ]);
    resetInviteForm();
    setIsInviteOpen(false);
  };

  const columns: DataTableColumn<Member>[] = [
    {
      id: 'name',
      header: 'Member',
      isRowHeader: true,
      allowsSorting: true,
      cell: (m) => (
        <div className={styles.memberCell}>
          <Avatar name={m.name} size="sm" />
          <div className={styles.memberInfo}>
            <span className={styles.memberName}>{m.name}</span>
            <span className={styles.memberEmail}>{m.email}</span>
          </div>
        </div>
      ),
    },
    {
      id: 'role',
      header: 'Role',
      allowsSorting: true,
      cell: (m) => <Tag tone={roleTones[m.role]}>{roleLabels[m.role]}</Tag>,
    },
    {
      id: 'lastActive',
      header: 'Last active',
      allowsSorting: true,
      cell: (m) => formatLastActive(m.lastActive),
    },
    {
      id: 'actions',
      header: 'Actions',
      align: 'end',
      cell: (m) => (
        <>
          <MenuTrigger>
            <Button variant="ghost" size="icon" aria-label={`Actions for ${m.name}`}>
              <IconDotsVertical aria-hidden />
            </Button>
            <Menu
              disabledKeys={m.role === 'owner' ? ['change-role', 'remove'] : []}
              onAction={(key) => {
                if (key === 'remove') setPendingRemovalId(m.id);
              }}
            >
              <SubmenuTrigger>
                <MenuItem id="change-role">Change role</MenuItem>
                <Menu
                  selectionMode="single"
                  selectedKeys={[m.role]}
                  onSelectionChange={(keys) => {
                    if (keys === 'all') return;
                    const [next] = keys;
                    if (next) changeRole(m.id, next as Role);
                  }}
                >
                  <MenuItem id="owner">Owner</MenuItem>
                  <MenuItem id="admin">Admin</MenuItem>
                  <MenuItem id="member">Member</MenuItem>
                </Menu>
              </SubmenuTrigger>
              <MenuSeparator />
              <MenuItem id="remove" tone="danger">
                Remove member
              </MenuItem>
            </Menu>
          </MenuTrigger>
          <AlertDialog
            isOpen={pendingRemovalId === m.id}
            onOpenChange={(open) => {
              if (!open) setPendingRemovalId(null);
            }}
            title={`Remove ${m.name}?`}
            tone="danger"
            actionLabel="Remove member"
            onAction={() => removeMember(m.id)}
          >
            They will lose access to this workspace immediately. This can't be undone.
          </AlertDialog>
        </>
      ),
    },
  ];

  return (
    <div className={styles.page}>
      <Card>
        <CardHeader divider>
          <CardTitle>Team members</CardTitle>
          <CardDescription>People with access to this workspace.</CardDescription>
          <CardAction>
            <DialogTrigger
              isOpen={isInviteOpen}
              onOpenChange={(open) => {
                setIsInviteOpen(open);
                if (!open) resetInviteForm();
              }}
            >
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
                  onChange={(value) => {
                    setInviteEmail(value);
                    if (inviteError) setInviteError('');
                  }}
                  isInvalid={!!inviteError}
                  errorMessage={inviteError}
                  isRequired
                  autoFocus
                />
                <Select
                  label="Role"
                  selectedKey={inviteRole}
                  onSelectionChange={(key) => key != null && setInviteRole(String(key))}
                >
                  <SelectItem id="admin">Admin</SelectItem>
                  <SelectItem id="member">Member</SelectItem>
                </Select>
              </Dialog>
            </DialogTrigger>
          </CardAction>
        </CardHeader>
        <CardContent variant="inset">
          <DataTable
            aria-label="Team members"
            columns={columns}
            rows={sortedMembers}
            getRowId={(m) => m.id}
            sortDescriptor={sort}
            onSortChange={setSort}
          />
        </CardContent>
      </Card>
    </div>
  );
}

'use client';

import { useId, useMemo, useState, type Key } from 'react';
import {
  AlertDialog,
  Avatar,
  Badge,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogTrigger,
  Menu,
  MenuItem,
  MenuSection,
  MenuSeparator,
  MenuTrigger,
  Select,
  SelectItem,
  DataTable,
  TextField,
  type DataTableColumn,
} from '@syntara/react';
import { IconDots, IconUserPlus } from '@syntara/icons';
import styles from './Screen.module.css';

type Role = 'owner' | 'admin' | 'member';

interface Member {
  id: string;
  name: string;
  email: string;
  role: Role;
  lastActive: string;
}

const initialMembers: Member[] = [
  { id: 'm1', name: 'Priya Raman', email: 'priya.raman@example.com', role: 'owner', lastActive: '2026-09-28T09:15:00Z' },
  { id: 'm2', name: 'Daniel Okafor', email: 'daniel.okafor@example.com', role: 'admin', lastActive: '2026-09-27T17:40:00Z' },
  { id: 'm3', name: 'Mei Lin', email: 'mei.lin@example.com', role: 'admin', lastActive: '2026-09-25T11:05:00Z' },
  { id: 'm4', name: 'Omar Haddad', email: 'omar.haddad@example.com', role: 'member', lastActive: '2026-09-28T07:50:00Z' },
  { id: 'm5', name: 'Sofia Alvarez', email: 'sofia.alvarez@example.com', role: 'member', lastActive: '2026-09-20T14:22:00Z' },
  { id: 'm6', name: 'Kenji Watanabe', email: 'kenji.watanabe@example.com', role: 'member', lastActive: '2026-09-14T08:05:00Z' },
  { id: 'm7', name: 'Ava Bennett', email: 'ava.bennett@example.com', role: 'member', lastActive: '2026-08-30T16:12:00Z' },
];

const roleLabels: Record<Role, string> = { owner: 'Owner', admin: 'Admin', member: 'Member' };
const roleTones: Record<Role, 'brand' | 'info' | 'neutral'> = { owner: 'brand', admin: 'info', member: 'neutral' };
const roleOrder: Role[] = ['owner', 'admin', 'member'];

const relativeTime = new Intl.RelativeTimeFormat('en-US', { numeric: 'auto' });
const absoluteTime = new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' });

function formatLastActive(iso: string): string {
  const then = new Date(iso).getTime();
  const days = Math.round((then - Date.now()) / 86_400_000);
  if (days >= -13) return relativeTime.format(days, 'day');
  return absoluteTime.format(new Date(iso));
}

export default function Screen() {
  const uid = useId();
  const [members, setMembers] = useState<Member[]>(initialMembers);
  const [pendingRemoval, setPendingRemoval] = useState<Member | null>(null);

  const changeRole = (id: string, role: Role) => {
    setMembers((all) => all.map((m) => (m.id === id ? { ...m, role } : m)));
  };

  const removeMember = (id: string) => {
    setMembers((all) => all.filter((m) => m.id !== id));
  };

  const inviteMember = (email: string, role: Role) => {
    const name = email.split('@')[0] ?? email;
    setMembers((all) => [
      ...all,
      {
        id: `${Date.now()}`,
        name: name.replace(/[._]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
        email,
        role,
        lastActive: new Date().toISOString(),
      },
    ]);
  };

  const columns = useMemo<DataTableColumn<Member>[]>(
    () => [
      {
        id: 'name',
        header: 'Member',
        isRowHeader: true,
        cell: (row) => (
          <span className={styles.member}>
            <Avatar name={row.name} alt="" size="md" />
            <span className={styles.memberText}>
              <span className={styles.memberName}>{row.name}</span>
              <span className={styles.memberEmail}>{row.email}</span>
            </span>
          </span>
        ),
      },
      {
        id: 'role',
        header: 'Role',
        cell: (row) => (
          <Badge variant="status" tone={roleTones[row.role]}>
            {roleLabels[row.role]}
          </Badge>
        ),
      },
      {
        id: 'lastActive',
        header: 'Last active',
        cell: (row) => (
          <time dateTime={row.lastActive} className={styles.lastActive}>
            {formatLastActive(row.lastActive)}
          </time>
        ),
      },
      {
        id: 'actions',
        header: <span className={styles.srOnly}>Actions</span>,
        textValue: 'Actions',
        align: 'end',
        cell: (row) => (
          <MenuTrigger>
            <Button variant="ghost" size="icon" aria-label={`Actions for ${row.name}`}>
              <IconDots aria-hidden />
            </Button>
            <Menu
              placement="bottom end"
              onAction={(key: Key) => {
                if (key === 'remove') setPendingRemoval(row);
              }}
            >
              <MenuSection
                title="Change role"
                selectionMode="single"
                selectedKeys={new Set([row.role])}
                onSelectionChange={(keys) => {
                  if (keys === 'all') return;
                  const [next] = keys;
                  if (next) changeRole(row.id, next as Role);
                }}
              >
                {roleOrder.map((role) => (
                  <MenuItem key={role} id={role}>
                    {roleLabels[role]}
                  </MenuItem>
                ))}
              </MenuSection>
              <MenuSeparator />
              <MenuItem id="remove" tone="danger">
                Remove from team
              </MenuItem>
            </Menu>
          </MenuTrigger>
        ),
      },
    ],
    [],
  );

  return (
    <main className={styles.page} aria-labelledby={`${uid}-title`}>
      <div className={styles.header}>
        <div className={styles.titleBlock}>
          <h1 id={`${uid}-title`} className={styles.title}>
            Team members
          </h1>
          <p className={styles.description}>{members.length} people have access to this workspace.</p>
        </div>
        <InviteDialog onInvite={inviteMember} />
      </div>

      <Card>
        <CardContent variant="inset">
          <DataTable aria-labelledby={`${uid}-title`} columns={columns} rows={members} getRowId={(row) => row.id} stickyHeader={false} />
        </CardContent>
      </Card>

      <AlertDialog
        isOpen={pendingRemoval !== null}
        onOpenChange={(open) => {
          if (!open) setPendingRemoval(null);
        }}
        tone="danger"
        title={pendingRemoval ? `Remove ${pendingRemoval.name}?` : 'Remove member?'}
        actionLabel="Remove"
        onAction={() => {
          if (pendingRemoval) removeMember(pendingRemoval.id);
        }}
      >
        They will lose access to this workspace immediately. You can invite them again later.
      </AlertDialog>
    </main>
  );
}

function InviteDialog({ onInvite }: { onInvite: (email: string, role: Role) => void }) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<Role>('member');

  return (
    <DialogTrigger>
      <Button>
        <IconUserPlus aria-hidden />
        Invite
      </Button>
      <Dialog
        title="Invite a team member"
        description="They'll get an email with a link to join this workspace."
        footer={({ close }) => (
          <>
            <Button variant="outline" onPress={close}>
              Cancel
            </Button>
            <Button
              onPress={() => {
                if (!email) return;
                onInvite(email, role);
                setEmail('');
                setRole('member');
                close();
              }}
            >
              Send invite
            </Button>
          </>
        )}
      >
        <TextField label="Email" type="email" value={email} onChange={setEmail} isRequired autoFocus />
        <Select label="Role" selectedKey={role} onSelectionChange={(key) => key && setRole(key as Role)}>
          <SelectItem id="admin">Admin</SelectItem>
          <SelectItem id="member">Member</SelectItem>
        </Select>
      </Dialog>
    </DialogTrigger>
  );
}

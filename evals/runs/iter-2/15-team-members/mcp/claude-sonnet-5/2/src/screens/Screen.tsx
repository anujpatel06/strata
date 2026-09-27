'use client';

import { useMemo, useState } from 'react';
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
  MenuSeparator,
  MenuTrigger,
  Select,
  SelectItem,
  TextField,
  type DataTableColumn,
} from '@strata/react';
import { IconDotsVertical, IconMail, IconShieldCheck, IconTrash, IconUser, IconUserPlus } from '@strata/icons';
import styles from './Screen.module.css';

type Role = 'owner' | 'admin' | 'member';

type Member = {
  id: string;
  name: string;
  email: string;
  role: Role;
  lastActiveAt: Date | null;
};

const now = new Date('2026-09-28T09:00:00Z');

const initialMembers: Member[] = [
  { id: 'm1', name: 'Anuj Patel', email: 'patel.anuj1997@gmail.com', role: 'owner', lastActiveAt: new Date('2026-09-28T08:40:00Z') },
  { id: 'm2', name: 'Priya Raman', email: 'priya.raman@example.com', role: 'admin', lastActiveAt: new Date('2026-09-28T06:15:00Z') },
  { id: 'm3', name: 'Daniel Okafor', email: 'daniel.okafor@example.com', role: 'admin', lastActiveAt: new Date('2026-09-27T14:00:00Z') },
  { id: 'm4', name: 'Mei Lin', email: 'mei.lin@example.com', role: 'member', lastActiveAt: new Date('2026-09-25T10:00:00Z') },
  { id: 'm5', name: 'Omar Haddad', email: 'omar.haddad@example.com', role: 'member', lastActiveAt: new Date('2026-09-21T10:00:00Z') },
  { id: 'm6', name: 'Sofia Novak', email: 'sofia.novak@example.com', role: 'member', lastActiveAt: new Date('2026-09-07T10:00:00Z') },
  { id: 'm7', name: 'Ravi Shankar', email: 'ravi.shankar@example.com', role: 'member', lastActiveAt: new Date('2026-07-30T10:00:00Z') },
];

const roleLabels: Record<Role, string> = { owner: 'Owner', admin: 'Admin', member: 'Member' };
const roleTones: Record<Role, 'brand' | 'info' | 'neutral'> = { owner: 'brand', admin: 'info', member: 'neutral' };

const relativeTime = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

function formatLastActive(date: Date | null): string {
  if (!date) return 'Never — invited';
  const diffMinutes = Math.round((date.getTime() - now.getTime()) / 60000);
  const diffHours = Math.round(diffMinutes / 60);
  const diffDays = Math.round(diffHours / 24);
  if (Math.abs(diffMinutes) < 60) return relativeTime.format(diffMinutes, 'minute');
  if (Math.abs(diffHours) < 24) return relativeTime.format(diffHours, 'hour');
  if (Math.abs(diffDays) < 7) return relativeTime.format(diffDays, 'day');
  if (Math.abs(diffDays) < 30) return relativeTime.format(Math.round(diffDays / 7), 'week');
  return relativeTime.format(Math.round(diffDays / 30), 'month');
}

let nextMemberId = initialMembers.length + 1;

export default function Screen() {
  const [members, setMembers] = useState<Member[]>(initialMembers);
  const [removeTarget, setRemoveTarget] = useState<Member | null>(null);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'admin' | 'member'>('member');

  function handleRoleChange(id: string, role: Role) {
    setMembers((current) => current.map((member) => (member.id === id ? { ...member, role } : member)));
  }

  function handleRemove() {
    if (!removeTarget) return;
    setMembers((current) => current.filter((member) => member.id !== removeTarget.id));
    setRemoveTarget(null);
  }

  function handleInvite(close: () => void) {
    const email = inviteEmail.trim();
    if (!email) return;
    setMembers((current) => [
      ...current,
      {
        id: `m${nextMemberId++}`,
        name: email.split('@')[0],
        email,
        role: inviteRole,
        lastActiveAt: null,
      },
    ]);
    setInviteEmail('');
    setInviteRole('member');
    close();
  }

  const columns: DataTableColumn<Member>[] = useMemo(
    () => [
      {
        id: 'name',
        header: 'Name',
        isRowHeader: true,
        cell: (row) => (
          <div className={styles.person}>
            <Avatar name={row.name} size="sm" />
            <span>{row.name}</span>
          </div>
        ),
      },
      { id: 'email', header: 'Email', cell: (row) => row.email },
      {
        id: 'role',
        header: 'Role',
        cell: (row) => (
          <Badge variant="status" tone={roleTones[row.role]}>
            {roleLabels[row.role]}
          </Badge>
        ),
      },
      { id: 'lastActive', header: 'Last active', cell: (row) => formatLastActive(row.lastActiveAt) },
      {
        id: 'actions',
        header: 'Actions',
        align: 'end',
        cell: (row) =>
          row.role === 'owner' ? null : (
            <MenuTrigger>
              <Button variant="ghost" size="icon" aria-label={`Actions for ${row.name}`}>
                <IconDotsVertical aria-hidden />
              </Button>
              <Menu
                onAction={(key) => {
                  if (key === 'make-admin') handleRoleChange(row.id, 'admin');
                  else if (key === 'make-member') handleRoleChange(row.id, 'member');
                  else if (key === 'remove') setRemoveTarget(row);
                }}
              >
                {row.role === 'member' ? (
                  <MenuItem id="make-admin" icon={<IconShieldCheck aria-hidden />}>
                    Make admin
                  </MenuItem>
                ) : (
                  <MenuItem id="make-member" icon={<IconUser aria-hidden />}>
                    Make member
                  </MenuItem>
                )}
                <MenuSeparator />
                <MenuItem id="remove" tone="danger" icon={<IconTrash aria-hidden />}>
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
    <div className={styles.screen}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Team members</h1>
          <p className={styles.subtitle}>{members.length} people have access to this workspace.</p>
        </div>
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
                <Button onPress={() => handleInvite(close)} isDisabled={!inviteEmail.trim()}>
                  Send invite
                </Button>
              </>
            )}
          >
            <TextField
              label="Email"
              type="email"
              placeholder="name@company.com"
              value={inviteEmail}
              onChange={setInviteEmail}
              prefix={<IconMail aria-hidden />}
              autoFocus
              isRequired
            />
            <Select
              label="Role"
              selectedKey={inviteRole}
              onSelectionChange={(key) => {
                if (key === 'admin' || key === 'member') setInviteRole(key);
              }}
            >
              <SelectItem id="admin">Admin</SelectItem>
              <SelectItem id="member">Member</SelectItem>
            </Select>
          </Dialog>
        </DialogTrigger>
      </header>

      <DataTable aria-label="Team members" columns={columns} rows={members} getRowId={(row) => row.id} />

      <AlertDialog
        isOpen={removeTarget !== null}
        onOpenChange={(isOpen) => {
          if (!isOpen) setRemoveTarget(null);
        }}
        title={removeTarget ? `Remove ${removeTarget.name}?` : 'Remove member?'}
        actionLabel="Remove from team"
        tone="danger"
        onAction={handleRemove}
      >
        {removeTarget ? `${removeTarget.name} will lose access to this workspace immediately.` : ''}
      </AlertDialog>
    </div>
  );
}

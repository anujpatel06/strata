'use client';

import { useId, useMemo, useState, type JSX } from 'react';
import {
  Avatar,
  Badge,
  Button,
  Card,
  CardContent,
  DataTable,
  Dialog,
  DialogTrigger,
  AlertDialog,
  Menu,
  MenuItem,
  MenuSeparator,
  MenuTrigger,
  Select,
  SelectItem,
  TextField,
  ToastRegion,
  toast,
  type DataTableColumn,
  type Key,
} from '@strata/react';
import { IconDotsVertical, IconUserPlus } from '@strata/icons';
import styles from './Screen.module.css';

type Role = 'owner' | 'admin' | 'member';

interface Member {
  id: string;
  name: string;
  email: string;
  role: Role;
  lastActive: string;
}

const roleLabels: Record<Role, string> = {
  owner: 'Owner',
  admin: 'Admin',
  member: 'Member',
};

const roleTones: Record<Role, 'brand' | 'info' | 'neutral'> = {
  owner: 'brand',
  admin: 'info',
  member: 'neutral',
};

const initialMembers: Member[] = [
  { id: 'm-1', name: 'Priya Raman', email: 'priya.raman@example.com', role: 'owner', lastActive: '2 hours ago' },
  { id: 'm-2', name: 'Daniel Okafor', email: 'daniel.okafor@example.com', role: 'admin', lastActive: 'Yesterday' },
  { id: 'm-3', name: 'Mei Lin', email: 'mei.lin@example.com', role: 'admin', lastActive: '3 days ago' },
  { id: 'm-4', name: 'Omar Haddad', email: 'omar.haddad@example.com', role: 'member', lastActive: '5 days ago' },
  { id: 'm-5', name: 'Sofia Alvarez', email: 'sofia.alvarez@example.com', role: 'member', lastActive: '1 week ago' },
  { id: 'm-6', name: 'Arjun Mehta', email: 'arjun.mehta@example.com', role: 'member', lastActive: '2 weeks ago' },
  { id: 'm-7', name: 'Hannah Fischer', email: 'hannah.fischer@example.com', role: 'member', lastActive: '1 month ago' },
];

// The signed-in viewer: only an admin or owner sees the role menu and remove action.
const currentUserId = 'm-1';

const roleOrder: Role[] = ['owner', 'admin', 'member'];

export default function Screen(): JSX.Element {
  const uid = useId();
  const [members, setMembers] = useState<Member[]>(initialMembers);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<Key | null>('member');
  const [inviteOpen, setInviteOpen] = useState(false);
  const [pendingRemoval, setPendingRemoval] = useState<Member | null>(null);

  const currentUser = members.find((m) => m.id === currentUserId);
  const isAdmin = currentUser?.role === 'owner' || currentUser?.role === 'admin';

  const changeRole = (id: string, role: Role) => {
    const member = members.find((m) => m.id === id);
    setMembers((prev) => prev.map((m) => (m.id === id ? { ...m, role } : m)));
    if (member) toast({ title: `${member.name} is now ${roleLabels[role].toLowerCase()}`, tone: 'success' });
  };

  const removeMember = (member: Member) => {
    setMembers((prev) => prev.filter((m) => m.id !== member.id));
    toast({ title: `${member.name} was removed from the team`, tone: 'success' });
  };

  const sendInvite = () => {
    if (!inviteEmail.trim() || !inviteRole) return;
    toast({ title: `Invite sent to ${inviteEmail.trim()}`, tone: 'success' });
    setInviteEmail('');
    setInviteRole('member');
    setInviteOpen(false);
  };

  const columns = useMemo<DataTableColumn<Member>[]>(() => {
    const cols: DataTableColumn<Member>[] = [
      {
        id: 'name',
        header: 'Name',
        isRowHeader: true,
        cell: (row) => (
          <span className={styles.person}>
            <Avatar name={row.name} alt="" size="sm" />
            <span className={styles.personText}>
              <span className={styles.personName}>{row.name}</span>
              <span className={styles.personEmail}>{row.email}</span>
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
        cell: (row) => <span className={styles.quiet}>{row.lastActive}</span>,
      },
    ];

    if (isAdmin) {
      cols.push({
        id: 'actions',
        header: 'Actions',
        align: 'end',
        cell: (row) => (
          <MenuTrigger>
            <Button variant="ghost" size="icon" aria-label={`Actions for ${row.name}`}>
              <IconDotsVertical aria-hidden />
            </Button>
            <Menu
              placement="bottom end"
              disabledKeys={row.id === currentUserId ? ['remove'] : []}
              onAction={(key) => {
                if (key === 'remove') {
                  setPendingRemoval(row);
                  return;
                }
                if (roleOrder.includes(key as Role)) changeRole(row.id, key as Role);
              }}
            >
              <MenuItem id="owner" isDisabled={row.role === 'owner'}>
                Make owner
              </MenuItem>
              <MenuItem id="admin" isDisabled={row.role === 'admin'}>
                Make admin
              </MenuItem>
              <MenuItem id="member" isDisabled={row.role === 'member'}>
                Make member
              </MenuItem>
              <MenuSeparator />
              <MenuItem id="remove" tone="danger">
                Remove from team
              </MenuItem>
            </Menu>
          </MenuTrigger>
        ),
      });
    }

    return cols;
  }, [isAdmin]);

  return (
    <div className={styles.root}>
      <main className={styles.page} aria-labelledby={`${uid}-title`}>
        <div className={styles.header}>
          <div className={styles.titleBlock}>
            <h1 id={`${uid}-title`} className={styles.title}>
              Team members
            </h1>
            <p className={styles.description}>
              {members.length} {members.length === 1 ? 'person has' : 'people have'} access to this workspace.
            </p>
          </div>
          <DialogTrigger isOpen={inviteOpen} onOpenChange={setInviteOpen}>
            <Button>
              <IconUserPlus aria-hidden />
              Invite
            </Button>
            <Dialog
              title="Invite a team member"
              description="They'll get an email with a link to join."
              footer={({ close }) => (
                <>
                  <Button
                    variant="outline"
                    onPress={() => {
                      setInviteEmail('');
                      setInviteRole('member');
                      close();
                    }}
                  >
                    Cancel
                  </Button>
                  <Button onPress={sendInvite} isDisabled={!inviteEmail.trim()}>
                    Send invite
                  </Button>
                </>
              )}
            >
              <TextField
                label="Email"
                type="email"
                placeholder="name@example.com"
                value={inviteEmail}
                onChange={setInviteEmail}
                isRequired
              />
              <Select label="Role" selectedKey={inviteRole} onSelectionChange={setInviteRole}>
                <SelectItem id="admin">Admin</SelectItem>
                <SelectItem id="member">Member</SelectItem>
              </Select>
            </Dialog>
          </DialogTrigger>
        </div>

        <Card className={styles.card}>
          <CardContent variant="inset" className={styles.tableWell}>
            <DataTable
              aria-labelledby={`${uid}-title`}
              columns={columns}
              rows={members}
              getRowId={(row) => row.id}
              stickyHeader={false}
              className={styles.table}
            />
          </CardContent>
        </Card>
      </main>

      {pendingRemoval && (
        <AlertDialog
          isOpen
          onOpenChange={(open) => {
            if (!open) setPendingRemoval(null);
          }}
          title={`Remove ${pendingRemoval.name}?`}
          actionLabel="Remove"
          tone="danger"
          onAction={() => {
            removeMember(pendingRemoval);
            setPendingRemoval(null);
          }}
        >
          They'll lose access to this workspace immediately. This can't be undone.
        </AlertDialog>
      )}

      <ToastRegion />
    </div>
  );
}

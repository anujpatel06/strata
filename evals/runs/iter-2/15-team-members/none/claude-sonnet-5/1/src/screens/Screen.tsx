import { useState } from 'react';
import {
  Avatar,
  Badge,
  type BadgeTone,
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardAction,
  CardContent,
  DataTable,
  type DataTableColumn,
  Menu,
  MenuItem,
  MenuSection,
  MenuSeparator,
  MenuTrigger,
  Dialog,
  DialogTrigger,
  AlertDialog,
  TextField,
  Select,
  SelectItem,
} from '@strata/react';
import { IconUserPlus, IconDotsVertical, IconCheck, IconTrash } from '@strata/icons';
import styles from './Screen.module.css';

type Role = 'owner' | 'admin' | 'member';

interface Member {
  id: string;
  name: string;
  email: string;
  role: Role;
  /** null = invited but never signed in yet. */
  lastActiveAt: Date | null;
}

const CURRENT_USER_EMAIL = 'patel.anuj1997@gmail.com';

const ROLES: Role[] = ['owner', 'admin', 'member'];

const ROLE_LABEL: Record<Role, string> = {
  owner: 'Owner',
  admin: 'Admin',
  member: 'Member',
};

const ROLE_TONE: Record<Role, BadgeTone> = {
  owner: 'brand',
  admin: 'info',
  member: 'neutral',
};

const NOW = Date.now();
const hoursAgo = (n: number) => new Date(NOW - n * 60 * 60 * 1000);
const daysAgo = (n: number) => new Date(NOW - n * 24 * 60 * 60 * 1000);

const INITIAL_MEMBERS: Member[] = [
  { id: '1', name: 'Anuj Patel', email: CURRENT_USER_EMAIL, role: 'owner', lastActiveAt: hoursAgo(0) },
  { id: '2', name: 'Priya Raman', email: 'priya.raman@northwind.dev', role: 'admin', lastActiveAt: hoursAgo(2) },
  { id: '3', name: 'Arjun Mehta', email: 'arjun.mehta@northwind.dev', role: 'admin', lastActiveAt: hoursAgo(26) },
  { id: '4', name: 'Sara Ahmed', email: 'sara.ahmed@northwind.dev', role: 'member', lastActiveAt: daysAgo(3) },
  { id: '5', name: 'Daniel Kim', email: 'daniel.kim@northwind.dev', role: 'member', lastActiveAt: daysAgo(8) },
  { id: '6', name: 'Lucia Fernandez', email: 'lucia.fernandez@northwind.dev', role: 'member', lastActiveAt: daysAgo(21) },
  { id: '7', name: 'Omar Farouk', email: 'omar.farouk@northwind.dev', role: 'member', lastActiveAt: daysAgo(63) },
];

function formatLastActive(date: Date | null): string {
  if (!date) return 'Never';
  const diffMs = Date.now() - date.getTime();
  const minute = 60_000;
  const hour = 60 * minute;
  const day = 24 * hour;
  const week = 7 * day;
  const month = 30 * day;
  if (diffMs < minute) return 'Just now';
  if (diffMs < hour) return `${Math.max(1, Math.floor(diffMs / minute))}m ago`;
  if (diffMs < day) return `${Math.floor(diffMs / hour)}h ago`;
  if (diffMs < 2 * day) return 'Yesterday';
  if (diffMs < week) return `${Math.floor(diffMs / day)}d ago`;
  if (diffMs < month) return `${Math.floor(diffMs / week)}w ago`;
  return `${Math.floor(diffMs / month)}mo ago`;
}

function createId(): string {
  return `m-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function nameFromEmail(email: string): string {
  const local = email.split('@')[0] ?? email;
  const name = local
    .split(/[._-]+/)
    .filter(Boolean)
    .map((part) => part[0]!.toUpperCase() + part.slice(1))
    .join(' ');
  return name || email;
}

function InviteMemberDialog({ onInvite }: { onInvite: (email: string, role: 'admin' | 'member') => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'admin' | 'member'>('member');
  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  function handleOpenChange(open: boolean) {
    setIsOpen(open);
    if (!open) {
      setEmail('');
      setRole('member');
    }
  }

  return (
    <DialogTrigger isOpen={isOpen} onOpenChange={handleOpenChange}>
      <Button variant="primary">
        <IconUserPlus />
        Invite
      </Button>
      <Dialog
        title="Invite a team member"
        description="They'll get an email with a link to join this workspace."
        size="sm"
        footer={({ close }) => (
          <>
            <Button variant="outline" onPress={close}>
              Cancel
            </Button>
            <Button
              variant="primary"
              isDisabled={!isValidEmail}
              onPress={() => {
                onInvite(email, role);
                close();
              }}
            >
              Send invite
            </Button>
          </>
        )}
      >
        <div className={styles.inviteForm}>
          <TextField
            label="Email address"
            type="email"
            value={email}
            onChange={setEmail}
            placeholder="name@company.com"
            autoFocus
          />
          <Select
            label="Role"
            selectedKey={role}
            onSelectionChange={(key) => {
              if (key === 'admin' || key === 'member') setRole(key);
            }}
          >
            <SelectItem id="admin" description="Can manage members and settings">
              Admin
            </SelectItem>
            <SelectItem id="member" description="Can view and use the workspace">
              Member
            </SelectItem>
          </Select>
        </div>
      </Dialog>
    </DialogTrigger>
  );
}

export default function Screen() {
  const [members, setMembers] = useState<Member[]>(INITIAL_MEMBERS);
  const [pendingRemoval, setPendingRemoval] = useState<Member | null>(null);

  const ownerCount = members.filter((m) => m.role === 'owner').length;

  function changeRole(id: string, role: Role) {
    setMembers((prev) => prev.map((m) => (m.id === id ? { ...m, role } : m)));
  }

  function removeMember(id: string) {
    setMembers((prev) => prev.filter((m) => m.id !== id));
  }

  function inviteMember(email: string, role: 'admin' | 'member') {
    const trimmed = email.trim();
    if (!trimmed) return;
    setMembers((prev) => [
      ...prev,
      { id: createId(), name: nameFromEmail(trimmed), email: trimmed, role, lastActiveAt: null },
    ]);
  }

  const columns: DataTableColumn<Member>[] = [
    {
      id: 'name',
      header: 'Name',
      isRowHeader: true,
      minWidth: 200,
      cell: (row) => (
        <div className={styles.person}>
          <Avatar name={row.name} size="sm" />
          <span className={styles.personName}>
            {row.name}
            {row.email === CURRENT_USER_EMAIL && <span className={styles.youTag}>You</span>}
          </span>
        </div>
      ),
    },
    {
      id: 'email',
      header: 'Email',
      minWidth: 200,
      cell: (row) => <span className={styles.email}>{row.email}</span>,
    },
    {
      id: 'role',
      header: 'Role',
      width: 130,
      cell: (row) => (
        <Badge tone={ROLE_TONE[row.role]} variant="soft">
          {ROLE_LABEL[row.role]}
        </Badge>
      ),
    },
    {
      id: 'lastActive',
      header: 'Last active',
      width: 130,
      cell: (row) => <span className={styles.lastActive}>{formatLastActive(row.lastActiveAt)}</span>,
    },
    {
      id: 'actions',
      header: 'Actions',
      align: 'end',
      width: 90,
      cell: (row) => {
        const isOnlyOwner = row.role === 'owner' && ownerCount <= 1;
        return (
          <MenuTrigger>
            <Button size="icon" variant="ghost" aria-label={`Actions for ${row.name}`}>
              <IconDotsVertical />
            </Button>
            <Menu>
              <MenuSection title="Change role">
                {ROLES.map((role) => {
                  const isCurrent = row.role === role;
                  return (
                    <MenuItem
                      key={role}
                      icon={isCurrent ? <IconCheck /> : undefined}
                      isDisabled={isCurrent || (isOnlyOwner && role !== 'owner')}
                      onAction={() => changeRole(row.id, role)}
                    >
                      {ROLE_LABEL[role]}
                    </MenuItem>
                  );
                })}
              </MenuSection>
              <MenuSeparator />
              <MenuItem
                tone="danger"
                icon={<IconTrash />}
                isDisabled={isOnlyOwner}
                description={isOnlyOwner ? 'Assign another owner first' : undefined}
                onAction={() => setPendingRemoval(row)}
              >
                Remove from team
              </MenuItem>
            </Menu>
          </MenuTrigger>
        );
      },
    },
  ];

  return (
    <div className={styles.page}>
      <Card className={styles.card}>
        <CardHeader divider>
          <CardTitle level={1}>Team members</CardTitle>
          <CardDescription>
            {members.length} {members.length === 1 ? 'person has' : 'people have'} access to this workspace.
          </CardDescription>
          <CardAction>
            <InviteMemberDialog onInvite={inviteMember} />
          </CardAction>
        </CardHeader>
        <CardContent variant="inset">
          <DataTable aria-label="Team members" columns={columns} rows={members} getRowId={(row) => row.id} />
        </CardContent>
      </Card>

      <AlertDialog
        isOpen={pendingRemoval !== null}
        onOpenChange={(open) => {
          if (!open) setPendingRemoval(null);
        }}
        title={pendingRemoval ? `Remove ${pendingRemoval.name}?` : 'Remove member?'}
        tone="danger"
        actionLabel="Remove"
        onAction={() => {
          if (pendingRemoval) removeMember(pendingRemoval.id);
        }}
      >
        They'll lose access to this workspace immediately. This can't be undone.
      </AlertDialog>
    </div>
  );
}

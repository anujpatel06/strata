import { useState } from 'react';
import {
  AlertDialog,
  Avatar,
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  DataTable,
  type DataTableColumn,
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
  toast,
  ToastRegion,
} from '@strata/react';
import { IconCheck, IconDotsVertical, IconTrash, IconUserPlus } from '@strata/icons';
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
  { id: 'm1', name: 'Ananya Sharma', email: 'ananya.sharma@vela.com', role: 'owner', lastActive: 'Just now' },
  { id: 'm2', name: 'Rohan Mehta', email: 'rohan.mehta@vela.com', role: 'admin', lastActive: '2 hours ago' },
  { id: 'm3', name: 'Priya Nair', email: 'priya.nair@vela.com', role: 'admin', lastActive: 'Yesterday' },
  { id: 'm4', name: 'Kabir Singh', email: 'kabir.singh@vela.com', role: 'member', lastActive: '3 days ago' },
  { id: 'm5', name: 'Meera Iyer', email: 'meera.iyer@vela.com', role: 'member', lastActive: '1 week ago' },
  { id: 'm6', name: 'Arjun Verma', email: 'arjun.verma@vela.com', role: 'member', lastActive: '3 weeks ago' },
  { id: 'm7', name: 'Diya Kapoor', email: 'diya.kapoor@vela.com', role: 'member', lastActive: '2 months ago' },
];

const roleLabels: Record<Role, string> = { owner: 'Owner', admin: 'Admin', member: 'Member' };
const roleOptions: Role[] = ['owner', 'admin', 'member'];
const roleBadgeTone: Record<Role, 'brand' | 'info' | 'neutral'> = {
  owner: 'brand',
  admin: 'info',
  member: 'neutral',
};

function nameFromEmail(email: string): string {
  const local = email.split('@')[0] ?? email;
  return local
    .split(/[.\-_]+/)
    .filter(Boolean)
    .map((part) => part[0]!.toUpperCase() + part.slice(1))
    .join(' ');
}

export default function Screen() {
  const [members, setMembers] = useState<Member[]>(initialMembers);
  const [pendingRemoval, setPendingRemoval] = useState<Member | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<Role>('member');
  const [inviteError, setInviteError] = useState('');

  const ownerCount = members.filter((m) => m.role === 'owner').length;

  function changeRole(id: string, role: Role) {
    setMembers((prev) => prev.map((m) => (m.id === id ? { ...m, role } : m)));
    const member = members.find((m) => m.id === id);
    if (member) {
      toast({ title: `${member.name} is now ${roleLabels[role].toLowerCase()}`, tone: 'success' });
    }
  }

  function removeMember(member: Member) {
    setMembers((prev) => prev.filter((m) => m.id !== member.id));
    toast({ title: `${member.name} was removed`, tone: 'neutral' });
  }

  function resetInviteForm() {
    setInviteEmail('');
    setInviteRole('member');
    setInviteError('');
  }

  function sendInvite(close: () => void) {
    const email = inviteEmail.trim();
    if (!email || !email.includes('@') || !email.includes('.')) {
      setInviteError('Enter a valid email address.');
      return;
    }
    if (members.some((m) => m.email.toLowerCase() === email.toLowerCase())) {
      setInviteError('This person is already a team member.');
      return;
    }
    const newMember: Member = {
      id: `invite-${Date.now()}`,
      name: nameFromEmail(email),
      email,
      role: inviteRole,
      lastActive: 'Invited · not active yet',
    };
    setMembers((prev) => [...prev, newMember]);
    toast({ title: `Invitation sent to ${email}`, tone: 'success' });
    resetInviteForm();
    close();
  }

  const columns: DataTableColumn<Member>[] = [
    {
      id: 'member',
      header: 'Member',
      isRowHeader: true,
      textValue: 'Member',
      width: '38%',
      cell: (row) => (
        <div className={styles.memberCell}>
          <Avatar name={row.name} size="md" />
          <div className={styles.memberText}>
            <span className={styles.memberName}>{row.name}</span>
            <span className={styles.memberEmail}>{row.email}</span>
          </div>
        </div>
      ),
    },
    {
      id: 'role',
      header: 'Role',
      textValue: 'Role',
      width: '18%',
      cell: (row) => (
        <Badge tone={roleBadgeTone[row.role]} variant="soft">
          {roleLabels[row.role]}
        </Badge>
      ),
    },
    {
      id: 'lastActive',
      header: 'Last active',
      textValue: 'Last active',
      width: '24%',
      cell: (row) => <span className={styles.lastActive}>{row.lastActive}</span>,
    },
    {
      id: 'actions',
      header: <span className={styles.srOnly}>Actions</span>,
      textValue: 'Actions',
      align: 'end',
      width: '10%',
      cell: (row) => {
        const isLastOwner = row.role === 'owner' && ownerCount <= 1;
        return (
          <MenuTrigger>
            <Button size="icon" variant="ghost" aria-label={`Actions for ${row.name}`}>
              <IconDotsVertical />
            </Button>
            <Menu aria-label={`Actions for ${row.name}`}>
              <MenuSection title="Change role">
                {roleOptions.map((role) => (
                  <MenuItem
                    key={role}
                    id={`${row.id}-${role}`}
                    icon={row.role === role ? <IconCheck /> : undefined}
                    isDisabled={row.role === role || (isLastOwner && role !== 'owner')}
                    onAction={() => changeRole(row.id, role)}
                  >
                    {roleLabels[role]}
                  </MenuItem>
                ))}
              </MenuSection>
              <MenuSeparator />
              <MenuItem
                id={`${row.id}-remove`}
                tone="danger"
                icon={<IconTrash />}
                isDisabled={isLastOwner}
                onAction={() => setPendingRemoval(row)}
              >
                Remove member
              </MenuItem>
            </Menu>
          </MenuTrigger>
        );
      },
    },
  ];

  return (
    <div className={styles.page}>
      <ToastRegion placement="top-end" />

      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Team members</h1>
          <p className={styles.description}>Manage who has access to this workspace and what they can do.</p>
        </div>
        <DialogTrigger
          isOpen={inviteOpen}
          onOpenChange={(open) => {
            setInviteOpen(open);
            if (!open) resetInviteForm();
          }}
        >
          <Button variant="primary">
            <IconUserPlus />
            Invite
          </Button>
          <Dialog title="Invite a team member" description="They'll get an email invitation to join this workspace." size="sm">
            {({ close }) => (
              <form
                className={styles.inviteForm}
                onSubmit={(e) => {
                  e.preventDefault();
                  sendInvite(close);
                }}
              >
                <TextField
                  label="Email address"
                  type="email"
                  value={inviteEmail}
                  onChange={(value) => {
                    setInviteEmail(value);
                    if (inviteError) setInviteError('');
                  }}
                  placeholder="name@company.com"
                  isInvalid={Boolean(inviteError)}
                  errorMessage={inviteError}
                  autoFocus
                />
                <Select
                  label="Role"
                  selectedKey={inviteRole}
                  onSelectionChange={(key) => setInviteRole(key as Role)}
                >
                  {roleOptions.map((role) => (
                    <SelectItem key={role} id={role}>
                      {roleLabels[role]}
                    </SelectItem>
                  ))}
                </Select>
                <div className={styles.inviteFormActions}>
                  <Button variant="outline" type="button" onPress={close}>
                    Cancel
                  </Button>
                  <Button variant="primary" type="submit">
                    Send invite
                  </Button>
                </div>
              </form>
            )}
          </Dialog>
        </DialogTrigger>
      </header>

      <Card>
        <CardHeader divider>
          <CardTitle level={2}>{members.length} members</CardTitle>
        </CardHeader>
        <CardContent variant="inset">
          <DataTable
            aria-label="Team members"
            columns={columns}
            rows={members}
            getRowId={(row) => row.id}
          />
        </CardContent>
      </Card>

      <AlertDialog
        title={pendingRemoval ? `Remove ${pendingRemoval.name}?` : 'Remove member?'}
        actionLabel="Remove"
        cancelLabel="Cancel"
        tone="danger"
        isOpen={pendingRemoval !== null}
        onOpenChange={(open) => {
          if (!open) setPendingRemoval(null);
        }}
        onAction={() => {
          if (pendingRemoval) removeMember(pendingRemoval);
        }}
      >
        They'll lose access to this workspace immediately. This can't be undone.
      </AlertDialog>
    </div>
  );
}

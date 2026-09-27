import { useEffect, useId, useRef, useState } from 'react';
import styles from './Screen.module.css';

type Role = 'owner' | 'admin' | 'member';
type Status = 'active' | 'invited';

type Member = {
  id: string;
  name: string;
  email: string;
  role: Role;
  lastActiveAt: string;
  isYou?: boolean;
  status: Status;
};

const initialMembers: Member[] = [
  {
    id: 'm1',
    name: 'Anuj Patel',
    email: 'patel.anuj1997@gmail.com',
    role: 'owner',
    lastActiveAt: new Date().toISOString(),
    isYou: true,
    status: 'active',
  },
  {
    id: 'm2',
    name: 'Priya Sharma',
    email: 'priya.sharma@example.com',
    role: 'admin',
    lastActiveAt: hoursAgo(2),
    status: 'active',
  },
  {
    id: 'm3',
    name: 'Wei Chen',
    email: 'wei.chen@example.com',
    role: 'admin',
    lastActiveAt: hoursAgo(26),
    status: 'active',
  },
  {
    id: 'm4',
    name: 'Fatima Al-Sayed',
    email: 'fatima.alsayed@example.com',
    role: 'member',
    lastActiveAt: hoursAgo(24 * 3),
    status: 'active',
  },
  {
    id: 'm5',
    name: 'Diego Ramirez',
    email: 'diego.ramirez@example.com',
    role: 'member',
    lastActiveAt: hoursAgo(24 * 7),
    status: 'active',
  },
  {
    id: 'm6',
    name: 'Grace Okafor',
    email: 'grace.okafor@example.com',
    role: 'member',
    lastActiveAt: hoursAgo(24 * 21),
    status: 'active',
  },
  {
    id: 'm7',
    name: 'Sam Lindqvist',
    email: 'sam.lindqvist@example.com',
    role: 'member',
    lastActiveAt: hoursAgo(24 * 61),
    status: 'active',
  },
];

function hoursAgo(hours: number): string {
  return new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
}

const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' });

function formatLastActive(iso: string): string {
  const diffMs = new Date(iso).getTime() - Date.now();
  const minutes = Math.round(diffMs / (60 * 1000));
  if (Math.abs(minutes) < 1) return 'Just now';
  if (Math.abs(minutes) < 60) return rtf.format(minutes, 'minute');
  const hours = Math.round(minutes / 60);
  if (Math.abs(hours) < 24) return rtf.format(hours, 'hour');
  const days = Math.round(hours / 24);
  if (Math.abs(days) < 7) return rtf.format(days, 'day');
  const weeks = Math.round(days / 7);
  if (Math.abs(weeks) < 5) return rtf.format(weeks, 'week');
  const months = Math.round(days / 30);
  return rtf.format(months, 'month');
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? '';
  const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
  return (first + last).toUpperCase();
}

const roleLabels: Record<Role, string> = {
  owner: 'Owner',
  admin: 'Admin',
  member: 'Member',
};

const roleOrder: Role[] = ['owner', 'admin', 'member'];

function RoleMenu({
  member,
  onChangeRole,
  onRemove,
  onClose,
}: {
  member: Member;
  onChangeRole: (role: Role) => void;
  onRemove: () => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        onClose();
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose();
    }
    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  return (
    <div className={styles.menu} role="menu" aria-label={`Actions for ${member.name}`} ref={ref}>
      <div className={styles.menuSection} role="group" aria-label="Change role">
        {roleOrder.map((role) => (
          <button
            key={role}
            type="button"
            role="menuitemradio"
            aria-checked={member.role === role}
            className={styles.menuItem}
            disabled={member.role === role}
            onClick={() => {
              onChangeRole(role);
              onClose();
            }}
          >
            <span className={styles.menuItemCheck} aria-hidden="true">
              {member.role === role ? '✓' : ''}
            </span>
            {roleLabels[role]}
          </button>
        ))}
      </div>
      <div className={styles.menuDivider} role="separator" />
      <button
        type="button"
        role="menuitem"
        className={`${styles.menuItem} ${styles.menuItemDanger}`}
        onClick={() => {
          onRemove();
          onClose();
        }}
      >
        <span className={styles.menuItemCheck} aria-hidden="true" />
        Remove member
      </button>
    </div>
  );
}

function InviteDialog({
  onClose,
  onInvite,
}: {
  onClose: () => void;
  onInvite: (email: string, role: Role) => void;
}) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<Role>('member');
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!isValidEmail) return;
    onInvite(email.trim(), role);
    onClose();
  }

  return (
    <div
      className={styles.overlay}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        ref={dialogRef}
      >
        <h2 className={styles.dialogTitle} id={titleId}>
          Invite a team member
        </h2>
        <form onSubmit={handleSubmit}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="invite-email">
              Email address
            </label>
            <input
              id="invite-email"
              type="email"
              className={styles.input}
              placeholder="name@company.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoFocus
              required
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="invite-role">
              Role
            </label>
            <select
              id="invite-role"
              className={styles.select}
              value={role}
              onChange={(event) => setRole(event.target.value as Role)}
            >
              <option value="admin">Admin</option>
              <option value="member">Member</option>
            </select>
          </div>
          <div className={styles.dialogActions}>
            <button type="button" className={styles.btnSecondary} onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className={styles.btnPrimary} disabled={!isValidEmail}>
              Send invite
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Screen() {
  const [members, setMembers] = useState<Member[]>(initialMembers);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);

  function changeRole(id: string, role: Role) {
    setMembers((prev) => prev.map((m) => (m.id === id ? { ...m, role } : m)));
  }

  function removeMember(id: string) {
    setMembers((prev) => prev.filter((m) => m.id !== id));
  }

  function inviteMember(email: string, role: Role) {
    setMembers((prev) => [
      ...prev,
      {
        id: `invite-${Date.now()}`,
        name: email,
        email,
        role,
        lastActiveAt: new Date().toISOString(),
        status: 'invited',
      },
    ]);
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Team members</h1>
          <p className={styles.subtitle}>
            {members.length} {members.length === 1 ? 'person has' : 'people have'} access to this
            workspace.
          </p>
        </div>
        <button type="button" className={styles.btnPrimary} onClick={() => setInviteOpen(true)}>
          Invite
        </button>
      </div>

      <div className={styles.card}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.th}>Name</th>
              <th className={styles.th}>Role</th>
              <th className={styles.th}>Last active</th>
              <th className={`${styles.th} ${styles.thActions}`}>
                <span className={styles.visuallyHidden}>Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {members.map((member) => (
              <tr key={member.id} className={styles.tr}>
                <td className={styles.td}>
                  <div className={styles.memberCell}>
                    <span className={styles.avatar} aria-hidden="true">
                      {initials(member.name)}
                    </span>
                    <div className={styles.memberInfo}>
                      <span className={styles.name}>
                        {member.name}
                        {member.isYou ? <span className={styles.youTag}> (you)</span> : null}
                      </span>
                      <span className={styles.email}>{member.email}</span>
                    </div>
                  </div>
                </td>
                <td className={styles.td}>
                  <span className={`${styles.roleBadge} ${styles[`role-${member.role}`]}`}>
                    {roleLabels[member.role]}
                  </span>
                </td>
                <td className={styles.td}>
                  <span className={styles.lastActive}>
                    {member.status === 'invited' ? 'Invitation sent' : formatLastActive(member.lastActiveAt)}
                  </span>
                </td>
                <td className={`${styles.td} ${styles.actionsCell}`}>
                  <button
                    type="button"
                    className={styles.kebabButton}
                    aria-haspopup="menu"
                    aria-expanded={openMenuId === member.id}
                    aria-label={`Actions for ${member.name}`}
                    disabled={member.isYou}
                    title={member.isYou ? "You can't change your own role" : 'Row actions'}
                    onClick={() => setOpenMenuId((current) => (current === member.id ? null : member.id))}
                  >
                    ⋮
                  </button>
                  {openMenuId === member.id ? (
                    <RoleMenu
                      member={member}
                      onChangeRole={(role) => changeRole(member.id, role)}
                      onRemove={() => removeMember(member.id)}
                      onClose={() => setOpenMenuId(null)}
                    />
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {inviteOpen ? (
        <InviteDialog onClose={() => setInviteOpen(false)} onInvite={inviteMember} />
      ) : null}
    </div>
  );
}

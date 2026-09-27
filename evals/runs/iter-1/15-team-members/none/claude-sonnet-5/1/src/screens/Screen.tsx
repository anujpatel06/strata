import { useEffect, useRef, useState } from 'react';
import styles from './Screen.module.css';

type Role = 'owner' | 'admin' | 'member';

interface Member {
  id: string;
  name: string;
  email: string;
  role: Role;
  lastActive: string;
}

const ROLES: Role[] = ['owner', 'admin', 'member'];

const ROLE_LABELS: Record<Role, string> = {
  owner: 'Owner',
  admin: 'Admin',
  member: 'Member',
};

const CURRENT_USER_EMAIL = 'patel.anuj1997@gmail.com';

const INITIAL_MEMBERS: Member[] = [
  {
    id: 'm1',
    name: 'Anuj Patel',
    email: CURRENT_USER_EMAIL,
    role: 'owner',
    lastActive: 'Just now',
  },
  {
    id: 'm2',
    name: 'Priya Sharma',
    email: 'priya.sharma@company.com',
    role: 'admin',
    lastActive: '2 hours ago',
  },
  {
    id: 'm3',
    name: 'Daniel Osei',
    email: 'daniel.osei@company.com',
    role: 'admin',
    lastActive: 'Yesterday',
  },
  {
    id: 'm4',
    name: 'Mei Lin',
    email: 'mei.lin@company.com',
    role: 'member',
    lastActive: '3 days ago',
  },
  {
    id: 'm5',
    name: 'Carlos Ibarra',
    email: 'carlos.ibarra@company.com',
    role: 'member',
    lastActive: '1 week ago',
  },
  {
    id: 'm6',
    name: 'Fatima Noor',
    email: 'fatima.noor@company.com',
    role: 'member',
    lastActive: '2 weeks ago',
  },
  {
    id: 'm7',
    name: 'Owen Walsh',
    email: 'owen.walsh@company.com',
    role: 'member',
    lastActive: '1 month ago',
  },
];

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? '';
  const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
  return (first + last).toUpperCase();
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Screen() {
  const [members, setMembers] = useState<Member[]>(INITIAL_MEMBERS);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<Role>('member');
  const [inviteError, setInviteError] = useState<string | null>(null);

  const menuRef = useRef<HTMLDivElement | null>(null);
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const nextId = useRef(members.length + 1);

  useEffect(() => {
    if (!openMenuId) return;
    function handlePointerDown(event: PointerEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenuId(null);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpenMenuId(null);
    }
    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [openMenuId]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (inviteOpen && !dialog.open) {
      dialog.showModal();
    } else if (!inviteOpen && dialog.open) {
      dialog.close();
    }
  }, [inviteOpen]);

  function openInvite() {
    setInviteEmail('');
    setInviteRole('member');
    setInviteError(null);
    setInviteOpen(true);
  }

  function closeInvite() {
    setInviteOpen(false);
  }

  function handleInviteSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = inviteEmail.trim();
    if (!EMAIL_PATTERN.test(trimmed)) {
      setInviteError('Enter a valid email address.');
      return;
    }
    if (members.some((m) => m.email.toLowerCase() === trimmed.toLowerCase())) {
      setInviteError('This person is already a team member.');
      return;
    }
    const id = `m${nextId.current++}`;
    setMembers((prev) => [
      ...prev,
      {
        id,
        name: trimmed,
        email: trimmed,
        role: inviteRole,
        lastActive: 'Invited, not yet joined',
      },
    ]);
    setInviteOpen(false);
  }

  function changeRole(id: string, role: Role) {
    setMembers((prev) => prev.map((m) => (m.id === id ? { ...m, role } : m)));
    setOpenMenuId(null);
  }

  function removeMember(id: string) {
    setMembers((prev) => prev.filter((m) => m.id !== id));
    setOpenMenuId(null);
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Team members</h1>
          <p className={styles.subtitle}>
            {members.length} {members.length === 1 ? 'person has' : 'people have'} access to this
            workspace.
          </p>
        </div>
        <button type="button" className={styles.inviteButton} onClick={openInvite}>
          Invite
        </button>
      </header>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th scope="col">Name</th>
              <th scope="col">Role</th>
              <th scope="col">Last active</th>
              <th scope="col" className={styles.actionsHeader}>
                <span className={styles.srOnly}>Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {members.map((member) => {
              const isYou = member.email.toLowerCase() === CURRENT_USER_EMAIL.toLowerCase();
              return (
                <tr key={member.id}>
                  <td>
                    <div className={styles.person}>
                      <span className={styles.avatar} aria-hidden="true">
                        {getInitials(member.name)}
                      </span>
                      <div className={styles.personInfo}>
                        <div className={styles.name}>
                          {member.name}
                          {isYou && <span className={styles.youTag}>You</span>}
                        </div>
                        <div className={styles.email}>{member.email}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={styles.roleBadge} data-role={member.role}>
                      {ROLE_LABELS[member.role]}
                    </span>
                  </td>
                  <td className={styles.lastActive}>{member.lastActive}</td>
                  <td className={styles.actionsCell}>
                    <div className={styles.menuWrap} ref={openMenuId === member.id ? menuRef : undefined}>
                      <button
                        type="button"
                        className={styles.menuButton}
                        aria-haspopup="menu"
                        aria-expanded={openMenuId === member.id}
                        aria-label={`Actions for ${member.name}`}
                        onClick={() => setOpenMenuId((prev) => (prev === member.id ? null : member.id))}
                      >
                        <span aria-hidden="true">&#8942;</span>
                      </button>
                      {openMenuId === member.id && (
                        <div role="menu" className={styles.menu} aria-label={`Actions for ${member.name}`}>
                          <div className={styles.menuLabel}>Change role</div>
                          {ROLES.map((role) => (
                            <button
                              key={role}
                              type="button"
                              role="menuitemradio"
                              aria-checked={member.role === role}
                              className={styles.menuItem}
                              onClick={() => changeRole(member.id, role)}
                            >
                              <span>{ROLE_LABELS[role]}</span>
                              {member.role === role && (
                                <span aria-hidden="true" className={styles.menuCheck}>
                                  &#10003;
                                </span>
                              )}
                            </button>
                          ))}
                          <div className={styles.menuDivider} role="separator" />
                          <button
                            type="button"
                            role="menuitem"
                            className={`${styles.menuItem} ${styles.menuItemDanger}`}
                            onClick={() => removeMember(member.id)}
                          >
                            Remove from team
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <dialog
        ref={dialogRef}
        className={styles.dialog}
        onClose={() => setInviteOpen(false)}
        onCancel={() => setInviteOpen(false)}
        onClick={(event) => {
          if (event.target === dialogRef.current) closeInvite();
        }}
      >
        <form className={styles.dialogForm} onSubmit={handleInviteSubmit}>
          <h2 className={styles.dialogTitle}>Invite a team member</h2>
          <p className={styles.dialogSubtitle}>They'll get an email invite to join this workspace.</p>

          <label className={styles.field}>
            <span className={styles.fieldLabel}>Email address</span>
            <input
              type="email"
              className={styles.input}
              placeholder="name@company.com"
              value={inviteEmail}
              autoFocus
              onChange={(event) => {
                setInviteEmail(event.target.value);
                setInviteError(null);
              }}
            />
          </label>

          <label className={styles.field}>
            <span className={styles.fieldLabel}>Role</span>
            <select
              className={styles.select}
              value={inviteRole}
              onChange={(event) => setInviteRole(event.target.value as Role)}
            >
              {ROLES.map((role) => (
                <option key={role} value={role}>
                  {ROLE_LABELS[role]}
                </option>
              ))}
            </select>
          </label>

          {inviteError && <p className={styles.errorText}>{inviteError}</p>}

          <div className={styles.dialogActions}>
            <button type="button" className={styles.secondaryButton} onClick={closeInvite}>
              Cancel
            </button>
            <button type="submit" className={styles.inviteButton}>
              Send invite
            </button>
          </div>
        </form>
      </dialog>
    </div>
  );
}

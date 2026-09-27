import { useMemo, useState } from 'react';
import styles from './Screen.module.css';

type NotificationType = 'payment' | 'security' | 'policy' | 'reminder';
type Group = 'today' | 'earlier';

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  detail: string;
  time: string;
  group: Group;
  read: boolean;
}

const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: 'n1',
    type: 'payment',
    title: 'Payment received',
    detail: 'You received $1,240.00 from Meridian Logistics',
    time: '9:41 AM',
    group: 'today',
    read: false,
  },
  {
    id: 'n2',
    type: 'security',
    title: 'New sign-in detected',
    detail: 'A new device signed in to your account from Austin, TX',
    time: '8:15 AM',
    group: 'today',
    read: false,
  },
  {
    id: 'n3',
    type: 'reminder',
    title: 'Invoice due tomorrow',
    detail: 'Invoice #4021 for $860.00 is due tomorrow',
    time: '7:02 AM',
    group: 'today',
    read: true,
  },
  {
    id: 'n4',
    type: 'policy',
    title: 'Terms of service updated',
    detail: "We've updated our terms of service, effective October 1",
    time: '6:30 AM',
    group: 'today',
    read: false,
  },
  {
    id: 'n5',
    type: 'payment',
    title: 'Payment failed',
    detail: 'Your card ending in 4482 could not be charged',
    time: 'Yesterday, 4:52 PM',
    group: 'earlier',
    read: false,
  },
  {
    id: 'n6',
    type: 'security',
    title: 'Password changed',
    detail: 'Your account password was changed successfully',
    time: 'Yesterday, 1:10 PM',
    group: 'earlier',
    read: true,
  },
  {
    id: 'n7',
    type: 'reminder',
    title: 'Subscription renews soon',
    detail: 'Your Pro plan renews in 3 days for $29.00',
    time: 'Sep 24',
    group: 'earlier',
    read: true,
  },
  {
    id: 'n8',
    type: 'policy',
    title: 'Privacy policy reminder',
    detail: 'Review how we handle your data before October 15',
    time: 'Sep 22',
    group: 'earlier',
    read: true,
  },
];

const TYPE_META: Record<NotificationType, { label: string; icon: () => JSX.Element }> = {
  payment: { label: 'Payment', icon: PaymentIcon },
  security: { label: 'Security', icon: SecurityIcon },
  policy: { label: 'Policy', icon: PolicyIcon },
  reminder: { label: 'Reminder', icon: ReminderIcon },
};

const FILTERS: Array<{ value: 'all' | NotificationType; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'payment', label: 'Payment' },
  { value: 'security', label: 'Security' },
  { value: 'policy', label: 'Policy' },
  { value: 'reminder', label: 'Reminder' },
];

export default function Screen() {
  const [notifications, setNotifications] = useState<Notification[]>(MOCK_NOTIFICATIONS);
  const [filter, setFilter] = useState<'all' | NotificationType>('all');

  const unreadCount = useMemo(() => notifications.filter((n) => !n.read).length, [notifications]);

  const filtered = useMemo(
    () => (filter === 'all' ? notifications : notifications.filter((n) => n.type === filter)),
    [notifications, filter],
  );

  const todayItems = filtered.filter((n) => n.group === 'today');
  const earlierItems = filtered.filter((n) => n.group === 'earlier');

  function markAsRead(id: string) {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  }

  function markAllAsRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  return (
    <div className={styles.screen}>
      <header className={styles.header}>
        <div className={styles.headingGroup}>
          <h1 className={styles.heading}>Notifications</h1>
          <p className={styles.subheading}>
            {unreadCount === 0 ? 'All caught up' : `${unreadCount} unread notification${unreadCount === 1 ? '' : 's'}`}
          </p>
        </div>
        <button
          type="button"
          className={styles.markAllButton}
          onClick={markAllAsRead}
          disabled={unreadCount === 0}
        >
          Mark all as read
        </button>
      </header>

      <div className={styles.filters} role="group" aria-label="Filter by type">
        {FILTERS.map((f) => {
          const count = f.value === 'all' ? notifications.length : notifications.filter((n) => n.type === f.value).length;
          const active = filter === f.value;
          return (
            <button
              key={f.value}
              type="button"
              aria-pressed={active}
              className={active ? `${styles.filterButton} ${styles.filterButtonActive}` : styles.filterButton}
              onClick={() => setFilter(f.value)}
            >
              {f.label}
              <span className={styles.filterCount}>{count}</span>
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <p className={styles.empty}>No notifications for this filter.</p>
      ) : (
        <>
          {todayItems.length > 0 && (
            <NotificationSection title="Today" items={todayItems} onMarkAsRead={markAsRead} />
          )}
          {earlierItems.length > 0 && (
            <NotificationSection title="Earlier" items={earlierItems} onMarkAsRead={markAsRead} />
          )}
        </>
      )}
    </div>
  );
}

function NotificationSection({
  title,
  items,
  onMarkAsRead,
}: {
  title: string;
  items: Notification[];
  onMarkAsRead: (id: string) => void;
}) {
  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>{title}</h2>
      <ul className={styles.list}>
        {items.map((n) => {
          const meta = TYPE_META[n.type];
          const Icon = meta.icon;
          return (
            <li
              key={n.id}
              className={n.read ? styles.row : `${styles.row} ${styles.rowUnread}`}
            >
              <span className={`${styles.iconWrap} ${styles[`icon${capitalize(n.type)}`]}`}>
                <Icon />
              </span>
              <div className={styles.content}>
                <div className={styles.titleRow}>
                  <p className={styles.title}>{n.title}</p>
                  {!n.read && <span className={styles.unreadDot} aria-label="Unread" />}
                </div>
                <p className={styles.detail}>{n.detail}</p>
              </div>
              <div className={styles.meta}>
                <span className={styles.time}>{n.time}</span>
                {!n.read && (
                  <button type="button" className={styles.markReadButton} onClick={() => onMarkAsRead(n.id)}>
                    Mark as read
                  </button>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function PaymentIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="2.5" y="5.5" width="19" height="13" rx="2.5" stroke="currentColor" strokeWidth="1.7" />
      <path d="M2.5 9.5H21.5" stroke="currentColor" strokeWidth="1.7" />
      <path d="M6 14.5H10" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

function SecurityIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 2.5L20 6V11C20 16 16.5 19.7 12 21.5C7.5 19.7 4 16 4 11V6L12 2.5Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path d="M9 12L11.2 14.2L15.5 9.8" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PolicyIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M6 2.5H15L19 6.5V21.5H6V2.5Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      <path d="M15 2.5V6.5H19" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      <path d="M9 12H15" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M9 16H15" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

function ReminderIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="13" r="8.5" stroke="currentColor" strokeWidth="1.7" />
      <path d="M12 8.5V13L15 15.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9.5 2.5H14.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

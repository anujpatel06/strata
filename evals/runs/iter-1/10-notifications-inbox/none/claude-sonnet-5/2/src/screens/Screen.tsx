import { useMemo, useState } from 'react';
import styles from './Screen.module.css';

type NotificationType = 'payment' | 'security' | 'policy' | 'reminder';

interface NotificationItem {
  id: string;
  type: NotificationType;
  title: string;
  detail: string;
  time: string;
  read: boolean;
  group: 'today' | 'earlier';
}

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'n1',
    type: 'payment',
    title: 'Payment received',
    detail: 'You received $1,240.00 from Meridian Retail Co.',
    time: '9:42 AM',
    read: false,
    group: 'today',
  },
  {
    id: 'n2',
    type: 'security',
    title: 'New sign-in detected',
    detail: 'A new device signed in to your account from Austin, TX.',
    time: '8:15 AM',
    read: false,
    group: 'today',
  },
  {
    id: 'n3',
    type: 'reminder',
    title: 'Invoice due tomorrow',
    detail: 'Invoice #4471 for $860.00 is due tomorrow.',
    time: '7:30 AM',
    read: true,
    group: 'today',
  },
  {
    id: 'n4',
    type: 'policy',
    title: 'Terms of service updated',
    detail: "We've updated our terms of service, effective Oct 1.",
    time: '6:05 AM',
    read: false,
    group: 'today',
  },
  {
    id: 'n5',
    type: 'payment',
    title: 'Payment failed',
    detail: 'Your payment of $92.00 to Nimbus Hosting could not be processed.',
    time: 'Yesterday · 4:12 PM',
    read: false,
    group: 'earlier',
  },
  {
    id: 'n6',
    type: 'security',
    title: 'Password changed',
    detail: 'Your account password was changed successfully.',
    time: 'Yesterday · 11:20 AM',
    read: true,
    group: 'earlier',
  },
  {
    id: 'n7',
    type: 'reminder',
    title: 'Subscription renews in 3 days',
    detail: 'Your Pro plan renews on Oct 1 for $29.00.',
    time: 'Tue · 2:45 PM',
    read: true,
    group: 'earlier',
  },
  {
    id: 'n8',
    type: 'policy',
    title: 'Privacy policy reminder',
    detail: 'Review how we handle your data in the updated privacy policy.',
    time: 'Mon · 9:00 AM',
    read: true,
    group: 'earlier',
  },
];

const TYPE_LABELS: Record<NotificationType, string> = {
  payment: 'Payment',
  security: 'Security',
  policy: 'Policy',
  reminder: 'Reminder',
};

const FILTERS: Array<{ value: 'all' | NotificationType; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'payment', label: 'Payment' },
  { value: 'security', label: 'Security' },
  { value: 'policy', label: 'Policy' },
  { value: 'reminder', label: 'Reminder' },
];

function TypeIcon({ type }: { type: NotificationType }) {
  switch (type) {
    case 'payment':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
          <rect x="3" y="6" width="18" height="13" rx="2" />
          <path d="M3 10.5h18" />
          <path d="M7 14.5h4" />
        </svg>
      );
    case 'security':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
          <path d="M12 3l7 3v5c0 4.6-3 8.4-7 10-4-1.6-7-5.4-7-10V6l7-3z" />
          <path d="M9.5 12l1.8 1.8L14.8 10" />
        </svg>
      );
    case 'policy':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
          <path d="M6 3h9l4 4v14a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" />
          <path d="M14 3v4h4" />
          <path d="M8 13h8M8 17h5" />
        </svg>
      );
    case 'reminder':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
          <circle cx="12" cy="12.5" r="7.5" />
          <path d="M12 8.5v4.3l3 1.7" />
          <path d="M9.5 2.5h5" />
        </svg>
      );
  }
}

export default function Screen() {
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);
  const [activeFilter, setActiveFilter] = useState<'all' | NotificationType>('all');

  const unreadCount = useMemo(() => notifications.filter((n) => !n.read).length, [notifications]);

  const filtered = useMemo(
    () => notifications.filter((n) => activeFilter === 'all' || n.type === activeFilter),
    [notifications, activeFilter],
  );

  const todayItems = filtered.filter((n) => n.group === 'today');
  const earlierItems = filtered.filter((n) => n.group === 'earlier');

  function markAsRead(id: string) {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  }

  function markAllAsRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  function renderItem(n: NotificationItem) {
    return (
      <li key={n.id} className={`${styles.item} ${!n.read ? styles.unread : ''}`}>
        <span className={`${styles.icon} ${styles[`icon-${n.type}`]}`} aria-hidden="true">
          <TypeIcon type={n.type} />
        </span>
        <div className={styles.content}>
          <div className={styles.itemHeader}>
            <span className={styles.itemTitle}>{n.title}</span>
            {!n.read && <span className={styles.dot} title="Unread" aria-label="Unread" role="img" />}
          </div>
          <p className={styles.detail}>{n.detail}</p>
        </div>
        <div className={styles.meta}>
          <span className={styles.time}>{n.time}</span>
          {!n.read && (
            <button type="button" className={styles.markButton} onClick={() => markAsRead(n.id)}>
              Mark as read
            </button>
          )}
        </div>
      </li>
    );
  }

  return (
    <div className={styles.screen}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Notifications</h1>
          <p className={styles.subtitle}>
            {unreadCount === 0 ? 'All caught up' : `${unreadCount} unread`}
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
        {FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            className={`${styles.filterButton} ${activeFilter === f.value ? styles.filterButtonActive : ''}`}
            aria-pressed={activeFilter === f.value}
            onClick={() => setActiveFilter(f.value)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className={styles.empty}>No {activeFilter === 'all' ? '' : `${TYPE_LABELS[activeFilter]} `}notifications.</p>
      ) : (
        <div className={styles.groups}>
          {todayItems.length > 0 && (
            <section>
              <h2 className={styles.groupTitle}>Today</h2>
              <ul className={styles.list}>{todayItems.map(renderItem)}</ul>
            </section>
          )}
          {earlierItems.length > 0 && (
            <section>
              <h2 className={styles.groupTitle}>Earlier</h2>
              <ul className={styles.list}>{earlierItems.map(renderItem)}</ul>
            </section>
          )}
        </div>
      )}
    </div>
  );
}

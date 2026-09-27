'use client';

import { useMemo, useState } from 'react';
import type { Key } from 'react';
import { Badge, Button, IconTile, ToggleButton, ToggleButtonGroup } from '@strata/react';
import { IconClock, IconCreditCard, IconScale, IconShieldCheck } from '@strata/icons';
import styles from './Screen.module.css';

type NotificationType = 'payment' | 'security' | 'policy' | 'reminder';

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  detail: string;
  time: string;
  group: 'today' | 'earlier';
  unread: boolean;
}

const TYPE_META: Record<NotificationType, { label: string; icon: React.ReactNode; tint: 'success' | 'danger' | 'info' | 'warning' }> = {
  payment: { label: 'Payment', icon: <IconCreditCard />, tint: 'success' },
  security: { label: 'Security', icon: <IconShieldCheck />, tint: 'danger' },
  policy: { label: 'Policy', icon: <IconScale />, tint: 'info' },
  reminder: { label: 'Reminder', icon: <IconClock />, tint: 'warning' },
};

const INITIAL_NOTIFICATIONS: Notification[] = [
  {
    id: 'n1',
    type: 'payment',
    title: 'Premium payment received',
    detail: 'Your payment of ₹4,250.00 for the family plan was processed.',
    time: '9:12 AM',
    group: 'today',
    unread: true,
  },
  {
    id: 'n2',
    type: 'security',
    title: 'New sign-in from Chrome on Windows',
    detail: 'If this wasn’t you, secure your account now.',
    time: '8:47 AM',
    group: 'today',
    unread: true,
  },
  {
    id: 'n3',
    type: 'reminder',
    title: 'Policy renewal due in 3 days',
    detail: 'Renew your travel policy before it lapses on Oct 1.',
    time: '7:30 AM',
    group: 'today',
    unread: true,
  },
  {
    id: 'n4',
    type: 'policy',
    title: 'Policy document updated',
    detail: 'Section 4 of your health policy terms has changed.',
    time: '6:05 AM',
    group: 'today',
    unread: false,
  },
  {
    id: 'n5',
    type: 'payment',
    title: 'Auto-debit scheduled',
    detail: '₹1,800.00 will be deducted on Sep 30 for your car policy.',
    time: 'Yesterday',
    group: 'earlier',
    unread: true,
  },
  {
    id: 'n6',
    type: 'security',
    title: 'Two-factor authentication enabled',
    detail: 'Your account now requires a code at every sign-in.',
    time: 'Yesterday',
    group: 'earlier',
    unread: false,
  },
  {
    id: 'n7',
    type: 'policy',
    title: 'Claim approved',
    detail: 'Your claim #48213 for dental care was approved in full.',
    time: '2 days ago',
    group: 'earlier',
    unread: false,
  },
  {
    id: 'n8',
    type: 'reminder',
    title: 'Add a nominee to your policy',
    detail: 'You haven’t added a nominee for your life cover yet.',
    time: '3 days ago',
    group: 'earlier',
    unread: false,
  },
];

type FilterKey = 'all' | NotificationType;

export default function Screen() {
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);
  const [filter, setFilter] = useState<FilterKey>('all');

  const unreadCount = notifications.filter((n) => n.unread).length;

  const visible = useMemo(
    () => (filter === 'all' ? notifications : notifications.filter((n) => n.type === filter)),
    [notifications, filter],
  );

  const today = visible.filter((n) => n.group === 'today');
  const earlier = visible.filter((n) => n.group === 'earlier');

  function markAsRead(id: string) {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, unread: false } : n)));
  }

  function markAllAsRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
  }

  function handleFilterChange(keys: Set<Key>) {
    const [key] = keys;
    setFilter((key as FilterKey) ?? 'all');
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Notifications</h1>
          <p className={styles.subtitle}>
            {unreadCount > 0 ? `${unreadCount} unread` : 'You’re all caught up'}
          </p>
        </div>
        <Button variant="secondary" size="sm" onPress={markAllAsRead} isDisabled={unreadCount === 0}>
          Mark all as read
        </Button>
      </header>

      <ToggleButtonGroup
        aria-label="Filter by type"
        selectionMode="single"
        disallowEmptySelection
        selectedKeys={[filter]}
        onSelectionChange={handleFilterChange}
        size="sm"
        className={styles.filters}
      >
        <ToggleButton id="all">All</ToggleButton>
        <ToggleButton id="payment">Payment</ToggleButton>
        <ToggleButton id="security">Security</ToggleButton>
        <ToggleButton id="policy">Policy</ToggleButton>
        <ToggleButton id="reminder">Reminder</ToggleButton>
      </ToggleButtonGroup>

      <NotificationGroup title="Today" notifications={today} onMarkAsRead={markAsRead} />
      <NotificationGroup title="Earlier" notifications={earlier} onMarkAsRead={markAsRead} />

      {visible.length === 0 && <p className={styles.empty}>No notifications match this filter.</p>}
    </div>
  );
}

function NotificationGroup({
  title,
  notifications,
  onMarkAsRead,
}: {
  title: string;
  notifications: Notification[];
  onMarkAsRead: (id: string) => void;
}) {
  if (notifications.length === 0) return null;

  return (
    <section className={styles.group}>
      <h2 className={styles.groupTitle}>{title}</h2>
      <ul className={styles.list}>
        {notifications.map((n) => (
          <li key={n.id} className={styles.row} data-unread={n.unread || undefined}>
            <IconTile tint={TYPE_META[n.type].tint} size="sm">
              {TYPE_META[n.type].icon}
            </IconTile>
            <div className={styles.rowBody}>
              <div className={styles.rowHeading}>
                <span className={styles.rowTitle}>{n.title}</span>
                {n.unread && (
                  <Badge variant="status" tone="brand" size="sm">
                    Unread
                  </Badge>
                )}
              </div>
              <p className={styles.rowDetail}>{n.detail}</p>
              <span className={styles.rowMeta}>
                {TYPE_META[n.type].label} · {n.time}
              </span>
            </div>
            {n.unread && (
              <Button variant="ghost" size="sm" onPress={() => onMarkAsRead(n.id)}>
                Mark as read
              </Button>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

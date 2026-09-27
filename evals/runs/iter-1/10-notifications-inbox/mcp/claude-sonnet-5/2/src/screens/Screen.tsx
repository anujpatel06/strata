'use client';

import { useMemo, useState } from 'react';
import { Badge, Button, EmptyState, IconTile, ToggleButton, ToggleButtonGroup } from '@strata/react';
import { IconCheck, IconClock, IconCreditCard, IconFileText, IconInbox, IconShieldLock } from '@strata/icons';
import styles from './Screen.module.css';

type NotificationType = 'payment' | 'security' | 'policy' | 'reminder';
type NotificationGroup = 'today' | 'earlier';

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  detail: string;
  time: string;
  group: NotificationGroup;
  unread: boolean;
}

const INITIAL_NOTIFICATIONS: Notification[] = [
  {
    id: 'n1',
    type: 'payment',
    title: 'Payment received',
    detail: '₹12,400.00 credited from Aditi Rao',
    time: '9:42 AM',
    group: 'today',
    unread: true,
  },
  {
    id: 'n2',
    type: 'security',
    title: 'New sign-in detected',
    detail: 'Chrome on Windows · Mumbai, IN',
    time: '8:15 AM',
    group: 'today',
    unread: true,
  },
  {
    id: 'n3',
    type: 'reminder',
    title: 'Card payment due tomorrow',
    detail: 'Minimum amount ₹2,500.00',
    time: '7:30 AM',
    group: 'today',
    unread: true,
  },
  {
    id: 'n4',
    type: 'policy',
    title: 'Terms of service updated',
    detail: 'Changes take effect 1 October',
    time: '6:05 AM',
    group: 'today',
    unread: false,
  },
  {
    id: 'n5',
    type: 'payment',
    title: 'Autopay scheduled',
    detail: '₹4,800.00 will be paid on 30 September',
    time: 'Yesterday',
    group: 'earlier',
    unread: false,
  },
  {
    id: 'n6',
    type: 'security',
    title: 'Password changed',
    detail: 'Changed from a new device',
    time: 'Yesterday',
    group: 'earlier',
    unread: true,
  },
  {
    id: 'n7',
    type: 'policy',
    title: 'Privacy policy reviewed',
    detail: 'No action needed from you',
    time: '2 days ago',
    group: 'earlier',
    unread: false,
  },
  {
    id: 'n8',
    type: 'reminder',
    title: 'Statement is ready',
    detail: 'Your August statement is available to download',
    time: '3 days ago',
    group: 'earlier',
    unread: false,
  },
];

const TYPE_FILTERS: { id: 'all' | NotificationType; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'payment', label: 'Payment' },
  { id: 'security', label: 'Security' },
  { id: 'policy', label: 'Policy' },
  { id: 'reminder', label: 'Reminder' },
];

const TYPE_META: Record<NotificationType, { label: string; tint: 'success' | 'danger' | 'info' | 'warning'; icon: React.ReactNode }> = {
  payment: { label: 'Payment', tint: 'success', icon: <IconCreditCard /> },
  security: { label: 'Security', tint: 'danger', icon: <IconShieldLock /> },
  policy: { label: 'Policy', tint: 'info', icon: <IconFileText /> },
  reminder: { label: 'Reminder', tint: 'warning', icon: <IconClock /> },
};

const GROUP_LABEL: Record<NotificationGroup, string> = {
  today: 'Today',
  earlier: 'Earlier',
};

export default function Screen() {
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);
  const [filter, setFilter] = useState<'all' | NotificationType>('all');

  const unreadCount = notifications.filter((n) => n.unread).length;

  const visible = useMemo(
    () => notifications.filter((n) => filter === 'all' || n.type === filter),
    [notifications, filter],
  );

  const groups: { id: NotificationGroup; items: Notification[] }[] = (['today', 'earlier'] as const)
    .map((id) => ({ id, items: visible.filter((n) => n.group === id) }))
    .filter((g) => g.items.length > 0);

  function markAsRead(id: string) {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, unread: false } : n)));
  }

  function markAllAsRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
  }

  return (
    <div className={styles.page}>
      <header className={styles.headerRow}>
        <div className={styles.headingGroup}>
          <h1 className={styles.title}>Notifications</h1>
          {unreadCount > 0 ? (
            <Badge tone="info" variant="soft">
              {unreadCount} unread
            </Badge>
          ) : (
            <Badge tone="neutral" variant="soft">
              All caught up
            </Badge>
          )}
        </div>
        <Button variant="secondary" isDisabled={unreadCount === 0} onPress={markAllAsRead}>
          <IconCheck aria-hidden />
          Mark all as read
        </Button>
      </header>

      <ToggleButtonGroup
        aria-label="Filter by type"
        selectionMode="single"
        disallowEmptySelection
        selectedKeys={[filter]}
        onSelectionChange={(keys) => {
          if (keys === 'all') return;
          const next = Array.from(keys)[0];
          setFilter((next as 'all' | NotificationType) ?? 'all');
        }}
      >
        {TYPE_FILTERS.map((t) => (
          <ToggleButton key={t.id} id={t.id}>
            {t.label}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>

      {groups.length === 0 ? (
        <EmptyState
          icon={<IconInbox />}
          title="No notifications"
          description="Try a different filter to see more."
        />
      ) : (
        groups.map((group) => (
          <section key={group.id} className={styles.group} aria-labelledby={`${group.id}-heading`}>
            <h2 id={`${group.id}-heading`} className={styles.groupHeading}>
              {GROUP_LABEL[group.id]}
            </h2>
            <ul className={styles.list}>
              {group.items.map((n) => {
                const meta = TYPE_META[n.type];
                return (
                  <li key={n.id} className={styles.row} data-unread={n.unread || undefined}>
                    <IconTile tint={meta.tint}>{meta.icon}</IconTile>
                    <div className={styles.content}>
                      <div className={styles.titleRow}>
                        <p className={styles.itemTitle}>{n.title}</p>
                        {n.unread && (
                          <Badge variant="status" tone="info" size="sm">
                            Unread
                          </Badge>
                        )}
                      </div>
                      <p className={styles.detail}>{n.detail}</p>
                    </div>
                    <div className={styles.meta}>
                      <span className={styles.time}>{n.time}</span>
                      {n.unread && (
                        <Button
                          size="icon"
                          variant="ghost"
                          aria-label={`Mark "${n.title}" as read`}
                          onPress={() => markAsRead(n.id)}
                        >
                          <IconCheck aria-hidden />
                        </Button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        ))
      )}
    </div>
  );
}

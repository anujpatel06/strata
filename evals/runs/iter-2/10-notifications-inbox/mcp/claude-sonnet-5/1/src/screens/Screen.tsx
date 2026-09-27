'use client';

import { useMemo, useState } from 'react';
import type { Key } from 'react';
import {
  Badge,
  Button,
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Eyebrow,
  IconTile,
  ToggleButton,
  ToggleButtonGroup,
} from '@strata/react';
import { IconAlarm, IconCheck, IconCreditCard, IconFileText, IconShieldLock } from '@strata/icons';
import styles from './Screen.module.css';

type NotificationType = 'payment' | 'security' | 'policy' | 'reminder';

type Notification = {
  id: string;
  type: NotificationType;
  title: string;
  detail: string;
  time: string;
  section: 'today' | 'earlier';
  unread: boolean;
};

const typeMeta: Record<NotificationType, { label: string; tint: 'success' | 'danger' | 'info' | 'warning'; icon: React.ReactNode }> = {
  payment: { label: 'Payment', tint: 'success', icon: <IconCreditCard aria-hidden /> },
  security: { label: 'Security', tint: 'danger', icon: <IconShieldLock aria-hidden /> },
  policy: { label: 'Policy', tint: 'info', icon: <IconFileText aria-hidden /> },
  reminder: { label: 'Reminder', tint: 'warning', icon: <IconAlarm aria-hidden /> },
};

const initialNotifications: Notification[] = [
  {
    id: 'n1',
    type: 'payment',
    title: 'Payment received',
    detail: '₹24,500 was credited to your Everyday account.',
    time: '9:42 AM',
    section: 'today',
    unread: true,
  },
  {
    id: 'n2',
    type: 'security',
    title: 'New sign-in detected',
    detail: 'A new device signed in from Mumbai, India.',
    time: '8:15 AM',
    section: 'today',
    unread: true,
  },
  {
    id: 'n3',
    type: 'reminder',
    title: 'Card payment due soon',
    detail: 'Your Travel card bill of ₹8,200 is due in 3 days.',
    time: '7:30 AM',
    section: 'today',
    unread: false,
  },
  {
    id: 'n4',
    type: 'policy',
    title: 'Terms of service updated',
    detail: "We've updated our terms of service, effective 1 October.",
    time: '6:50 AM',
    section: 'today',
    unread: false,
  },
  {
    id: 'n5',
    type: 'payment',
    title: 'Autopay failed',
    detail: "Autopay for your electricity bill couldn't be completed.",
    time: 'Yesterday, 4:12 PM',
    section: 'earlier',
    unread: true,
  },
  {
    id: 'n6',
    type: 'security',
    title: 'Password changed',
    detail: 'Your account password was changed successfully.',
    time: 'Yesterday, 11:05 AM',
    section: 'earlier',
    unread: false,
  },
  {
    id: 'n7',
    type: 'policy',
    title: 'Privacy policy update',
    detail: 'Our privacy policy changes take effect next week.',
    time: 'Sep 24, 3:20 PM',
    section: 'earlier',
    unread: true,
  },
  {
    id: 'n8',
    type: 'reminder',
    title: 'Statement ready',
    detail: 'Your September account statement is ready to view.',
    time: 'Sep 22, 9:00 AM',
    section: 'earlier',
    unread: false,
  },
];

const filters: Array<{ id: Key; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'payment', label: 'Payment' },
  { id: 'security', label: 'Security' },
  { id: 'policy', label: 'Policy' },
  { id: 'reminder', label: 'Reminder' },
];

export default function Screen() {
  const [notifications, setNotifications] = useState(initialNotifications);
  const [filter, setFilter] = useState<Key>('all');

  const unreadCount = notifications.filter((n) => n.unread).length;

  const filtered = useMemo(
    () => (filter === 'all' ? notifications : notifications.filter((n) => n.type === filter)),
    [notifications, filter],
  );

  const today = filtered.filter((n) => n.section === 'today');
  const earlier = filtered.filter((n) => n.section === 'earlier');

  function markAsRead(id: string) {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, unread: false } : n)));
  }

  function markAllAsRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
  }

  function renderSection(label: string, items: Notification[]) {
    if (items.length === 0) return null;
    return (
      <section className={styles.section}>
        <Eyebrow as="p">{label}</Eyebrow>
        <ul className={styles.list}>
          {items.map((n) => {
            const meta = typeMeta[n.type];
            return (
              <li key={n.id} className={styles.row} data-unread={n.unread || undefined}>
                <IconTile tint={meta.tint} size="sm">
                  {meta.icon}
                </IconTile>
                <div className={styles.body}>
                  <div className={styles.titleLine}>
                    <span className={styles.title}>{n.title}</span>
                    <Badge size="sm" tone={meta.tint}>{meta.label}</Badge>
                    {n.unread && (
                      <Badge size="sm" tone="brand" dot>
                        Unread
                      </Badge>
                    )}
                  </div>
                  <p className={styles.detail}>{n.detail}</p>
                </div>
                <span className={styles.time}>{n.time}</span>
                {n.unread && (
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Mark "${n.title}" as read`}
                    onPress={() => markAsRead(n.id)}
                  >
                    <IconCheck aria-hidden />
                  </Button>
                )}
              </li>
            );
          })}
        </ul>
      </section>
    );
  }

  return (
    <div className={styles.page}>
      <Card>
        <CardHeader>
          <CardTitle level={1}>Notifications</CardTitle>
          <CardDescription>
            {unreadCount === 0 ? 'You are all caught up' : `${unreadCount} unread notification${unreadCount === 1 ? '' : 's'}`}
          </CardDescription>
          <CardAction>
            <Button variant="secondary" size="sm" onPress={markAllAsRead} isDisabled={unreadCount === 0}>
              Mark all as read
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent>
          <ToggleButtonGroup
            aria-label="Filter by type"
            selectedKeys={[filter]}
            onSelectionChange={(keys) => {
              const [key] = Array.from(keys);
              if (key) setFilter(key);
            }}
            disallowEmptySelection
            className={styles.filters}
          >
            {filters.map((f) => (
              <ToggleButton key={f.id} id={f.id}>
                {f.label}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>

          {filtered.length === 0 ? (
            <p className={styles.empty}>No notifications of this type.</p>
          ) : (
            <div className={styles.sections}>
              {renderSection('Today', today)}
              {renderSection('Earlier', earlier)}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

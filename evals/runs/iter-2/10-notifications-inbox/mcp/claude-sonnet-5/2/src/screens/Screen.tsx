'use client';

import { useId, useMemo, useState, type ReactNode } from 'react';
import {
  Badge,
  Button,
  EmptyState,
  IconTile,
  ToggleButton,
  ToggleButtonGroup,
} from '@strata/react';
import {
  IconBell,
  IconClock,
  IconCreditCard,
  IconFileText,
  IconShieldCheck,
} from '@strata/icons';
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
  unread: boolean;
}

const initialNotifications: Notification[] = [
  {
    id: 'n1',
    type: 'payment',
    title: 'Payment received',
    detail: 'Rent payment of ₹42,000 was credited to your account.',
    time: '9:12 AM',
    group: 'today',
    unread: true,
  },
  {
    id: 'n2',
    type: 'security',
    title: 'New sign-in detected',
    detail: 'Your account was accessed from a new device in Pune.',
    time: '8:47 AM',
    group: 'today',
    unread: true,
  },
  {
    id: 'n3',
    type: 'reminder',
    title: 'Card payment due soon',
    detail: 'Your travel card statement is due in 3 days.',
    time: '7:30 AM',
    group: 'today',
    unread: true,
  },
  {
    id: 'n4',
    type: 'policy',
    title: 'Terms of service updated',
    detail: 'We updated how we handle shared account data.',
    time: '6:05 AM',
    group: 'today',
    unread: false,
  },
  {
    id: 'n5',
    type: 'payment',
    title: 'Autopay scheduled',
    detail: 'Electricity bill of ₹2,150 will be paid on 1 October.',
    time: 'Yesterday',
    group: 'earlier',
    unread: true,
  },
  {
    id: 'n6',
    type: 'security',
    title: 'Password changed',
    detail: 'Your account password was changed successfully.',
    time: 'Yesterday',
    group: 'earlier',
    unread: false,
  },
  {
    id: 'n7',
    type: 'reminder',
    title: 'Complete your profile',
    detail: 'Add a backup contact to keep your account secure.',
    time: '2 days ago',
    group: 'earlier',
    unread: false,
  },
  {
    id: 'n8',
    type: 'policy',
    title: 'Privacy policy reminder',
    detail: 'Review how your data is shared with partner banks.',
    time: '3 days ago',
    group: 'earlier',
    unread: false,
  },
];

const typeMeta: Record<
  NotificationType,
  { label: string; badgeTone: 'info' | 'warning' | 'neutral' | 'success'; tileTint: 'info' | 'warning' | 'accent' | 'success'; icon: ReactNode }
> = {
  payment: { label: 'Payment', badgeTone: 'info', tileTint: 'info', icon: <IconCreditCard aria-hidden /> },
  security: { label: 'Security', badgeTone: 'warning', tileTint: 'warning', icon: <IconShieldCheck aria-hidden /> },
  policy: { label: 'Policy', badgeTone: 'neutral', tileTint: 'accent', icon: <IconFileText aria-hidden /> },
  reminder: { label: 'Reminder', badgeTone: 'success', tileTint: 'success', icon: <IconClock aria-hidden /> },
};

const groupLabel: Record<Group, string> = {
  today: 'Today',
  earlier: 'Earlier',
};

type Filter = 'all' | NotificationType;

export default function Screen() {
  const uid = useId();
  const [notifications, setNotifications] = useState(initialNotifications);
  const [filter, setFilter] = useState<Filter>('all');

  const unreadCount = notifications.filter((n) => n.unread).length;

  const filtered = useMemo(
    () => notifications.filter((n) => filter === 'all' || n.type === filter),
    [notifications, filter],
  );

  const groups: Group[] = ['today', 'earlier'];

  const markAsRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, unread: false } : n)));
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
  };

  return (
    <main className={styles.page}>
      <div className={styles.header}>
        <div className={styles.titleBlock}>
          <IconTile tint="brand" size="lg" alt="">
            <IconBell aria-hidden />
          </IconTile>
          <div>
            <h1 className={styles.title} id={`${uid}-title`}>
              Notifications
            </h1>
            <p className={styles.subtitle}>
              {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount === 1 ? '' : 's'}` : 'You are all caught up'}
            </p>
          </div>
        </div>
        <Button variant="outline" onPress={markAllAsRead} isDisabled={unreadCount === 0}>
          Mark all as read
        </Button>
      </div>

      <ToggleButtonGroup
        aria-label="Filter by type"
        selectedKeys={[filter]}
        onSelectionChange={(keys) => {
          const [key] = Array.from(keys);
          if (key) setFilter(key as Filter);
        }}
        disallowEmptySelection
        className={styles.filters}
      >
        <ToggleButton id="all">All</ToggleButton>
        <ToggleButton id="payment">Payment</ToggleButton>
        <ToggleButton id="security">Security</ToggleButton>
        <ToggleButton id="policy">Policy</ToggleButton>
        <ToggleButton id="reminder">Reminder</ToggleButton>
      </ToggleButtonGroup>

      <div className={styles.groups} aria-labelledby={`${uid}-title`}>
        {groups.map((group) => {
          const items = filtered.filter((n) => n.group === group);
          if (items.length === 0) return null;
          return (
            <section key={group} className={styles.group} aria-labelledby={`${uid}-${group}`}>
              <h2 className={styles.groupTitle} id={`${uid}-${group}`}>
                {groupLabel[group]}
              </h2>
              <ul className={styles.list}>
                {items.map((n) => (
                  <li key={n.id} className={styles.row} data-unread={n.unread || undefined}>
                    <IconTile tint={typeMeta[n.type].tileTint}>{typeMeta[n.type].icon}</IconTile>
                    <div className={styles.rowBody}>
                      <div className={styles.rowHeading}>
                        <span className={styles.rowTitle}>{n.title}</span>
                        <Badge variant="status" tone={typeMeta[n.type].badgeTone} size="sm">
                          {typeMeta[n.type].label}
                        </Badge>
                        {n.unread && (
                          <Badge variant="status" tone="brand" size="sm">
                            Unread
                          </Badge>
                        )}
                      </div>
                      <p className={styles.rowDetail}>{n.detail}</p>
                      <span className={styles.rowTime}>{n.time}</span>
                    </div>
                    {n.unread && (
                      <Button variant="ghost" size="sm" onPress={() => markAsRead(n.id)}>
                        Mark as read
                      </Button>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          );
        })}

        {filtered.length === 0 && (
          <EmptyState
            icon={<IconBell aria-hidden />}
            title="No notifications"
            description="Nothing matches this filter yet. Try a different type."
            action={
              <Button variant="outline" onPress={() => setFilter('all')}>
                Clear filter
              </Button>
            }
          />
        )}
      </div>
    </main>
  );
}

import { useMemo, useState, type ReactNode } from 'react';
import {
  Badge,
  Button,
  Card,
  CardContent,
  Chip,
  ChipGroup,
  EmptyState,
  IconTile,
  Tag,
  type AvatarTone,
  type Selection,
} from '@strata/react';
import {
  IconBell,
  IconCheck,
  IconClock,
  IconCreditCard,
  IconFileText,
  IconShieldCheck,
} from '@strata/icons';
import styles from './Screen.module.css';

type NotificationType = 'payment' | 'security' | 'policy' | 'reminder';
type FilterValue = 'all' | NotificationType;

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  detail: string;
  time: string;
  group: 'today' | 'earlier';
  unread: boolean;
}

const TYPE_META: Record<NotificationType, { label: string; tone: AvatarTone; icon: ReactNode }> = {
  payment: { label: 'Payment', tone: 'success', icon: <IconCreditCard /> },
  security: { label: 'Security', tone: 'danger', icon: <IconShieldCheck /> },
  policy: { label: 'Policy', tone: 'info', icon: <IconFileText /> },
  reminder: { label: 'Reminder', tone: 'warning', icon: <IconClock /> },
};

const FILTERS: { id: FilterValue; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'payment', label: 'Payment' },
  { id: 'security', label: 'Security' },
  { id: 'policy', label: 'Policy' },
  { id: 'reminder', label: 'Reminder' },
];

const INITIAL_NOTIFICATIONS: Notification[] = [
  {
    id: 'n1',
    type: 'payment',
    title: 'Payment received',
    detail: '₹24,500 credited from Rohan Mehta',
    time: '9:41 AM',
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
    detail: 'HDFC Credit Card ending 4021 · ₹12,340 due',
    time: '7:30 AM',
    group: 'today',
    unread: false,
  },
  {
    id: 'n4',
    type: 'policy',
    title: 'Terms of service updated',
    detail: 'Review the new data-sharing terms before Oct 5',
    time: '6:05 AM',
    group: 'today',
    unread: true,
  },
  {
    id: 'n5',
    type: 'payment',
    title: 'Autopay set up',
    detail: 'Electricity bill will be paid automatically each month',
    time: 'Yesterday, 4:12 PM',
    group: 'earlier',
    unread: false,
  },
  {
    id: 'n6',
    type: 'security',
    title: 'Password changed',
    detail: 'Your account password was changed successfully',
    time: 'Yesterday, 11:02 AM',
    group: 'earlier',
    unread: true,
  },
  {
    id: 'n7',
    type: 'reminder',
    title: 'Subscription renews in 3 days',
    detail: 'Cloud Storage Plus · ₹199/month',
    time: '2 days ago',
    group: 'earlier',
    unread: false,
  },
  {
    id: 'n8',
    type: 'policy',
    title: 'Privacy policy reminder',
    detail: 'Your annual privacy preferences review is due',
    time: '3 days ago',
    group: 'earlier',
    unread: false,
  },
];

export default function Screen() {
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);
  const [filter, setFilter] = useState<FilterValue>('all');

  const unreadCount = notifications.filter((n) => n.unread).length;

  const filtered = useMemo(
    () => notifications.filter((n) => filter === 'all' || n.type === filter),
    [notifications, filter],
  );
  const todayItems = filtered.filter((n) => n.group === 'today');
  const earlierItems = filtered.filter((n) => n.group === 'earlier');

  function markAsRead(id: string) {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, unread: false } : n)));
  }

  function markAllAsRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
  }

  function handleFilterChange(keys: Selection) {
    if (keys === 'all') return;
    const [first] = keys;
    if (typeof first === 'string') setFilter(first as FilterValue);
  }

  return (
    <div className={styles.page}>
      <div className={styles.headerRow}>
        <div>
          <h1 className={styles.heading}>Notifications</h1>
          <p className={styles.subheading}>
            {unreadCount === 0 ? 'You are all caught up' : `${unreadCount} unread`}
          </p>
        </div>
        <Button variant="outline" size="sm" onPress={markAllAsRead} isDisabled={unreadCount === 0}>
          <IconCheck />
          Mark all as read
        </Button>
      </div>

      <ChipGroup
        mode="choice"
        label="Filter by type"
        size="sm"
        className={styles.filters}
        selectedKeys={new Set([filter])}
        onSelectionChange={handleFilterChange}
      >
        {FILTERS.map((f) => (
          <Chip key={f.id} id={f.id} icon={f.id === 'all' ? undefined : TYPE_META[f.id as NotificationType].icon}>
            {f.label}
          </Chip>
        ))}
      </ChipGroup>

      <Card variant="outline" className={styles.card}>
        <CardContent className={styles.content}>
          {todayItems.length > 0 && (
            <div className={styles.group}>
              <h2 className={styles.groupTitle}>Today</h2>
              <ul className={styles.list}>
                {todayItems.map((n) => (
                  <li key={n.id}>
                    <NotificationRow notification={n} onMarkAsRead={markAsRead} />
                  </li>
                ))}
              </ul>
            </div>
          )}

          {earlierItems.length > 0 && (
            <div className={styles.group}>
              <h2 className={styles.groupTitle}>Earlier</h2>
              <ul className={styles.list}>
                {earlierItems.map((n) => (
                  <li key={n.id}>
                    <NotificationRow notification={n} onMarkAsRead={markAsRead} />
                  </li>
                ))}
              </ul>
            </div>
          )}

          {todayItems.length === 0 && earlierItems.length === 0 && (
            <EmptyState
              size="sm"
              icon={<IconBell />}
              title="No notifications"
              description="There are no notifications matching this filter."
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function NotificationRow({
  notification,
  onMarkAsRead,
}: {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
}) {
  const meta = TYPE_META[notification.type];

  return (
    <div className={notification.unread ? `${styles.row} ${styles.unread}` : styles.row}>
      <IconTile tint={meta.tone} size="md" alt="">
        {meta.icon}
      </IconTile>
      <div className={styles.rowBody}>
        <div className={styles.rowHeader}>
          <Tag tone={meta.tone} size="sm">
            {meta.label}
          </Tag>
          {notification.unread && (
            <Badge variant="status" tone="brand" dot>
              Unread
            </Badge>
          )}
        </div>
        <p className={styles.title}>{notification.title}</p>
        <p className={styles.detail}>{notification.detail}</p>
      </div>
      <div className={styles.rowMeta}>
        <span className={styles.time}>{notification.time}</span>
        {notification.unread && (
          <Button variant="ghost" size="sm" onPress={() => onMarkAsRead(notification.id)}>
            Mark as read
          </Button>
        )}
      </div>
    </div>
  );
}

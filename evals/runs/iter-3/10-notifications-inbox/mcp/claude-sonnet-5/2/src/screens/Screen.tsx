import { useMemo, useState } from 'react';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Eyebrow,
  EmptyState,
  IconTile,
  ToggleButton,
  ToggleButtonGroup,
  type Key,
} from '@syntara/react';
import {
  IconAlarm,
  IconCheck,
  IconCreditCard,
  IconFileText,
  IconInbox,
  IconShieldLock,
} from '@syntara/icons';
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
    detail: '₹2,400 from Aarav Mehta was credited to your wallet.',
    time: '9:42 AM',
    group: 'today',
    unread: true,
  },
  {
    id: 'n2',
    type: 'security',
    title: 'New sign-in detected',
    detail: 'Your account was accessed from a new device in Mumbai.',
    time: '8:15 AM',
    group: 'today',
    unread: true,
  },
  {
    id: 'n3',
    type: 'policy',
    title: 'Policy renewed',
    detail: 'Your health policy HP-4821 was renewed for another year.',
    time: '7:30 AM',
    group: 'today',
    unread: false,
  },
  {
    id: 'n4',
    type: 'reminder',
    title: 'Premium due in 3 days',
    detail: 'Your motor policy premium of ₹5,200 is due on 1 Oct.',
    time: '6:00 AM',
    group: 'today',
    unread: true,
  },
  {
    id: 'n5',
    type: 'payment',
    title: 'Refund processed',
    detail: '₹1,200 was refunded to your original payment method.',
    time: 'Yesterday',
    group: 'earlier',
    unread: false,
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
    type: 'policy',
    title: 'Document verified',
    detail: 'Your KYC document was verified and added to your file.',
    time: '2 days ago',
    group: 'earlier',
    unread: true,
  },
  {
    id: 'n8',
    type: 'reminder',
    title: 'Claim update needed',
    detail: 'Add one more document to continue your claim CLM-9931.',
    time: '3 days ago',
    group: 'earlier',
    unread: false,
  },
];

const typeMeta: Record<NotificationType, { label: string; tone: 'success' | 'info' | 'brand' | 'warning'; icon: React.ReactNode }> = {
  payment: { label: 'Payment', tone: 'success', icon: <IconCreditCard /> },
  security: { label: 'Security', tone: 'info', icon: <IconShieldLock /> },
  policy: { label: 'Policy', tone: 'brand', icon: <IconFileText /> },
  reminder: { label: 'Reminder', tone: 'warning', icon: <IconAlarm /> },
};

const filterOptions: { id: NotificationType | 'all'; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'payment', label: 'Payment' },
  { id: 'security', label: 'Security' },
  { id: 'policy', label: 'Policy' },
  { id: 'reminder', label: 'Reminder' },
];

function NotificationRow({
  notification,
  onMarkAsRead,
}: {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
}) {
  const meta = typeMeta[notification.type];
  return (
    <li className={styles.row}>
      <IconTile tint={meta.tone}>{meta.icon}</IconTile>
      <div className={styles.rowBody}>
        <div className={styles.rowTop}>
          <span className={notification.unread ? styles.titleUnread : styles.title}>{notification.title}</span>
          <Badge tone={meta.tone} variant="soft" size="sm">
            {meta.label}
          </Badge>
          {notification.unread ? (
            <Badge tone="brand" variant="soft" size="sm">
              Unread
            </Badge>
          ) : null}
        </div>
        <p className={styles.detail}>{notification.detail}</p>
        <span className={styles.time}>{notification.time}</span>
      </div>
      {notification.unread ? (
        <Button
          variant="ghost"
          size="icon"
          aria-label={`Mark "${notification.title}" as read`}
          onPress={() => onMarkAsRead(notification.id)}
        >
          <IconCheck aria-hidden />
        </Button>
      ) : null}
    </li>
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
    <Card variant="outline" className={styles.groupCard}>
      <CardHeader divider>
        <CardTitle level={2}>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className={styles.list}>
          {notifications.map((n) => (
            <NotificationRow key={n.id} notification={n} onMarkAsRead={onMarkAsRead} />
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

export default function Screen() {
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);
  const [filterKeys, setFilterKeys] = useState<Set<Key>>(new Set(['all']));

  const filter = String([...filterKeys][0] ?? 'all') as NotificationType | 'all';
  const unreadCount = notifications.filter((n) => n.unread).length;

  const filtered = useMemo(
    () => (filter === 'all' ? notifications : notifications.filter((n) => n.type === filter)),
    [notifications, filter],
  );
  const today = filtered.filter((n) => n.group === 'today');
  const earlier = filtered.filter((n) => n.group === 'earlier');

  const markAsRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, unread: false } : n)));
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headingGroup}>
          <Eyebrow>Notifications</Eyebrow>
          <div className={styles.headingRow}>
            <h1 className={styles.heading}>Inbox</h1>
            {unreadCount > 0 ? (
              <Badge tone="brand" variant="soft">
                {unreadCount} unread
              </Badge>
            ) : null}
          </div>
        </div>
        <Button variant="secondary" onPress={markAllAsRead} isDisabled={unreadCount === 0}>
          <IconCheck aria-hidden />
          Mark all as read
        </Button>
      </header>

      <ToggleButtonGroup
        aria-label="Filter by type"
        selectedKeys={filterKeys}
        onSelectionChange={setFilterKeys}
        disallowEmptySelection
        className={styles.filters}
      >
        {filterOptions.map((option) => (
          <ToggleButton key={option.id} id={option.id}>
            {option.label}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<IconInbox />}
          title="No notifications"
          description="Try a different filter to see more notifications."
        />
      ) : (
        <div className={styles.groups}>
          <NotificationGroup title="Today" notifications={today} onMarkAsRead={markAsRead} />
          <NotificationGroup title="Earlier" notifications={earlier} onMarkAsRead={markAsRead} />
        </div>
      )}
    </div>
  );
}

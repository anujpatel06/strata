import { useMemo, useState, type ReactNode } from 'react';
import {
  Badge,
  Button,
  Card,
  CardContent,
  EmptyState,
  IconTile,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  TooltipTrigger,
  type Key,
} from '@syntara/react';
import {
  IconAlarm,
  IconCheck,
  IconFileText,
  IconInbox,
  IconShieldLock,
  IconWallet,
} from '@syntara/icons';
import styles from './Screen.module.css';

type NotificationType = 'payment' | 'security' | 'policy' | 'reminder';
type FilterKey = 'all' | NotificationType;

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  detail: string;
  time: string;
  group: 'today' | 'earlier';
  unread: boolean;
}

const initialNotifications: Notification[] = [
  {
    id: 'n1',
    type: 'payment',
    title: 'Payment received',
    detail: '₹12,400 credited from Aarav Mehta',
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
    title: 'Bill due tomorrow',
    detail: 'Electricity bill of ₹2,150 is due',
    time: '7:30 AM',
    group: 'today',
    unread: false,
  },
  {
    id: 'n4',
    type: 'policy',
    title: 'Policy updated',
    detail: 'Your travel policy now covers gadget loss',
    time: '6:05 AM',
    group: 'today',
    unread: true,
  },
  {
    id: 'n5',
    type: 'payment',
    title: 'Payment failed',
    detail: "Auto-pay for broadband didn't go through",
    time: 'Yesterday, 6:48 PM',
    group: 'earlier',
    unread: false,
  },
  {
    id: 'n6',
    type: 'security',
    title: 'Password changed',
    detail: 'Your account password was updated',
    time: 'Yesterday, 2:10 PM',
    group: 'earlier',
    unread: false,
  },
  {
    id: 'n7',
    type: 'policy',
    title: 'New terms of service',
    detail: 'Updated terms take effect from 1 October',
    time: '2 days ago',
    group: 'earlier',
    unread: true,
  },
  {
    id: 'n8',
    type: 'reminder',
    title: 'Renewal coming up',
    detail: 'Health policy renews in 5 days',
    time: '3 days ago',
    group: 'earlier',
    unread: false,
  },
];

const typeMeta: Record<
  NotificationType,
  { label: string; icon: ReactNode; tint: 'success' | 'info' | 'brand' | 'warning'; badgeTone: 'success' | 'info' | 'neutral' | 'warning' }
> = {
  payment: { label: 'Payment', icon: <IconWallet aria-hidden />, tint: 'success', badgeTone: 'success' },
  security: { label: 'Security', icon: <IconShieldLock aria-hidden />, tint: 'info', badgeTone: 'info' },
  policy: { label: 'Policy', icon: <IconFileText aria-hidden />, tint: 'brand', badgeTone: 'neutral' },
  reminder: { label: 'Reminder', icon: <IconAlarm aria-hidden />, tint: 'warning', badgeTone: 'warning' },
};

const filterOptions: { id: FilterKey; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'payment', label: 'Payment' },
  { id: 'security', label: 'Security' },
  { id: 'policy', label: 'Policy' },
  { id: 'reminder', label: 'Reminder' },
];

function NotificationRow({
  notification,
  onMarkRead,
}: {
  notification: Notification;
  onMarkRead: (id: string) => void;
}) {
  const meta = typeMeta[notification.type];
  return (
    <li>
      <Card variant="outline">
        <CardContent className={styles.row}>
          <IconTile tint={meta.tint}>{meta.icon}</IconTile>
          <div className={styles.content}>
            <div className={styles.titleRow}>
              <span className={styles.title}>{notification.title}</span>
              {notification.unread && (
                <Badge variant="status" tone="brand" size="sm">
                  Unread
                </Badge>
              )}
            </div>
            <p className={styles.detail}>{notification.detail}</p>
            <div className={styles.meta}>
              <Badge variant="soft" tone={meta.badgeTone} size="sm">
                {meta.label}
              </Badge>
              <span className={styles.time}>{notification.time}</span>
            </div>
          </div>
          <div className={styles.actions}>
            {notification.unread && (
              <TooltipTrigger>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`Mark "${notification.title}" as read`}
                  onPress={() => onMarkRead(notification.id)}
                >
                  <IconCheck aria-hidden />
                </Button>
                <Tooltip>Mark as read</Tooltip>
              </TooltipTrigger>
            )}
          </div>
        </CardContent>
      </Card>
    </li>
  );
}

export default function Screen() {
  const [notifications, setNotifications] = useState(initialNotifications);
  const [filterKeys, setFilterKeys] = useState<Set<Key>>(new Set(['all']));
  const filter = (String([...filterKeys][0] ?? 'all') as FilterKey);

  const unreadCount = notifications.filter((n) => n.unread).length;

  const filtered = useMemo(
    () => (filter === 'all' ? notifications : notifications.filter((n) => n.type === filter)),
    [notifications, filter],
  );
  const todayList = filtered.filter((n) => n.group === 'today');
  const earlierList = filtered.filter((n) => n.group === 'earlier');

  function markAsRead(id: string) {
    setNotifications((list) => list.map((n) => (n.id === id ? { ...n, unread: false } : n)));
  }

  function markAllAsRead() {
    setNotifications((list) => list.map((n) => ({ ...n, unread: false })));
  }

  return (
    <div className={styles.screen}>
      <header className={styles.header}>
        <div className={styles.headerText}>
          <h1 className={styles.heading}>Notifications</h1>
          <Badge variant="soft" tone={unreadCount > 0 ? 'brand' : 'neutral'} size="sm">
            {unreadCount} unread
          </Badge>
        </div>
        <Button
          variant="secondary"
          size="sm"
          isDisabled={unreadCount === 0}
          onPress={markAllAsRead}
        >
          <IconCheck aria-hidden />
          Mark all as read
        </Button>
      </header>

      <ToggleButtonGroup
        aria-label="Filter by notification type"
        selectedKeys={filterKeys}
        onSelectionChange={(keys) => setFilterKeys(keys as Set<Key>)}
        disallowEmptySelection
        size="sm"
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
          size="md"
          icon={<IconInbox aria-hidden />}
          title="No notifications"
          description="Nothing matches this filter right now."
        />
      ) : (
        <div className={styles.groups}>
          {todayList.length > 0 && (
            <section className={styles.group} aria-labelledby="notif-today">
              <h2 id="notif-today" className={styles.groupHeading}>
                Today
              </h2>
              <ul className={styles.list}>
                {todayList.map((n) => (
                  <NotificationRow key={n.id} notification={n} onMarkRead={markAsRead} />
                ))}
              </ul>
            </section>
          )}
          {earlierList.length > 0 && (
            <section className={styles.group} aria-labelledby="notif-earlier">
              <h2 id="notif-earlier" className={styles.groupHeading}>
                Earlier
              </h2>
              <ul className={styles.list}>
                {earlierList.map((n) => (
                  <NotificationRow key={n.id} notification={n} onMarkRead={markAsRead} />
                ))}
              </ul>
            </section>
          )}
        </div>
      )}
    </div>
  );
}

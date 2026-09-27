import { useMemo, useState, type ReactNode } from 'react';
import { Badge, Button, IconTile, Separator, ToggleButton, ToggleButtonGroup, type BadgeTone, type IconTileTint } from '@strata/react';
import { IconAlarm, IconCheck, IconCreditCard, IconFileText, IconInbox, IconShieldCheck } from '@strata/icons';
import styles from './Screen.module.css';

type NotificationType = 'payment' | 'security' | 'policy' | 'reminder';
type Group = 'today' | 'earlier';
type Filter = 'all' | NotificationType;

interface Notification {
  id: string;
  type: NotificationType;
  group: Group;
  title: string;
  detail: string;
  time: string;
  unread: boolean;
}

const INITIAL_NOTIFICATIONS: Notification[] = [
  {
    id: 'n1',
    type: 'payment',
    group: 'today',
    title: 'Payment received',
    detail: '₹24,500 credited from Rohan Mehta',
    time: '9:42 AM',
    unread: true,
  },
  {
    id: 'n2',
    type: 'security',
    group: 'today',
    title: 'New sign-in detected',
    detail: 'Chrome on Windows · Mumbai, IN',
    time: '8:15 AM',
    unread: true,
  },
  {
    id: 'n3',
    type: 'reminder',
    group: 'today',
    title: 'Card payment due tomorrow',
    detail: 'HDFC Credit Card · ₹12,340 due',
    time: '7:30 AM',
    unread: false,
  },
  {
    id: 'n4',
    type: 'policy',
    group: 'today',
    title: 'Privacy policy updated',
    detail: 'Changes take effect from 1 Oct',
    time: '6:00 AM',
    unread: true,
  },
  {
    id: 'n5',
    type: 'payment',
    group: 'earlier',
    title: 'Payment sent',
    detail: '₹3,200 to Priya Raman for rent',
    time: 'Yesterday, 6:48 PM',
    unread: false,
  },
  {
    id: 'n6',
    type: 'security',
    group: 'earlier',
    title: 'Password changed',
    detail: 'Your account password was updated',
    time: 'Yesterday, 2:10 PM',
    unread: false,
  },
  {
    id: 'n7',
    type: 'reminder',
    group: 'earlier',
    title: 'Subscription renews in 3 days',
    detail: 'Strata Pro · ₹499/month',
    time: '2 days ago',
    unread: true,
  },
  {
    id: 'n8',
    type: 'policy',
    group: 'earlier',
    title: 'Terms of service updated',
    detail: 'New arbitration clause added',
    time: '3 days ago',
    unread: false,
  },
];

const TYPE_META: Record<NotificationType, { label: string; icon: ReactNode; badgeTone: BadgeTone; tileTint: IconTileTint }> = {
  payment: { label: 'Payment', icon: <IconCreditCard />, badgeTone: 'success', tileTint: 'success' },
  security: { label: 'Security', icon: <IconShieldCheck />, badgeTone: 'danger', tileTint: 'danger' },
  policy: { label: 'Policy', icon: <IconFileText />, badgeTone: 'info', tileTint: 'info' },
  reminder: { label: 'Reminder', icon: <IconAlarm />, badgeTone: 'warning', tileTint: 'warning' },
};

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'payment', label: 'Payment' },
  { id: 'security', label: 'Security' },
  { id: 'policy', label: 'Policy' },
  { id: 'reminder', label: 'Reminder' },
];

export default function Screen() {
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);
  const [filter, setFilter] = useState<Filter>('all');

  const unreadCount = notifications.filter((n) => n.unread).length;

  const filtered = useMemo(
    () => (filter === 'all' ? notifications : notifications.filter((n) => n.type === filter)),
    [notifications, filter],
  );

  const today = filtered.filter((n) => n.group === 'today');
  const earlier = filtered.filter((n) => n.group === 'earlier');

  function markAsRead(id: string) {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, unread: false } : n)));
  }

  function markAllAsRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
  }

  return (
    <div className={styles.screen}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Notifications</h1>
          <p className={styles.subtitle}>
            {unreadCount > 0 ? `${unreadCount} unread` : 'You are all caught up'}
          </p>
        </div>
        <Button variant="outline" onPress={markAllAsRead} isDisabled={unreadCount === 0}>
          Mark all as read
        </Button>
      </header>

      <ToggleButtonGroup
        aria-label="Filter by type"
        selectionMode="single"
        disallowEmptySelection
        selectedKeys={[filter]}
        onSelectionChange={(keys) => {
          const [next] = Array.from(keys as Set<Filter>);
          if (next) setFilter(next);
        }}
        className={styles.filters}
      >
        {FILTERS.map((f) => (
          <ToggleButton key={f.id} id={f.id}>
            {f.label}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>

      {today.length === 0 && earlier.length === 0 ? (
        <div className={styles.empty}>
          <IconTile size="lg" tint="none" alt="">
            <IconInbox />
          </IconTile>
          <p className={styles.emptyTitle}>No notifications</p>
          <p className={styles.emptyDescription}>Nothing in this category right now.</p>
        </div>
      ) : (
        <>
          {today.length > 0 && (
            <NotificationGroup title="Today" items={today} onMarkAsRead={markAsRead} />
          )}
          {earlier.length > 0 && (
            <NotificationGroup title="Earlier" items={earlier} onMarkAsRead={markAsRead} />
          )}
        </>
      )}
    </div>
  );
}

function NotificationGroup({
  title,
  items,
  onMarkAsRead,
}: {
  title: string;
  items: Notification[];
  onMarkAsRead: (id: string) => void;
}) {
  return (
    <section className={styles.group}>
      <h2 className={styles.groupTitle}>{title}</h2>
      <ul className={styles.list}>
        {items.map((item, index) => (
          <li key={item.id}>
            <NotificationRow item={item} onMarkAsRead={onMarkAsRead} />
            {index < items.length - 1 && <Separator />}
          </li>
        ))}
      </ul>
    </section>
  );
}

function NotificationRow({ item, onMarkAsRead }: { item: Notification; onMarkAsRead: (id: string) => void }) {
  const meta = TYPE_META[item.type];
  return (
    <div className={item.unread ? `${styles.row} ${styles.rowUnread}` : styles.row}>
      <IconTile tint={meta.tileTint} alt="">
        {meta.icon}
      </IconTile>
      <div className={styles.rowBody}>
        <div className={styles.rowTop}>
          <span className={styles.rowTitle}>
            {item.unread && <span className={styles.unreadDot} aria-hidden="true" />}
            {item.title}
          </span>
          <span className={styles.rowTime}>{item.time}</span>
        </div>
        <p className={styles.rowDetail}>{item.detail}</p>
        <div className={styles.rowMeta}>
          <Badge tone={meta.badgeTone} variant="soft" size="sm">
            {meta.label}
          </Badge>
          {item.unread && (
            <Button variant="ghost" size="sm" onPress={() => onMarkAsRead(item.id)}>
              <IconCheck />
              Mark as read
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

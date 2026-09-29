import { useState } from 'react';
import { Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle, IconTile } from '@syntara/react';
import {
  IconAlertTriangle,
  IconCalendarEvent,
  IconCircleCheck,
  IconCloudUpload,
  IconFileText,
  IconPencil,
  IconSend,
  IconUserPlus,
} from '@syntara/icons';
import styles from './Screen.module.css';

interface ClaimEvent {
  id: string;
  dateTime: string;
  time: string;
  actor: string;
  role: string;
  description: string;
  icon: React.ReactNode;
  current?: boolean;
  actionRequired?: boolean;
}

const events: ClaimEvent[] = [
  {
    id: 'signature',
    dateTime: '2026-09-28T09:40:00',
    time: 'Today, 9:40 AM',
    actor: 'Claims team',
    role: 'Insurer',
    description: 'Requested your signature on the settlement release',
    icon: <IconPencil aria-hidden />,
    current: true,
    actionRequired: true,
  },
  {
    id: 'settlement-approved',
    dateTime: '2026-09-25T15:15:00',
    time: '25 Sep, 3:15 PM',
    actor: 'Priya Iyer',
    role: 'Claims adjuster',
    description: 'Approved a settlement of ₹48,500',
    icon: <IconCircleCheck aria-hidden />,
  },
  {
    id: 'inspection-completed',
    dateTime: '2026-09-22T11:30:00',
    time: '22 Sep, 11:30 AM',
    actor: 'Priya Iyer',
    role: 'Claims adjuster',
    description: 'Completed the site inspection and filed the report',
    icon: <IconFileText aria-hidden />,
  },
  {
    id: 'inspection-scheduled',
    dateTime: '2026-09-18T09:00:00',
    time: '18 Sep, 9:00 AM',
    actor: 'Ops team',
    role: 'Insurer',
    description: 'Scheduled a site inspection for 22 September',
    icon: <IconCalendarEvent aria-hidden />,
  },
  {
    id: 'assigned',
    dateTime: '2026-09-15T14:20:00',
    time: '15 Sep, 2:20 PM',
    actor: 'System',
    role: 'Automated',
    description: 'Assigned the claim to adjuster Priya Iyer',
    icon: <IconUserPlus aria-hidden />,
  },
  {
    id: 'documents-uploaded',
    dateTime: '2026-09-14T18:05:00',
    time: '14 Sep, 6:05 PM',
    actor: 'Rahul Sen',
    role: 'Policyholder',
    description: 'Uploaded photos and a repair estimate',
    icon: <IconCloudUpload aria-hidden />,
  },
  {
    id: 'submitted',
    dateTime: '2026-09-14T09:12:00',
    time: '14 Sep, 9:12 AM',
    actor: 'Rahul Sen',
    role: 'Policyholder',
    description: 'Submitted claim CLM-2024-08931 for vehicle damage',
    icon: <IconSend aria-hidden />,
  },
];

export default function Screen() {
  const [isSigning, setIsSigning] = useState(false);
  const [signed, setSigned] = useState(false);

  const handleSign = () => {
    setIsSigning(true);
    window.setTimeout(() => {
      setIsSigning(false);
      setSigned(true);
    }, 900);
  };

  return (
    <div className={styles.page}>
      <Card className={styles.card}>
        <CardHeader>
          <CardTitle>Claim activity</CardTitle>
          <CardDescription>Claim CLM-2024-08931 · Vehicle damage</CardDescription>
        </CardHeader>
        <CardContent>
          <ol className={styles.timeline} aria-label="Claim activity, newest first">
            {events.map((event, index) => {
              const isLast = index === events.length - 1;
              return (
                <li key={event.id} className={styles.item}>
                  <div className={styles.markerColumn}>
                    <IconTile tint={event.current ? 'brand' : 'none'} size="sm">
                      {event.icon}
                    </IconTile>
                    {!isLast && <div className={styles.connector} aria-hidden="true" />}
                  </div>
                  <div className={styles.content}>
                    <div className={styles.metaRow}>
                      <time className={styles.time} dateTime={event.dateTime}>
                        {event.time}
                      </time>
                      {event.current && (
                        <Badge variant="status" tone="info">
                          Current stage
                        </Badge>
                      )}
                    </div>
                    <p className={styles.description}>
                      <span className={styles.actor}>{event.actor}</span>
                      <span className={styles.role}> · {event.role}</span>
                      <br />
                      {event.description}
                    </p>
                    {event.actionRequired && (
                      <div className={styles.actionRow}>
                        {signed ? (
                          <Badge tone="success" icon={<IconCircleCheck aria-hidden />}>
                            Signed
                          </Badge>
                        ) : (
                          <>
                            <Badge tone="warning" icon={<IconAlertTriangle aria-hidden />}>
                              Action needed
                            </Badge>
                            <Button size="sm" isPending={isSigning} onPress={handleSign}>
                              Review and sign
                            </Button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}

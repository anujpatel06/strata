import { useState } from 'react';
import type { JSX, ReactNode } from 'react';
import {
  Avatar,
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  IconTile,
  type IconTileTint,
} from '@strata/react';
import {
  IconCircleCheck,
  IconFileText,
  IconMail,
  IconShieldCheck,
  IconCalendarEvent,
  IconUser,
  IconUpload,
} from '@strata/icons';
import styles from './Screen.module.css';

interface TimelineEvent {
  id: string;
  time: string;
  actorName: string;
  actorRole: string;
  description: string;
  icon: ReactNode;
  tint: IconTileTint;
  current?: boolean;
  action?: {
    label: string;
    doneLabel: string;
  };
}

const CLAIM = {
  reference: 'CLM-2026-04831',
  summary: 'Motor claim · Comprehensive cover',
};

// Newest first: this is how the timeline is meant to be read and rendered.
const EVENTS: TimelineEvent[] = [
  {
    id: 'documents-requested',
    time: 'Today, 9:40 am',
    actorName: 'Ananya Iyer',
    actorRole: 'Claims handler',
    description:
      "Requested the garage's final repair estimate. Upload it to keep your claim moving.",
    icon: <IconUpload />,
    tint: 'warning',
    current: true,
    action: { label: 'Upload estimate', doneLabel: 'Estimate uploaded' },
  },
  {
    id: 'inspection-completed',
    time: 'Yesterday, 4:15 pm',
    actorName: 'Marcus Bell',
    actorRole: 'Field assessor',
    description: 'Completed the on-site inspection of your vehicle and logged the damage assessment.',
    icon: <IconCircleCheck />,
    tint: 'success',
  },
  {
    id: 'inspection-scheduled',
    time: '26 Sep, 11:00 am',
    actorName: 'Ananya Iyer',
    actorRole: 'Claims handler',
    description: 'Scheduled a vehicle inspection with a field assessor for 27 September.',
    icon: <IconCalendarEvent />,
    tint: 'info',
  },
  {
    id: 'claim-assigned',
    time: '26 Sep, 9:05 am',
    actorName: 'Strata Claims',
    actorRole: 'System',
    description: 'Assigned the claim to Ananya Iyer for handling.',
    icon: <IconUser />,
    tint: 'accent',
  },
  {
    id: 'coverage-verified',
    time: '25 Sep, 3:30 pm',
    actorName: 'Ananya Iyer',
    actorRole: 'Claims handler',
    description: 'Verified your policy coverage and confirmed the claim is eligible for assessment.',
    icon: <IconShieldCheck />,
    tint: 'success',
  },
  {
    id: 'receipt-confirmed',
    time: '24 Sep, 6:12 pm',
    actorName: 'Strata Claims',
    actorRole: 'System',
    description: 'Confirmed receipt of the claim and sent a copy to your registered email.',
    icon: <IconMail />,
    tint: 'none',
  },
  {
    id: 'claim-submitted',
    time: '24 Sep, 6:00 pm',
    actorName: 'Rohan Verma',
    actorRole: 'You',
    description: 'Submitted a claim for a collision on MG Road, Bengaluru.',
    icon: <IconFileText />,
    tint: 'none',
  },
];

export default function Screen(): JSX.Element {
  const [completedActions, setCompletedActions] = useState<Set<string>>(new Set());

  return (
    <Card className={styles.card}>
      <CardHeader divider>
        <CardTitle level={1}>Claim {CLAIM.reference}</CardTitle>
        <CardDescription>{CLAIM.summary}</CardDescription>
      </CardHeader>
      <CardContent>
        <ol className={styles.timeline} aria-label="Claim activity timeline, newest first">
          {EVENTS.map((event, index) => {
            const isLast = index === EVENTS.length - 1;
            const isDone = completedActions.has(event.id);

            return (
              <li key={event.id} className={styles.item}>
                <div className={styles.rail}>
                  <IconTile tint={event.tint} size="sm" alt="">
                    {event.icon}
                  </IconTile>
                  {!isLast && <div className={styles.line} />}
                </div>
                <div className={event.current ? `${styles.content} ${styles.currentContent}` : styles.content}>
                  <div className={styles.meta}>
                    <div className={styles.person}>
                      <Avatar name={event.actorName} size="sm" />
                      <span>
                        <span className={styles.actorName}>{event.actorName}</span>
                        <span className={styles.actorRole}> · {event.actorRole}</span>
                      </span>
                      {event.current && (
                        <Badge tone="brand" variant="soft" size="sm" dot>
                          Current stage
                        </Badge>
                      )}
                    </div>
                    <span className={styles.time}>{event.time}</span>
                  </div>
                  <p className={styles.description}>{event.description}</p>
                  {event.action && (
                    <div className={styles.actionRow}>
                      {isDone ? (
                        <Badge tone="success" variant="soft" size="sm" dot>
                          {event.action.doneLabel}
                        </Badge>
                      ) : (
                        <Button
                          variant="primary"
                          size="sm"
                          onPress={() =>
                            setCompletedActions((prev) => new Set(prev).add(event.id))
                          }
                        >
                          {event.action.label}
                        </Button>
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
  );
}

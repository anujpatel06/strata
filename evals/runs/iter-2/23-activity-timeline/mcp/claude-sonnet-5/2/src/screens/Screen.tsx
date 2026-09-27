import { useId, useState, type JSX } from 'react';
import { Avatar, Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Eyebrow } from '@strata/react';
import { IconCircleCheck, IconClock } from '@strata/icons';
import styles from './Screen.module.css';

interface ClaimEvent {
  id: string;
  dateTime: string;
  time: string;
  title: string;
  description: string;
  actorName: string;
  actorRole: string;
  isCurrentStage: boolean;
  needsAction: boolean;
  actionLabel?: string;
}

/** Newest first: this is display order and reading order for the timeline. */
const events: ClaimEvent[] = [
  {
    id: 'estimate-requested',
    dateTime: '2026-09-28T09:14:00',
    time: 'Today · 9:14 AM',
    title: 'Repair estimate requested',
    description: 'Maria asked for a repair estimate from your shop before she can approve the claim.',
    actorName: 'Maria Chen',
    actorRole: 'Claims adjuster',
    isCurrentStage: true,
    needsAction: true,
    actionLabel: 'Upload repair estimate',
  },
  {
    id: 'inspection-completed',
    dateTime: '2026-09-26T15:40:00',
    time: '26 Sep · 3:40 PM',
    title: 'Inspection completed',
    description: 'The vehicle inspection is complete. Maria is preparing the estimate review.',
    actorName: 'Maria Chen',
    actorRole: 'Claims adjuster',
    isCurrentStage: false,
    needsAction: false,
  },
  {
    id: 'inspection-scheduled',
    dateTime: '2026-09-24T10:00:00',
    time: '24 Sep · 10:00 AM',
    title: 'Inspection scheduled',
    description: 'An inspection was booked at Downtown Auto Body for 26 September.',
    actorName: 'Maria Chen',
    actorRole: 'Claims adjuster',
    isCurrentStage: false,
    needsAction: false,
  },
  {
    id: 'adjuster-assigned',
    dateTime: '2026-09-22T14:15:00',
    time: '22 Sep · 2:15 PM',
    title: 'Adjuster assigned',
    description: 'Maria Chen was assigned to handle your claim.',
    actorName: 'Claims team',
    actorRole: 'System',
    isCurrentStage: false,
    needsAction: false,
  },
  {
    id: 'documents-verified',
    dateTime: '2026-09-20T11:05:00',
    time: '20 Sep · 11:05 AM',
    title: 'Documents verified',
    description: 'Your policy details and incident report were verified.',
    actorName: 'Priya Nair',
    actorRole: 'Claims support',
    isCurrentStage: false,
    needsAction: false,
  },
  {
    id: 'photos-uploaded',
    dateTime: '2026-09-19T16:50:00',
    time: '19 Sep · 4:50 PM',
    title: 'Photos uploaded',
    description: 'Four photos of the damage were added to the claim.',
    actorName: 'Alex Morgan',
    actorRole: 'Policyholder',
    isCurrentStage: false,
    needsAction: false,
  },
  {
    id: 'claim-submitted',
    dateTime: '2026-09-18T09:02:00',
    time: '18 Sep · 9:02 AM',
    title: 'Claim submitted',
    description: 'The claim for rear-end collision damage was submitted online.',
    actorName: 'Alex Morgan',
    actorRole: 'Policyholder',
    isCurrentStage: false,
    needsAction: false,
  },
];

export default function Screen(): JSX.Element {
  const uid = useId();
  const [resolvedIds, setResolvedIds] = useState<ReadonlySet<string>>(new Set());

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <Eyebrow>Claim #AC-48213</Eyebrow>
        <h1 className={styles.title}>Claim activity</h1>
        <p className={styles.subtitle}>2019 Honda CR-V · Rear-end collision damage</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle level={2} id={`${uid}-timeline`}>
            Timeline
          </CardTitle>
          <CardDescription>Newest first</CardDescription>
        </CardHeader>
        <CardContent>
          <ol className={styles.timeline} aria-labelledby={`${uid}-timeline`}>
            {events.map((event) => {
              const resolved = resolvedIds.has(event.id);
              return (
                <li key={event.id} className={styles.item}>
                  <div className={styles.marker} aria-hidden="true">
                    <span className={styles.dot} data-current={event.isCurrentStage || undefined}>
                      {event.isCurrentStage ? <IconClock /> : <IconCircleCheck />}
                    </span>
                  </div>
                  <div className={styles.body}>
                    <div className={styles.meta}>
                      <time className={styles.time} dateTime={event.dateTime}>
                        {event.time}
                      </time>
                      {event.isCurrentStage && (
                        <Badge tone="warning" variant="status">
                          Current stage
                        </Badge>
                      )}
                    </div>
                    <h3 className={styles.eventTitle}>{event.title}</h3>
                    <p className={styles.description}>{event.description}</p>
                    <div className={styles.actor}>
                      <Avatar name={event.actorName} alt="" size="sm" />
                      <span className={styles.actorText}>
                        {event.actorName} · {event.actorRole}
                      </span>
                    </div>
                    {event.needsAction && (
                      <div className={styles.action}>
                        {resolved ? (
                          <Badge tone="success" icon={<IconCircleCheck aria-hidden />}>
                            Estimate uploaded
                          </Badge>
                        ) : (
                          <Button
                            variant="primary"
                            size="sm"
                            onPress={() => setResolvedIds((prev) => new Set(prev).add(event.id))}
                          >
                            {event.actionLabel}
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
    </div>
  );
}

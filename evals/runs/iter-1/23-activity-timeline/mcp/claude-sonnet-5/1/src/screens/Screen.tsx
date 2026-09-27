import {
  Badge,
  Button,
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  IconTile,
  PersonChip,
} from '@strata/react';
import { IconRobot } from '@strata/icons';
import styles from './Screen.module.css';

type Actor =
  | { kind: 'person'; name: string; role: string }
  | { kind: 'system' };

interface ClaimEvent {
  id: string;
  dateTime: string;
  timeLabel: string;
  actor: Actor;
  summary: string;
  isCurrentStage?: boolean;
  action?: string;
}

const events: ClaimEvent[] = [
  {
    id: 'evt-7',
    dateTime: '2026-09-27T10:12:00+04:00',
    timeLabel: 'Today, 10:12 am',
    actor: { kind: 'person', name: 'Meera Iyer', role: 'Claims examiner' },
    summary: 'Requested a repair estimate and photos of the damage before the claim can move forward.',
    isCurrentStage: true,
    action: 'Upload documents',
  },
  {
    id: 'evt-6',
    dateTime: '2026-09-26T16:45:00+04:00',
    timeLabel: 'Yesterday, 4:45 pm',
    actor: { kind: 'system' },
    summary: 'Claim moved to under review.',
  },
  {
    id: 'evt-5',
    dateTime: '2026-09-26T14:20:00+04:00',
    timeLabel: 'Yesterday, 2:20 pm',
    actor: { kind: 'person', name: 'Meera Iyer', role: 'Claims examiner' },
    summary: 'Completed the initial assessment of the claim.',
  },
  {
    id: 'evt-4',
    dateTime: '2026-09-24T11:00:00+04:00',
    timeLabel: 'Thu, 11:00 am',
    actor: { kind: 'person', name: 'Rohan Verma', role: 'Policyholder' },
    summary: 'Submitted photos of the vehicle damage.',
  },
  {
    id: 'evt-3',
    dateTime: '2026-09-23T09:30:00+04:00',
    timeLabel: 'Wed, 9:30 am',
    actor: { kind: 'system' },
    summary: 'Assigned the claim to Meera Iyer.',
  },
  {
    id: 'evt-2',
    dateTime: '2026-09-22T18:15:00+04:00',
    timeLabel: 'Tue, 6:15 pm',
    actor: { kind: 'person', name: 'Rohan Verma', role: 'Policyholder' },
    summary: 'Added a description of how the incident happened.',
  },
  {
    id: 'evt-1',
    dateTime: '2026-09-22T18:02:00+04:00',
    timeLabel: 'Tue, 6:02 pm',
    actor: { kind: 'person', name: 'Rohan Verma', role: 'Policyholder' },
    summary: 'Filed a claim for vehicle damage.',
  },
];

export default function Screen() {
  return (
    <div className={styles.page}>
      <Card className={styles.card} role="region" aria-labelledby="claim-activity-title">
        <CardHeader divider>
          <CardTitle id="claim-activity-title">Claim activity</CardTitle>
          <CardDescription>Claim CLM-2049183 · Vehicle damage</CardDescription>
          <CardAction>
            <Badge tone="info">Under review</Badge>
          </CardAction>
        </CardHeader>
        <CardContent variant="inset">
          <ol className={styles.timeline}>
            {events.map((event, index) => (
              <li key={event.id} className={styles.item}>
                <div className={styles.rail} aria-hidden="true">
                  <span
                    className={styles.dot}
                    data-current={event.isCurrentStage ? 'true' : undefined}
                  />
                  {index < events.length - 1 && <span className={styles.line} />}
                </div>
                <div className={styles.body}>
                  <div className={styles.meta}>
                    <time className={styles.time} dateTime={event.dateTime}>
                      {event.timeLabel}
                    </time>
                    {event.isCurrentStage && (
                      <Badge variant="status" tone="brand">
                        Current stage
                      </Badge>
                    )}
                  </div>
                  <p className={styles.summary}>{event.summary}</p>
                  <div className={styles.footer}>
                    {event.actor.kind === 'person' ? (
                      <div className={styles.actor}>
                        <PersonChip size="sm" name={event.actor.name} />
                        <span className={styles.role}>{event.actor.role}</span>
                      </div>
                    ) : (
                      <div className={styles.actor}>
                        <IconTile size="sm" tint="none">
                          <IconRobot />
                        </IconTile>
                        <span className={styles.role}>System</span>
                      </div>
                    )}
                    {event.action && (
                      <Button size="sm" onPress={() => {}}>
                        {event.action}
                      </Button>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}

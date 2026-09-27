import { useState } from 'react';
import {
  Avatar,
  Badge,
  Button,
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  IconTile,
} from '@strata/react';
import { IconAlertCircle, IconCircleCheck, IconUpload } from '@strata/icons';
import styles from './Screen.module.css';

type ClaimEvent = {
  id: string;
  time: string;
  actor: string;
  role: string;
  description: string;
  isCurrent?: boolean;
  needsAction?: boolean;
};

// Newest first: this is how the claim's history reads on the page.
const events: ClaimEvent[] = [
  {
    id: 'evt-7',
    time: 'Today, 10:32 AM',
    actor: 'Claims desk',
    role: 'Mumbai claims team',
    description: 'Requested the repair invoice and photos of the damage before they can approve the payout.',
    isCurrent: true,
    needsAction: true,
  },
  {
    id: 'evt-6',
    time: 'Sep 24, 3:15 PM',
    actor: 'Meera Iyer',
    role: 'Surveyor',
    description: 'Filed the damage report after inspecting the vehicle at Highline Motors.',
  },
  {
    id: 'evt-5',
    time: 'Sep 22, 9:00 AM',
    actor: 'Meera Iyer',
    role: 'Surveyor',
    description: 'Visited the garage to inspect the vehicle and assess the damage.',
  },
  {
    id: 'evt-4',
    time: 'Sep 20, 11:47 AM',
    actor: 'Claims desk',
    role: 'Mumbai claims team',
    description: 'Verified the policy and confirmed coverage for this claim.',
  },
  {
    id: 'evt-3',
    time: 'Sep 19, 4:05 PM',
    actor: 'System',
    role: 'Automated routing',
    description: 'Assigned the claim to the Mumbai claims desk for review.',
  },
  {
    id: 'evt-2',
    time: 'Sep 18, 2:30 PM',
    actor: 'Claims desk',
    role: 'Mumbai claims team',
    description: 'Acknowledged the claim and issued reference number CLM-208734.',
  },
  {
    id: 'evt-1',
    time: 'Sep 18, 9:12 AM',
    actor: 'Rohan Mehta',
    role: 'Policyholder',
    description: 'Reported the incident and filed a new claim for accidental damage.',
  },
];

export default function Screen() {
  const [uploadState, setUploadState] = useState<'idle' | 'pending' | 'done'>('idle');

  return (
    <Card className={styles.card}>
      <CardHeader divider>
        <CardTitle>Claim activity</CardTitle>
        <CardDescription>Claim CLM-208734 · Accidental damage</CardDescription>
        <CardAction>
          <Badge tone="info">In review</Badge>
        </CardAction>
      </CardHeader>
      <CardContent>
        <ol className={styles.list}>
          {events.map((event, index) => (
            <li key={event.id} className={styles.item}>
              <div className={styles.markerCol}>
                <IconTile
                  size="sm"
                  tint={event.isCurrent ? 'warning' : 'success'}
                  alt={event.isCurrent ? 'Current stage' : 'Completed'}
                >
                  {event.isCurrent ? <IconAlertCircle /> : <IconCircleCheck />}
                </IconTile>
                {index < events.length - 1 && <div className={styles.connector} />}
              </div>
              <div className={styles.body}>
                <div className={styles.metaRow}>
                  <span className={styles.time}>{event.time}</span>
                  {event.isCurrent && <Badge tone="info" size="sm">Current stage</Badge>}
                  {event.needsAction && uploadState !== 'done' && (
                    <Badge tone="warning" size="sm">Action needed</Badge>
                  )}
                </div>
                <div className={styles.actorRow}>
                  <Avatar name={event.actor} size="sm" alt="" />
                  <span className={styles.actorName}>{event.actor}</span>
                  <span className={styles.actorRole}>{event.role}</span>
                </div>
                <p className={styles.description}>{event.description}</p>
                {event.needsAction && (
                  <div className={styles.actions}>
                    {uploadState === 'done' ? (
                      <Badge tone="success" icon={<IconCircleCheck aria-hidden />}>
                        Documents uploaded
                      </Badge>
                    ) : (
                      <Button
                        size="sm"
                        isPending={uploadState === 'pending'}
                        onPress={() => {
                          setUploadState('pending');
                          setTimeout(() => setUploadState('done'), 900);
                        }}
                      >
                        <IconUpload aria-hidden /> Upload documents
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  );
}

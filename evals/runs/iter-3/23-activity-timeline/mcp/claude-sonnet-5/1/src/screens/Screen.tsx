import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  IconTile,
} from '@syntara/react';
import {
  IconFileText,
  IconLayoutList,
  IconMessageDots,
  IconSearch,
  IconShieldCheck,
  IconUpload,
  IconUserPlus,
} from '@syntara/icons';
import type { ReactNode } from 'react';
import styles from './Screen.module.css';

type ClaimEvent = {
  id: string;
  date: string;
  time: string;
  title: string;
  description: string;
  actor: string;
  role: string;
  icon: ReactNode;
  isCurrent?: boolean;
  needsAction?: boolean;
};

// No Timeline component exists in Syntara yet: this list is built from
// IconTile, Badge and Button, with the connector line as one-off CSS.
const events: ClaimEvent[] = [
  {
    id: 'documents-requested',
    date: 'Today',
    time: '9:12 AM',
    title: 'Requested additional documents',
    description: 'Asked for a repair estimate and two more photos of the damage before the claim can proceed.',
    actor: 'Priya Raman',
    role: 'Claims Assessor',
    icon: <IconMessageDots aria-hidden />,
    isCurrent: true,
    needsAction: true,
  },
  {
    id: 'inspection-completed',
    date: 'Yesterday',
    time: '3:40 PM',
    title: 'Completed the site inspection',
    description: 'Inspected the vehicle at the registered repair shop and logged the damage assessment.',
    actor: 'Daniel Okafor',
    role: 'Field Assessor',
    icon: <IconSearch aria-hidden />,
  },
  {
    id: 'assessor-assigned',
    date: 'Mon, 24 Mar',
    time: '11:02 AM',
    title: 'Assigned an assessor to the claim',
    description: 'Priya Raman was assigned to review and process this claim.',
    actor: 'Claims Support Team',
    role: 'System',
    icon: <IconUserPlus aria-hidden />,
  },
  {
    id: 'claim-acknowledged',
    date: 'Sat, 22 Mar',
    time: '4:15 PM',
    title: 'Acknowledged the claim',
    description: 'Confirmed receipt and started the review.',
    actor: 'Claims Support Team',
    role: 'System',
    icon: <IconShieldCheck aria-hidden />,
  },
  {
    id: 'photos-uploaded',
    date: 'Fri, 21 Mar',
    time: '2:30 PM',
    title: 'Uploaded supporting photos',
    description: 'Added four photos of the damage to the vehicle.',
    actor: 'You',
    role: 'Policyholder',
    icon: <IconUpload aria-hidden />,
  },
  {
    id: 'initial-review',
    date: 'Thu, 20 Mar',
    time: '10:05 AM',
    title: 'Completed initial review',
    description: 'Checked the claim for completeness and confirmed the policy is active.',
    actor: 'Mei Lin',
    role: 'Claims Handler',
    icon: <IconLayoutList aria-hidden />,
  },
  {
    id: 'claim-submitted',
    date: 'Wed, 19 Mar',
    time: '9:00 AM',
    title: 'Submitted the claim',
    description: 'Filed a claim for collision damage under policy POL-48213.',
    actor: 'You',
    role: 'Policyholder',
    icon: <IconFileText aria-hidden />,
  },
];

export default function Screen() {
  return (
    <Card className={styles.card}>
      <CardHeader>
        <CardTitle>Claim activity</CardTitle>
        <CardDescription>Claim CLM-48213 · Auto collision</CardDescription>
      </CardHeader>
      <CardContent>
        <ol className={styles.timeline} aria-label="Claim activity, newest first">
          {events.map((event) => (
            <li
              key={event.id}
              className={styles.event}
              aria-current={event.isCurrent ? 'step' : undefined}
            >
              <div className={styles.marker}>
                <IconTile
                  tint={event.isCurrent ? 'brand' : 'none'}
                  size="sm"
                >
                  {event.icon}
                </IconTile>
                <div className={styles.connector} aria-hidden="true" />
              </div>
              <div className={styles.body}>
                <div className={styles.meta}>
                  <span className={styles.timestamp}>
                    {event.date} · {event.time}
                  </span>
                  {event.isCurrent && (
                    <Badge variant="status" tone="info">
                      Current stage
                    </Badge>
                  )}
                  {event.needsAction && (
                    <Badge variant="status" tone="warning">
                      Action needed
                    </Badge>
                  )}
                </div>
                <p className={styles.title}>{event.title}</p>
                <p className={styles.description}>{event.description}</p>
                <p className={styles.actor}>
                  {event.actor} <span className={styles.role}>· {event.role}</span>
                </p>
                {event.needsAction && (
                  <div className={styles.action}>
                    <Button size="sm">Upload documents</Button>
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

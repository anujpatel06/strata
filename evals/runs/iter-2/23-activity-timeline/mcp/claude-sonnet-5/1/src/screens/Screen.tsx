'use client';

/**
 * Claim activity timeline. Strata has no dedicated timeline component (checked via list_components),
 * so this is built from Card, Avatar, Badge and Button — the closest existing pieces — with icon
 * markers and a hairline connector drawn in CSS. That gap (a Timeline component) belongs to the
 * system, not here.
 */

import { Avatar, Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@strata/react';
import {
  IconAlertTriangle,
  IconClipboardCheck,
  IconFileText,
  IconPhoto,
  IconSearch,
  IconShieldCheck,
  IconUserPlus,
} from '@strata/icons';
import type { ReactNode } from 'react';
import styles from './Screen.module.css';

interface ClaimEvent {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  actorName: string;
  actorRole: string;
  icon: ReactNode;
  isCurrent?: boolean;
  needsAction?: {
    label: string;
  };
}

const claim = {
  reference: 'CLM-2026-004821',
  summary: 'Vehicle damage claim',
};

// Newest first. Timestamps are ISO strings formatted with Intl below.
const events: ClaimEvent[] = [
  {
    id: 'documents-requested',
    title: 'Additional documents requested',
    description: 'A copy of the repair estimate is needed before the claim can move to settlement.',
    timestamp: '2026-09-27T10:05:00Z',
    actorName: 'Priya Nair',
    actorRole: 'Loss adjuster',
    icon: <IconAlertTriangle aria-hidden />,
    isCurrent: true,
    needsAction: { label: 'Upload repair estimate' },
  },
  {
    id: 'inspection-completed',
    title: 'Vehicle inspection completed',
    description: 'Inspection of the vehicle was completed at the approved garage.',
    timestamp: '2026-09-25T16:30:00Z',
    actorName: 'Priya Nair',
    actorRole: 'Loss adjuster',
    icon: <IconSearch aria-hidden />,
  },
  {
    id: 'adjuster-assigned',
    title: 'Loss adjuster assigned',
    description: 'Priya Nair was assigned to assess the reported damage.',
    timestamp: '2026-09-23T14:15:00Z',
    actorName: 'Claims team',
    actorRole: 'Insurer',
    icon: <IconUserPlus aria-hidden />,
  },
  {
    id: 'photos-uploaded',
    title: 'Photos uploaded',
    description: 'Four photos of the damage were added to the claim.',
    timestamp: '2026-09-21T08:47:00Z',
    actorName: 'Anuj Patel',
    actorRole: 'Policyholder',
    icon: <IconPhoto aria-hidden />,
  },
  {
    id: 'claim-acknowledged',
    title: 'Claim acknowledged',
    description: `Claim received and assigned reference ${claim.reference}.`,
    timestamp: '2026-09-20T11:02:00Z',
    actorName: 'Claims team',
    actorRole: 'Insurer',
    icon: <IconClipboardCheck aria-hidden />,
  },
  {
    id: 'policy-verified',
    title: 'Policy verified',
    description: 'Policy AX-2291 was confirmed active for the reported date.',
    timestamp: '2026-09-20T09:20:00Z',
    actorName: 'Claims team',
    actorRole: 'Insurer',
    icon: <IconShieldCheck aria-hidden />,
  },
  {
    id: 'incident-reported',
    title: 'Incident reported',
    description: 'The incident was reported through the mobile app.',
    timestamp: '2026-09-20T09:14:00Z',
    actorName: 'Anuj Patel',
    actorRole: 'Policyholder',
    icon: <IconFileText aria-hidden />,
  },
];

const dateFormatter = new Intl.DateTimeFormat('en-IN', {
  day: 'numeric',
  month: 'short',
  hour: 'numeric',
  minute: '2-digit',
});

function formatTimestamp(iso: string): string {
  return dateFormatter.format(new Date(iso));
}

export default function Screen() {
  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <h1 className={styles.title}>Claim activity</h1>
        <p className={styles.subtitle}>
          {claim.summary} · Reference {claim.reference}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle level={2}>Timeline</CardTitle>
          <CardDescription>Newest events first.</CardDescription>
        </CardHeader>
        <CardContent>
          <ol className={styles.timeline} aria-label="Claim activity timeline">
            {events.map((event) => (
              <li key={event.id} className={styles.event}>
                <div className={styles.marker}>
                  <span
                    className={[
                      styles.markerIcon,
                      event.isCurrent ? styles.markerIconCurrent : styles.markerIconDone,
                    ].join(' ')}
                    aria-hidden="true"
                  >
                    {event.icon}
                  </span>
                  <span className={styles.markerLine} aria-hidden="true" />
                </div>

                <div className={styles.eventBody}>
                  <div className={styles.eventHeadline}>
                    <h3 className={styles.eventTitle}>{event.title}</h3>
                    {event.isCurrent && (
                      <Badge tone="brand" variant="soft">
                        Current stage
                      </Badge>
                    )}
                  </div>

                  <div className={styles.eventMeta}>
                    <time dateTime={event.timestamp}>{formatTimestamp(event.timestamp)}</time>
                    <span className={styles.metaSeparator} aria-hidden="true">
                      ·
                    </span>
                    <span className={styles.actor}>
                      <Avatar name={event.actorName} alt="" size="sm" />
                      {event.actorName}, {event.actorRole}
                    </span>
                  </div>

                  <p className={styles.eventDescription}>{event.description}</p>

                  {event.needsAction && (
                    <div className={styles.eventAction}>
                      <Badge tone="warning" variant="status">
                        Action needed
                      </Badge>
                      <Button size="sm">{event.needsAction.label}</Button>
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}

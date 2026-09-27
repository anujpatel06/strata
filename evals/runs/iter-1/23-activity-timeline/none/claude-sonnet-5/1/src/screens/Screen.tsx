import { useState } from 'react';
import styles from './Screen.module.css';

type ActivityEvent = {
  id: string;
  day: string;
  time: string;
  actorName: string;
  actorRole: string;
  description: string;
  isCurrentStage?: boolean;
  action?: { label: string; completedLabel: string };
};

const claim = {
  number: 'CLM-208441',
  title: 'Rear-end collision · Vehicle damage repair',
  vehicle: '2022 Honda City · Reg. KA 05 MN 4471',
};

const events: ActivityEvent[] = [
  {
    id: 'evt-7',
    day: 'Today',
    time: '9:14 AM',
    actorName: 'Sana Iyer',
    actorRole: 'Claims Adjuster',
    description:
      'Requested clearer photos of the rear bumper damage before the repair estimate can be finalized.',
    isCurrentStage: true,
    action: { label: 'Upload photos', completedLabel: 'Photos uploaded' },
  },
  {
    id: 'evt-6',
    day: 'Yesterday',
    time: '4:32 PM',
    actorName: 'AutoFix Garage',
    actorRole: 'Repair Shop',
    description: 'Submitted a repair estimate of $2,340 for adjuster review.',
  },
  {
    id: 'evt-5',
    day: 'Thu, 24 Sep',
    time: '11:05 AM',
    actorName: 'Sana Iyer',
    actorRole: 'Claims Adjuster',
    description: 'Confirmed coverage and assigned the claim for inspection.',
  },
  {
    id: 'evt-4',
    day: 'Wed, 23 Sep',
    time: '3:47 PM',
    actorName: 'You',
    actorRole: 'Policyholder',
    description: 'Dropped off the vehicle at AutoFix Garage for inspection.',
  },
  {
    id: 'evt-3',
    day: 'Tue, 22 Sep',
    time: '10:20 AM',
    actorName: 'Claims System',
    actorRole: 'Automated',
    description: 'Police report received and attached to the claim file.',
  },
  {
    id: 'evt-2',
    day: 'Mon, 21 Sep',
    time: '6:02 PM',
    actorName: 'Sana Iyer',
    actorRole: 'Claims Adjuster',
    description: 'Reviewed the initial claim details and requested a copy of the police report.',
  },
  {
    id: 'evt-1',
    day: 'Mon, 21 Sep',
    time: '9:00 AM',
    actorName: 'You',
    actorRole: 'Policyholder',
    description: 'Filed a claim for a rear-end collision on Ring Road.',
  },
];

export default function Screen() {
  const [completedActionIds, setCompletedActionIds] = useState<ReadonlySet<string>>(new Set());

  return (
    <div className={styles.screen}>
      <header className={styles.header}>
        <p className={styles.claimNumber}>Claim {claim.number}</p>
        <h1 className={styles.title}>{claim.title}</h1>
        <p className={styles.vehicle}>{claim.vehicle}</p>
      </header>

      <section aria-labelledby="timeline-heading" className={styles.section}>
        <h2 id="timeline-heading" className={styles.sectionTitle}>
          Activity timeline
        </h2>
        <ol className={styles.timeline}>
          {events.map((event) => {
            const isCompleted = completedActionIds.has(event.id);
            const itemClassName = event.isCurrentStage
              ? `${styles.item} ${styles.itemCurrent}`
              : styles.item;

            return (
              <li key={event.id} className={itemClassName}>
                <div className={styles.markerColumn}>
                  <span className={styles.marker} aria-hidden="true" />
                </div>
                <div className={styles.content}>
                  <div className={styles.meta}>
                    <span className={styles.time}>
                      {event.day} · {event.time}
                    </span>
                    {event.isCurrentStage && (
                      <span className={styles.currentBadge}>Current stage</span>
                    )}
                  </div>
                  <p className={styles.actor}>
                    <span className={styles.actorName}>{event.actorName}</span>
                    <span className={styles.actorRole}> · {event.actorRole}</span>
                  </p>
                  <p className={styles.description}>{event.description}</p>
                  {event.action && (
                    <div className={styles.actionRow}>
                      <button
                        type="button"
                        className={styles.actionButton}
                        disabled={isCompleted}
                        onClick={() =>
                          setCompletedActionIds((prev) => {
                            const next = new Set(prev);
                            next.add(event.id);
                            return next;
                          })
                        }
                      >
                        {isCompleted ? event.action.completedLabel : event.action.label}
                      </button>
                      {isCompleted && (
                        <span className={styles.actionConfirm}>✓ Sent to your adjuster</span>
                      )}
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      </section>
    </div>
  );
}

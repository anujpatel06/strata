import styles from './Screen.module.css';

type EventStatus = 'done' | 'current';

interface ClaimEvent {
  id: string;
  time: string;
  actor: string;
  description: string;
  status: EventStatus;
  actionRequired?: boolean;
  actionLabel?: string;
}

const claim = {
  reference: 'CLM-2049183',
  subject: 'Accidental damage – vehicle claim',
};

// Newest first.
const events: ClaimEvent[] = [
  {
    id: 'evt-7',
    time: 'Today, 10:15 AM',
    actor: 'Priya Nair, Claims Handler',
    description: 'Asked for the repair invoice and photos of the damaged bumper.',
    status: 'current',
    actionRequired: true,
    actionLabel: 'Upload documents',
  },
  {
    id: 'evt-6',
    time: 'Yesterday, 4:42 PM',
    actor: 'System',
    description: 'Moved the claim to Under review.',
    status: 'done',
  },
  {
    id: 'evt-5',
    time: 'Yesterday, 9:20 AM',
    actor: 'Priya Nair, Claims Handler',
    description: 'Picked up your claim for review.',
    status: 'done',
  },
  {
    id: 'evt-4',
    time: '3 days ago, 6:05 PM',
    actor: 'System',
    description: 'Assigned the claim to a claims handler.',
    status: 'done',
  },
  {
    id: 'evt-3',
    time: '3 days ago, 11:30 AM',
    actor: 'Automated check',
    description: 'Verified that your policy is active and covers this type of damage.',
    status: 'done',
  },
  {
    id: 'evt-2',
    time: '4 days ago, 3:15 PM',
    actor: 'You',
    description: 'Added two photos of the damaged bumper.',
    status: 'done',
  },
  {
    id: 'evt-1',
    time: '4 days ago, 2:48 PM',
    actor: 'You',
    description: 'Submitted a new claim for accidental damage to your vehicle.',
    status: 'done',
  },
];

export default function Screen() {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <p className={styles.eyebrow}>Claim {claim.reference}</p>
        <h1 className={styles.title}>{claim.subject}</h1>
      </header>

      <section aria-labelledby="activity-heading" className={styles.card}>
        <h2 id="activity-heading" className={styles.cardTitle}>
          Activity
        </h2>

        <ol className={styles.timeline}>
          {events.map((event) => {
            const isCurrent = event.status === 'current';
            return (
              <li
                key={event.id}
                className={styles.item}
                aria-current={isCurrent ? 'step' : undefined}
              >
                <span
                  className={`${styles.marker} ${isCurrent ? styles.markerCurrent : ''}`}
                  aria-hidden="true"
                />
                <div className={styles.content}>
                  <div className={styles.metaRow}>
                    <span className={styles.time}>{event.time}</span>
                    {isCurrent && <span className={styles.stageBadge}>Current stage</span>}
                  </div>
                  <p className={styles.description}>
                    <span className={styles.actor}>{event.actor}</span> {event.description}
                  </p>
                  {event.actionRequired && (
                    <div className={styles.actionRow}>
                      <span className={styles.actionNote}>Action needed from you</span>
                      <button type="button" className={styles.actionButton}>
                        {event.actionLabel}
                      </button>
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

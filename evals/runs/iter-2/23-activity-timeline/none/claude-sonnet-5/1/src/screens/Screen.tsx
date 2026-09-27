import { useState, type ReactNode } from 'react';
import {
  Alert,
  Avatar,
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Eyebrow,
  IconTile,
  Steps,
} from '@strata/react';
import {
  IconCalendar,
  IconCircleCheck,
  IconFile,
  IconMail,
  IconUpload,
  IconUserPlus,
} from '@strata/icons';
import type { AvatarTone } from '@strata/react';
import styles from './Screen.module.css';

interface TimelineEvent {
  id: string;
  time: string;
  actor: string;
  role: string;
  description: string;
  icon: ReactNode;
  tone: AvatarTone | 'none';
  current?: boolean;
}

const stages = [
  { id: 'filed', label: 'Filed' },
  { id: 'documents', label: 'Documents' },
  { id: 'inspection', label: 'Inspection' },
  { id: 'review', label: 'Review' },
  { id: 'settlement', label: 'Settlement' },
];

// Newest first. Event ids match no backend — this is mock data for the screen only.
const events: TimelineEvent[] = [
  {
    id: 'estimate-requested',
    time: 'Today · 9:40 AM',
    actor: 'Priya Nair',
    role: 'Claims adjuster',
    description: 'Requested the repair estimate for your vehicle.',
    icon: <IconMail />,
    tone: 'warning',
    current: true,
  },
  {
    id: 'moved-to-review',
    time: 'Yesterday · 4:15 PM',
    actor: 'Priya Nair',
    role: 'Claims adjuster',
    description: 'Moved the claim to under review.',
    icon: <IconCircleCheck />,
    tone: 'info',
  },
  {
    id: 'inspection-completed',
    time: 'Fri, 25 Sep · 11:20 AM',
    actor: 'Arjun Mehta',
    role: 'Surveyor',
    description: 'Completed the vehicle inspection at City Motors Garage.',
    icon: <IconCircleCheck />,
    tone: 'success',
  },
  {
    id: 'inspection-scheduled',
    time: 'Thu, 24 Sep · 9:00 AM',
    actor: 'Arjun Mehta',
    role: 'Surveyor',
    description: 'Scheduled the vehicle inspection.',
    icon: <IconCalendar />,
    tone: 'brand',
  },
  {
    id: 'documents-uploaded',
    time: 'Wed, 23 Sep · 6:48 PM',
    actor: 'You',
    role: 'Policyholder',
    description: 'Uploaded the FIR copy and photos of the damage.',
    icon: <IconUpload />,
    tone: 'none',
  },
  {
    id: 'adjuster-assigned',
    time: 'Tue, 22 Sep · 6:50 PM',
    actor: 'System',
    role: 'Automated',
    description: 'Assigned the claim to adjuster Priya Nair.',
    icon: <IconUserPlus />,
    tone: 'none',
  },
  {
    id: 'claim-filed',
    time: 'Tue, 22 Sep · 6:32 PM',
    actor: 'You',
    role: 'Policyholder',
    description: 'Filed the claim for accidental damage.',
    icon: <IconFile />,
    tone: 'none',
  },
];

export default function Screen() {
  const [estimateUploaded, setEstimateUploaded] = useState(false);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Eyebrow lead="rule">Motor own-damage · Policy PL-88213042</Eyebrow>
        <div className={styles.headerRow}>
          <h1 className={styles.title}>Claim CLM-2049183</h1>
          <Badge
            tone={estimateUploaded ? 'info' : 'warning'}
            variant="status"
          >
            {estimateUploaded ? 'In review' : 'Awaiting your document'}
          </Badge>
        </div>
        <Steps
          steps={stages}
          current="review"
          aria-label="Claim progress"
          completedLabel="completed"
        />
      </header>

      <Card>
        <CardHeader divider>
          <CardTitle level={2}>Activity timeline</CardTitle>
          <CardDescription>Newest first</CardDescription>
        </CardHeader>
        <CardContent>
          <ol className={styles.timeline}>
            {events.map((event, index) => (
              <li key={event.id} className={styles.item}>
                <div className={styles.markerCol}>
                  <IconTile tint={event.tone} size="sm">
                    {event.icon}
                  </IconTile>
                  {index < events.length - 1 && <div className={styles.line} />}
                </div>
                <div className={styles.content}>
                  <div className={styles.itemTop}>
                    <span className={styles.time}>{event.time}</span>
                    {event.current && (
                      <Badge tone="brand" variant="soft" size="sm">
                        Current stage
                      </Badge>
                    )}
                  </div>
                  <p className={styles.description}>{event.description}</p>
                  <div className={styles.actor}>
                    <Avatar name={event.actor} size="sm" alt="" />
                    <span>
                      {event.actor} · {event.role}
                    </span>
                  </div>
                  {event.id === 'estimate-requested' && (
                    <div className={styles.actionRow}>
                      {estimateUploaded ? (
                        <Alert tone="success" title="Estimate uploaded">
                          We received your repair estimate. Priya will review it next.
                        </Alert>
                      ) : (
                        <Alert
                          tone="warning"
                          title="Your action is needed"
                          action={
                            <Button size="sm" onPress={() => setEstimateUploaded(true)}>
                              Upload estimate
                            </Button>
                          }
                        >
                          Add the repair estimate from the garage so we can continue reviewing
                          your claim.
                        </Alert>
                      )}
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

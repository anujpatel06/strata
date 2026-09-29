'use client';

import { useState } from 'react';
import {
  Accordion,
  AccordionItem,
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  IconTile,
  ProgressBar,
} from '@syntara/react';
import {
  IconBuilding,
  IconCircleCheck,
  IconClock,
  IconCreditCard,
  IconLock,
  IconMail,
  IconPlayerPlay,
  IconPlug,
  IconUsers,
} from '@syntara/icons';
import styles from './Screen.module.css';

type StepStatus = 'done' | 'todo' | 'locked';

interface Step {
  id: string;
  title: string;
  summary: string;
  involves: string[];
  status: StepStatus;
  icon: React.ReactNode;
  requires?: string;
}

const steps: Step[] = [
  {
    id: 'verify-email',
    title: 'Verify your email',
    summary: 'Confirm the address you signed up with.',
    involves: [
      'Open the message we sent to your inbox.',
      'Select the confirmation link inside it.',
    ],
    status: 'done',
    icon: <IconMail aria-hidden />,
  },
  {
    id: 'business-details',
    title: 'Confirm your business details',
    summary: 'Tell us your legal name and registered address.',
    involves: [
      'Enter your registered business name.',
      'Add your business address for invoices.',
    ],
    status: 'done',
    icon: <IconBuilding aria-hidden />,
  },
  {
    id: 'payment-method',
    title: 'Add a payment method',
    summary: 'Add a card or bank account for billing.',
    involves: [
      'Add a card or link a bank account.',
      'Choose it as your default payment method.',
    ],
    status: 'todo',
    icon: <IconCreditCard aria-hidden />,
  },
  {
    id: 'invite-team',
    title: 'Invite your team',
    summary: 'Bring in the people who will work in this account.',
    involves: [
      'Enter teammates’ email addresses.',
      'Assign each person a role.',
    ],
    status: 'todo',
    icon: <IconUsers aria-hidden />,
  },
  {
    id: 'connect-integration',
    title: 'Connect your first integration',
    summary: 'Link a tool so billing and usage stay in sync.',
    involves: [
      'Pick an integration from the catalogue.',
      'Authorise access and confirm the connection.',
    ],
    status: 'locked',
    icon: <IconPlug aria-hidden />,
    requires: 'Add a payment method',
  },
];

const statusCopy: Record<StepStatus, string> = {
  done: 'Done',
  todo: 'To do',
  locked: 'Locked',
};

function StepIcon({ status, icon }: { status: StepStatus; icon: React.ReactNode }) {
  if (status === 'done') {
    return (
      <IconTile tint="success">
        <IconCircleCheck aria-hidden />
      </IconTile>
    );
  }
  if (status === 'locked') {
    return (
      <IconTile tint="none">
        <IconLock aria-hidden />
      </IconTile>
    );
  }
  return <IconTile tint="brand">{icon}</IconTile>;
}

function StepBadge({ status }: { status: StepStatus }) {
  if (status === 'done') {
    return (
      <Badge tone="success" icon={<IconCircleCheck aria-hidden />}>
        {statusCopy.done}
      </Badge>
    );
  }
  if (status === 'locked') {
    return (
      <Badge tone="neutral" icon={<IconLock aria-hidden />}>
        {statusCopy.locked}
      </Badge>
    );
  }
  return (
    <Badge tone="info" icon={<IconClock aria-hidden />}>
      {statusCopy.todo}
    </Badge>
  );
}

export default function Screen() {
  const [started, setStarted] = useState<Record<string, boolean>>({});
  const doneCount = steps.filter((step) => step.status === 'done').length;

  return (
    <div className={styles.page}>
      <Card className={styles.card}>
        <CardHeader>
          <CardTitle level={1}>Finish setting up your account</CardTitle>
          <CardDescription>
            Complete these steps to unlock every feature.
          </CardDescription>
        </CardHeader>
        <CardContent className={styles.content}>
          <ProgressBar
            label="Setup progress"
            value={doneCount}
            minValue={0}
            maxValue={steps.length}
            valueLabel={`${doneCount} of ${steps.length} done`}
            showValue
          />

          <Accordion allowsMultipleExpanded className={styles.accordion}>
            {steps.map((step) => (
              <AccordionItem
                key={step.id}
                id={step.id}
                title={
                  <span className={styles.stepHeader}>
                    <StepIcon status={step.status} icon={step.icon} />
                    <span className={styles.stepTitleText}>{step.title}</span>
                    <StepBadge status={step.status} />
                  </span>
                }
              >
                <div className={styles.stepBody}>
                  <p className={styles.stepSummary}>{step.summary}</p>
                  <p className={styles.involvesLabel}>What this involves</p>
                  <ul className={styles.involvesList}>
                    {step.involves.map((line) => (
                      <li key={line}>{line}</li>
                    ))}
                  </ul>

                  {step.status === 'locked' && (
                    <p className={styles.lockedNote}>
                      <IconLock aria-hidden />
                      Locked until you finish &ldquo;{step.requires}&rdquo;.
                    </p>
                  )}

                  <Button
                    size="sm"
                    isDisabled={
                      step.status === 'done' ||
                      step.status === 'locked' ||
                      started[step.id]
                    }
                    onPress={() => setStarted((prev) => ({ ...prev, [step.id]: true }))}
                  >
                    {step.status === 'todo' && !started[step.id] && <IconPlayerPlay aria-hidden />}
                    {step.status === 'done'
                      ? 'Completed'
                      : step.status === 'locked'
                        ? 'Locked'
                        : started[step.id]
                          ? 'Started'
                          : 'Start'}
                  </Button>
                </div>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>
    </div>
  );
}

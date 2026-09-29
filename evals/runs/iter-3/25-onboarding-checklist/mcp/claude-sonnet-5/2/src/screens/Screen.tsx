import { useState } from 'react';
import {
  Accordion,
  AccordionItem,
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Eyebrow,
  IconTile,
  ProgressBar,
} from '@syntara/react';
import { IconCircleCheck, IconLayoutList, IconLock } from '@syntara/icons';
import styles from './Screen.module.css';

type StepStatus = 'done' | 'todo' | 'locked';

interface OnboardingStep {
  id: string;
  title: string;
  summary: string;
  involves: string[];
  status: StepStatus;
  requires?: string;
}

const steps: OnboardingStep[] = [
  {
    id: 'verify-email',
    title: 'Verify your email',
    summary: 'Confirm the email address you signed up with.',
    involves: [
      'Open the confirmation email we sent you',
      'Select the verification link inside it',
    ],
    status: 'done',
  },
  {
    id: 'profile',
    title: 'Complete your profile',
    summary: 'Add your name, role and a photo so your team recognises you.',
    involves: ['Add your full name and job title', 'Upload a profile photo'],
    status: 'done',
  },
  {
    id: 'invite-team',
    title: 'Invite your team',
    summary: 'Bring in the people who will work with you on this account.',
    involves: [
      'Enter teammates’ email addresses',
      'Choose a role for each person',
      'Send the invitations',
    ],
    status: 'todo',
  },
  {
    id: 'payment-method',
    title: 'Connect a payment method',
    summary: 'Add a card or bank account so billing can start.',
    involves: [
      'Enter your card or bank details',
      'Confirm the billing address',
    ],
    status: 'locked',
    requires: 'invite-team',
  },
  {
    id: 'two-factor',
    title: 'Turn on two-factor authentication',
    summary: 'Add a second step to sign-in to keep the account secure.',
    involves: [
      'Install an authenticator app',
      'Scan the setup code and confirm it',
    ],
    status: 'todo',
  },
];

const stepById = new Map(steps.map((step) => [step.id, step]));
const doneCount = steps.filter((step) => step.status === 'done').length;

function statusBadge(status: StepStatus) {
  if (status === 'done') {
    return (
      <Badge tone="success" variant="soft" icon={<IconCircleCheck aria-hidden />}>
        Done
      </Badge>
    );
  }
  if (status === 'locked') {
    return (
      <Badge tone="neutral" variant="soft" icon={<IconLock aria-hidden />}>
        Locked
      </Badge>
    );
  }
  return (
    <Badge tone="info" variant="soft">
      To do
    </Badge>
  );
}

function StepTitle({ step }: { step: OnboardingStep }) {
  return (
    <div className={styles.stepTitle}>
      <IconTile
        size="sm"
        tint={step.status === 'done' ? 'success' : step.status === 'locked' ? 'none' : 'info'}
      >
        {step.status === 'done' ? <IconCircleCheck /> : step.status === 'locked' ? <IconLock /> : <IconLayoutList />}
      </IconTile>
      <span className={styles.stepTitleText}>{step.title}</span>
      {statusBadge(step.status)}
    </div>
  );
}

export default function Screen() {
  const [startedIds, setStartedIds] = useState<Set<string>>(new Set());

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Eyebrow lead="rule" tone="accent">
          Getting started
        </Eyebrow>
        <h1 className={styles.heading}>Set up your account</h1>
        <p className={styles.description}>
          Finish these steps to get the most out of your account. You can come back and pick up
          where you left off at any time.
        </p>
      </header>

      <div className={styles.progressCard}>
        <Card>
          <CardHeader>
            <CardTitle level={2}>Setup progress</CardTitle>
          </CardHeader>
          <CardContent>
            <ProgressBar
              label="Steps completed"
              value={doneCount}
              maxValue={steps.length}
              valueLabel={`${doneCount} of ${steps.length} steps`}
              showValue
            />
          </CardContent>
        </Card>
      </div>

      <Accordion defaultExpandedKeys={['invite-team']}>
        {steps.map((step) => {
          const requiredStep = step.requires ? stepById.get(step.requires) : undefined;
          const hasStarted = startedIds.has(step.id);

          return (
            <AccordionItem key={step.id} id={step.id} title={<StepTitle step={step} />}>
              <div className={styles.stepContent}>
                <p className={styles.stepSummary}>{step.summary}</p>

                <div>
                  <p className={styles.involvesLabel}>What this involves</p>
                  <ul className={styles.involvesList}>
                    {step.involves.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>

                {step.status === 'locked' && requiredStep ? (
                  <p className={styles.lockedNote}>
                    <IconLock aria-hidden className={styles.lockedIcon} />
                    Locked until you finish &ldquo;{requiredStep.title}&rdquo;.
                  </p>
                ) : null}

                <div className={styles.stepActions}>
                  {step.status === 'done' ? (
                    <Button variant="outline" size="sm">
                      Review
                    </Button>
                  ) : step.status === 'locked' ? (
                    <Button variant="outline" size="sm" isDisabled>
                      Start
                    </Button>
                  ) : (
                    <Button
                      variant="primary"
                      size="sm"
                      onPress={() =>
                        setStartedIds((prev) => new Set(prev).add(step.id))
                      }
                    >
                      {hasStarted ? 'Continue' : 'Start'}
                    </Button>
                  )}
                </div>
              </div>
            </AccordionItem>
          );
        })}
      </Accordion>
    </div>
  );
}

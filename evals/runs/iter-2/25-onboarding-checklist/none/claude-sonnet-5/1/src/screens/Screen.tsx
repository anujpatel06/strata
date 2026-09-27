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
} from '@strata/react';
import {
  IconCash,
  IconCircleCheck,
  IconLock,
  IconMail,
  IconShieldLock,
  IconUser,
  IconUsers,
} from '@strata/icons';
import styles from './Screen.module.css';

interface OnboardingStep {
  id: string;
  title: string;
  summary: string;
  details: string[];
  icon: typeof IconMail;
  /** Id of a step that must be done before this one unlocks. */
  requires?: string;
}

const STEPS: OnboardingStep[] = [
  {
    id: 'verify-email',
    title: 'Verify your email',
    summary: 'Confirm the address you signed up with.',
    details: [
      'Open the confirmation email we sent to your inbox.',
      'Click the verification link inside it.',
      'Come back here — this step ticks itself off once it’s confirmed.',
    ],
    icon: IconMail,
  },
  {
    id: 'profile',
    title: 'Complete your profile',
    summary: 'Add your name, role and a photo so teammates recognise you.',
    details: [
      'Add your full name and job title.',
      'Upload a profile photo.',
      'Set your working hours and time zone.',
    ],
    icon: IconUser,
  },
  {
    id: 'invite-team',
    title: 'Invite your teammates',
    summary: 'Bring in the people who’ll work in this account with you.',
    details: [
      'Enter the email addresses of the people you want to invite.',
      'Choose a role for each person.',
      'We’ll email them a link to join.',
    ],
    icon: IconUsers,
  },
  {
    id: 'billing',
    title: 'Connect a payment method',
    summary: 'Add a card or bank account so paid features keep working after your trial.',
    details: [
      'Add a card or link a bank account.',
      'Choose who on your team gets billing emails.',
      'Review your plan and billing cycle.',
    ],
    icon: IconCash,
  },
  {
    id: 'security',
    title: 'Turn on security policies',
    summary: 'Set password rules and two-factor sign-in for everyone on the account.',
    details: [
      'Require two-factor authentication for all members.',
      'Set a minimum password strength.',
      'Choose how long people can stay signed in before they’re asked again.',
    ],
    icon: IconShieldLock,
    requires: 'billing',
  },
];

const INITIAL_DONE = new Set(['verify-email', 'profile']);
const firstToDo = STEPS.find((step) => !INITIAL_DONE.has(step.id));

export default function Screen() {
  const [doneIds, setDoneIds] = useState(INITIAL_DONE);

  const doneCount = doneIds.size;
  const total = STEPS.length;

  function markDone(id: string) {
    setDoneIds((prev) => new Set(prev).add(id));
  }

  return (
    <Card className={styles.card}>
      <CardHeader>
        <CardTitle>Finish setting up your account</CardTitle>
        <CardDescription>Work through these steps to get everything ready.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className={styles.progress}>
          <ProgressBar label="Overall progress" value={doneCount} maxValue={total} showValue />
          <p className={styles.progressCaption}>
            {doneCount} of {total} steps complete
          </p>
        </div>

        <Accordion
          className={styles.accordion}
          defaultExpandedKeys={firstToDo ? [firstToDo.id] : []}
          aria-label="Onboarding steps"
        >
          {STEPS.map((step) => {
            const isDone = doneIds.has(step.id);
            const requiredStep = step.requires ? STEPS.find((s) => s.id === step.requires) : undefined;
            const isLocked = Boolean(requiredStep && !doneIds.has(requiredStep.id));
            const Icon = step.icon;

            return (
              <AccordionItem
                key={step.id}
                id={step.id}
                title={
                  <span className={styles.stepHeading}>
                    <IconTile size="sm" tint={isDone ? 'success' : isLocked ? 'none' : 'brand'}>
                      {isDone ? <IconCircleCheck /> : isLocked ? <IconLock /> : <Icon />}
                    </IconTile>
                    <span className={styles.stepHeadingText}>
                      <span className={styles.stepTitle}>{step.title}</span>
                      <span className={styles.stepSummary}>
                        {isLocked ? `Unlocks once you finish “${requiredStep!.title}”.` : step.summary}
                      </span>
                    </span>
                    <Badge tone={isDone ? 'success' : isLocked ? 'neutral' : 'brand'} variant="soft" size="sm">
                      {isDone ? 'Done' : isLocked ? 'Locked' : 'To do'}
                    </Badge>
                  </span>
                }
              >
                <div className={styles.stepBody}>
                  <p className={styles.stepBodyIntro}>This step involves:</p>
                  <ul className={styles.detailList}>
                    {step.details.map((detail) => (
                      <li key={detail}>{detail}</li>
                    ))}
                  </ul>
                  {isLocked && (
                    <p className={styles.lockedNote}>
                      <IconLock size={16} />
                      Complete “{requiredStep!.title}” first to unlock this step.
                    </p>
                  )}
                  <div className={styles.actions}>
                    <Button
                      variant={isDone ? 'outline' : 'primary'}
                      isDisabled={isLocked}
                      onPress={() => markDone(step.id)}
                    >
                      {isDone ? 'Review' : isLocked ? 'Locked' : 'Start'}
                    </Button>
                  </div>
                </div>
              </AccordionItem>
            );
          })}
        </Accordion>
      </CardContent>
    </Card>
  );
}

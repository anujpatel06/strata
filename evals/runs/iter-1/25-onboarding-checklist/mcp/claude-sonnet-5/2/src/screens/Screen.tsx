import { useState } from 'react';
import {
  Accordion,
  AccordionItem,
  Badge,
  Button,
  Eyebrow,
  IconTile,
  ProgressBar,
} from '@strata/react';
import {
  IconCheck,
  IconCreditCard,
  IconLock,
  IconMailOpened,
  IconShieldLock,
  IconUserPlus,
  IconUserCircle,
} from '@strata/icons';
import styles from './Screen.module.css';

interface OnboardingStep {
  id: string;
  title: string;
  summary: string;
  involves: string[];
  icon: React.ReactNode;
  /** id of the step that must be done first; undefined means never locked */
  requires?: string;
}

const STEPS: OnboardingStep[] = [
  {
    id: 'verify-email',
    title: 'Verify your email',
    summary: 'Confirm your address so we can reach you about your account.',
    involves: [
      'Open the confirmation email we sent you',
      'Select the verification link inside it',
    ],
    icon: <IconMailOpened aria-hidden />,
  },
  {
    id: 'payment-method',
    title: 'Add a payment method',
    summary: 'Add a card or bank account so there is no interruption once your trial ends.',
    involves: [
      'Enter your card or bank details',
      'Confirm the billing address on file',
    ],
    icon: <IconCreditCard aria-hidden />,
  },
  {
    id: 'two-factor',
    title: 'Set up two-factor authentication',
    summary: 'Add a second sign-in step to keep your account secure.',
    involves: [
      'Install an authenticator app on your phone',
      'Scan the QR code and enter the six-digit code',
      'Save your backup codes somewhere safe',
    ],
    icon: <IconShieldLock aria-hidden />,
  },
  {
    id: 'invite-team',
    title: 'Invite your team',
    summary: 'Bring your teammates in so they can start collaborating.',
    involves: [
      'Enter your teammates’ email addresses',
      'Choose a role for each person',
      'Send the invitations',
    ],
    icon: <IconUserPlus aria-hidden />,
    requires: 'two-factor',
  },
  {
    id: 'profile',
    title: 'Complete your profile',
    summary: 'Add a photo and a few details so your teammates recognise you.',
    involves: [
      'Upload a profile photo',
      'Add your job title and time zone',
    ],
    icon: <IconUserCircle aria-hidden />,
  },
];

const INITIALLY_DONE = ['verify-email', 'payment-method'];

export default function Screen() {
  const [doneIds, setDoneIds] = useState<Set<string>>(() => new Set(INITIALLY_DONE));

  const doneCount = doneIds.size;
  const totalCount = STEPS.length;
  const firstOpenStep = STEPS.find((step) => !doneIds.has(step.id));

  const markDone = (id: string) => {
    setDoneIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Eyebrow tone="accent">Getting started</Eyebrow>
        <h1 className={styles.title}>Finish setting up your account</h1>
        <p className={styles.subtitle}>
          Complete these steps to unlock everything on your plan.
        </p>
      </header>

      <div className={styles.progress}>
        <ProgressBar
          label="Setup progress"
          value={doneCount}
          maxValue={totalCount}
          valueLabel={`${doneCount} of ${totalCount} steps`}
          showValue
        />
      </div>

      <Accordion
        allowsMultipleExpanded
        defaultExpandedKeys={firstOpenStep ? [firstOpenStep.id] : []}
      >
        {STEPS.map((step) => {
          const isDone = doneIds.has(step.id);
          const requiredStep = step.requires
            ? STEPS.find((other) => other.id === step.requires)
            : undefined;
          const isLocked = Boolean(requiredStep) && !doneIds.has(requiredStep!.id);

          return (
            <AccordionItem
              key={step.id}
              id={step.id}
              title={
                <span className={styles.itemTitle}>
                  <IconTile
                    size="sm"
                    tint={isDone ? 'success' : isLocked ? 'none' : 'brand'}
                  >
                    {isDone ? <IconCheck aria-hidden /> : step.icon}
                  </IconTile>
                  <span className={styles.itemTitleText}>{step.title}</span>
                  {isDone && (
                    <Badge tone="success" variant="soft" icon={<IconCheck aria-hidden />}>
                      Completed
                    </Badge>
                  )}
                  {!isDone && isLocked && (
                    <Badge tone="neutral" variant="soft" icon={<IconLock aria-hidden />}>
                      Locked
                    </Badge>
                  )}
                </span>
              }
            >
              <div className={styles.itemBody}>
                <p className={styles.itemSummary}>{step.summary}</p>
                <p className={styles.itemLabel}>What this involves</p>
                <ul className={styles.itemList}>
                  {step.involves.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>

                <div className={styles.itemFooter}>
                  {isDone ? (
                    <Button variant="secondary" isDisabled>
                      Completed
                    </Button>
                  ) : (
                    <Button
                      variant="primary"
                      isDisabled={isLocked}
                      onPress={() => markDone(step.id)}
                    >
                      Start
                    </Button>
                  )}
                  {isLocked && requiredStep && (
                    <p className={styles.lockedNote}>
                      <IconLock aria-hidden />
                      Locked until you finish &ldquo;{requiredStep.title}&rdquo;.
                    </p>
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

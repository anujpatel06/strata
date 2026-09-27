'use client';

import { useState } from 'react';
import {
  Accordion,
  AccordionItem,
  Badge,
  Button,
  Card,
  CardContent,
  Eyebrow,
  IconTile,
  ProgressBar,
} from '@strata/react';
import {
  IconCheck,
  IconCreditCard,
  IconDeviceMobile,
  IconLock,
  IconMail,
  IconShieldCheck,
  IconUserPlus,
  type Icon as StrataIcon,
} from '@strata/icons';
import styles from './Screen.module.css';

type StepId = 'email' | 'phone' | 'payment' | 'twoFactor' | 'team';
type Status = 'done' | 'locked' | 'available';

interface Step {
  id: StepId;
  title: string;
  summary: string;
  details: string[];
  icon: StrataIcon;
  /** Another step's id that must be done first. */
  requires?: StepId;
}

const steps: Step[] = [
  {
    id: 'email',
    title: 'Verify your email address',
    summary: 'Confirm you own the email on your account.',
    icon: IconMail,
    details: [
      'We sent a confirmation link to your inbox',
      'Open the email and click the link',
      'Takes less than a minute',
    ],
  },
  {
    id: 'phone',
    title: 'Verify your phone number',
    summary: 'Add a number we can use for sign-in and recovery.',
    icon: IconDeviceMobile,
    details: [
      'Enter a mobile number',
      'Confirm the 6-digit code we text you',
      'Used for sign-in alerts and account recovery',
    ],
  },
  {
    id: 'payment',
    title: 'Add a payment method',
    summary: 'Add a card or bank account to activate billing.',
    icon: IconCreditCard,
    details: [
      'Add a card or bank account',
      'We verify it with a small temporary hold',
      "You won't be charged until your trial ends",
    ],
  },
  {
    id: 'twoFactor',
    title: 'Set up two-factor authentication',
    summary: 'Add a second step to sign-in to keep your account safe.',
    icon: IconShieldCheck,
    details: [
      'Choose an authenticator app or text messages',
      'Scan a QR code or enter the setup key',
      'Save your backup codes somewhere safe',
    ],
  },
  {
    id: 'team',
    title: 'Invite your team',
    summary: 'Bring your teammates in and assign roles.',
    icon: IconUserPlus,
    requires: 'payment',
    details: [
      'Add teammates by email',
      'Assign each person a role',
      "They'll get an email invite to join",
    ],
  },
];

const titleOf = (id: StepId) => steps.find((step) => step.id === id)?.title ?? '';

export default function Screen() {
  const [doneIds, setDoneIds] = useState<Set<StepId>>(() => new Set<StepId>(['email', 'phone']));

  const statusOf = (step: Step): Status => {
    if (doneIds.has(step.id)) return 'done';
    if (step.requires && !doneIds.has(step.requires)) return 'locked';
    return 'available';
  };

  const toggleDone = (id: StepId) => {
    setDoneIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const doneCount = doneIds.size;
  const totalCount = steps.length;
  const firstOpenStep = steps.find((step) => statusOf(step) !== 'done') ?? steps[0];

  return (
    <div className={styles.root}>
      <header className={styles.header}>
        <Eyebrow lead="rule" tone="accent">
          Getting started
        </Eyebrow>
        <h1 className={styles.title}>Set up your account</h1>
        <p className={styles.lede}>Complete these steps to finish setting up and unlock every feature.</p>
      </header>

      <Card variant="feature" className={styles.progressCard}>
        <CardContent className={styles.progressBody}>
          <p className={styles.progressFigure}>
            {doneCount} of {totalCount} steps done
          </p>
          <ProgressBar
            aria-label="Onboarding progress"
            value={doneCount}
            maxValue={totalCount}
            valueLabel={`${doneCount} of ${totalCount} steps done`}
          />
        </CardContent>
      </Card>

      <h2 className={styles.sectionTitle}>Setup steps</h2>

      <Accordion allowsMultipleExpanded defaultExpandedKeys={[firstOpenStep.id]} className={styles.list}>
        {steps.map((step) => {
          const status = statusOf(step);
          const Icon = step.icon;
          return (
            <Card key={step.id} variant="outline" className={styles.row} data-status={status}>
              <AccordionItem
                id={step.id}
                headingLevel={3}
                title={
                  <span className={styles.glance}>
                    <IconTile tint={status === 'done' ? 'success' : status === 'locked' ? 'none' : 'brand'} size="md">
                      <Icon aria-hidden="true" />
                    </IconTile>
                    <span className={styles.mid}>
                      <span className={styles.name}>{step.title}</span>
                      <span className={styles.summary}>{step.summary}</span>
                    </span>
                    <span className={styles.state}>
                      {status === 'done' && (
                        <Badge variant="status" tone="success">
                          Done
                        </Badge>
                      )}
                      {status === 'locked' && (
                        <Badge variant="status" tone="neutral">
                          Locked
                        </Badge>
                      )}
                      {status === 'available' && (
                        <Badge variant="status" tone="info">
                          Not started
                        </Badge>
                      )}
                    </span>
                  </span>
                }
              >
                <div className={styles.panel}>
                  <p className={styles.involvesLabel}>What this involves</p>
                  <ul className={styles.detailList}>
                    {step.details.map((detail) => (
                      <li key={detail}>{detail}</li>
                    ))}
                  </ul>

                  {status === 'locked' && step.requires && (
                    <p className={styles.lockedNote}>
                      <IconLock aria-hidden="true" className={styles.lockedIcon} />
                      Finish &ldquo;{titleOf(step.requires)}&rdquo; first to unlock this step.
                    </p>
                  )}

                  <div className={styles.actions}>
                    {status === 'done' && (
                      <Button variant="outline" onPress={() => toggleDone(step.id)}>
                        <IconCheck aria-hidden="true" />
                        Mark as not done
                      </Button>
                    )}
                    {status === 'available' && (
                      <Button variant="primary" onPress={() => toggleDone(step.id)}>
                        Start
                      </Button>
                    )}
                    {status === 'locked' && (
                      <Button variant="outline" isDisabled aria-label={`${step.title} — locked`}>
                        <IconLock aria-hidden="true" />
                        Locked
                      </Button>
                    )}
                  </div>
                </div>
              </AccordionItem>
            </Card>
          );
        })}
      </Accordion>
    </div>
  );
}

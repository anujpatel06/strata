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
  ProgressBar,
} from '@strata/react';
import { IconCheck, IconLock } from '@strata/icons';
import styles from './Screen.module.css';

interface StepData {
  id: string;
  title: string;
  description: string;
  actionLabel: string;
  requires?: string;
}

const STEPS: StepData[] = [
  {
    id: 'verify-email',
    title: 'Verify your email address',
    description: 'Confirm the email address you signed up with so we can send you account and security notices.',
    actionLabel: 'Verify email',
  },
  {
    id: 'add-payment',
    title: 'Add a payment method',
    description: 'Add a card or bank account so your plan keeps running once the trial ends.',
    actionLabel: 'Add payment method',
  },
  {
    id: 'invite-team',
    title: 'Invite your team',
    description: 'Bring in the people who will work in this account. You can assign roles later.',
    actionLabel: 'Invite teammates',
  },
  {
    id: 'set-preferences',
    title: 'Set your notification preferences',
    description: 'Choose which updates you want by email and which ones can wait for the weekly digest.',
    actionLabel: 'Set preferences',
  },
  {
    id: 'connect-integration',
    title: 'Connect an integration',
    description: 'Link a calendar or chat tool so teammates can pick up notifications where they already work.',
    actionLabel: 'Connect integration',
    requires: 'invite-team',
  },
];

const INITIAL_DONE: Record<string, boolean> = {
  'verify-email': true,
  'add-payment': true,
};

export default function Screen() {
  const [done, setDone] = useState<Record<string, boolean>>(INITIAL_DONE);

  const doneCount = STEPS.filter((step) => done[step.id]).length;

  const markDone = (id: string) => {
    setDone((prev) => ({ ...prev, [id]: true }));
  };

  return (
    <div className={styles.page}>
      <Card className={styles.card}>
        <CardHeader>
          <CardTitle level={1}>Finish setting up your account</CardTitle>
          <CardDescription>Complete these steps to get the most out of your account.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className={styles.progressRow}>
            <ProgressBar
              label="Setup progress"
              value={doneCount}
              minValue={0}
              maxValue={STEPS.length}
              valueLabel={`${doneCount} of ${STEPS.length} steps done`}
              showValue
            />
          </div>

          <Accordion allowsMultipleExpanded className={styles.accordion}>
            {STEPS.map((step) => {
              const isDone = Boolean(done[step.id]);
              const isLocked = Boolean(step.requires && !done[step.requires]);
              const requiredStep = step.requires ? STEPS.find((s) => s.id === step.requires) : undefined;

              return (
                <AccordionItem
                  key={step.id}
                  id={step.id}
                  title={
                    <span className={styles.stepTitle}>
                      <span>{step.title}</span>
                      {isDone && (
                        <Badge tone="success" icon={<IconCheck aria-hidden />}>
                          Done
                        </Badge>
                      )}
                      {isLocked && (
                        <Badge tone="neutral" icon={<IconLock aria-hidden />}>
                          Locked
                        </Badge>
                      )}
                    </span>
                  }
                >
                  <div className={styles.stepBody}>
                    <p className={styles.stepDescription}>{step.description}</p>
                    {isLocked ? (
                      <p className={styles.lockNote}>
                        <IconLock aria-hidden />
                        Locked until you finish &ldquo;{requiredStep?.title}&rdquo;.
                      </p>
                    ) : isDone ? (
                      <Button variant="outline" isDisabled>
                        Completed
                      </Button>
                    ) : (
                      <Button onPress={() => markDone(step.id)}>{step.actionLabel}</Button>
                    )}
                  </div>
                </AccordionItem>
              );
            })}
          </Accordion>
        </CardContent>
      </Card>
    </div>
  );
}
